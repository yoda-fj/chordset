import { chromium, Browser, Page } from 'playwright';
import * as cheerio from 'cheerio';
import { CifraResponse, CifraResult } from './types';

const BASE_URL = 'https://www.cifraclub.com.br/';

export class CifraClubScraper {
  private browser: Browser | null = null;

  // Mutex simples (fila em memória) serializando scrapes.
  // Cada scrape só começa quando o anterior termina (sucesso ou erro).
  private queue: Promise<unknown> = Promise.resolve();

  private enqueue<T>(fn: () => Promise<T>): Promise<T> {
    const run = this.queue.then(fn, fn);
    // A fila nunca rejeita, senão travaria os próximos scrapes
    this.queue = run.catch(() => {});
    return run;
  }

  private async getBrowser(): Promise<Browser> {
    if (this.browser && this.browser.isConnected()) {
      return this.browser;
    }
    this.browser = null;
    const launchArgs: string[] = [];
    const browser = await chromium.launch({
      headless: true,
      args: launchArgs,
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH,
    });
    // Se o browser morrer (crash, OOM, kill), limpa a referência
    // para que a próxima chamada faça re-launch em vez de usar instância morta
    browser.on('disconnected', () => {
      if (this.browser === browser) {
        this.browser = null;
      }
    });
    this.browser = browser;
    return browser;
  }

  async scrape(artist: string, song: string, version?: string): Promise<CifraResponse> {
    return this.enqueue(() => this.doScrape(artist, song, version));
  }

  private async doScrape(artist: string, song: string, version?: string): Promise<CifraResponse> {
    let url = `${BASE_URL}${artist}/${song}`;
    if (version && version !== 'principal') {
      url += `/${version}`;
    }

    try {
      const browser = await this.getBrowser();
      // Context isolado por scrape: fechar o context fecha a página junto,
      // sem derrubar o browser reutilizável
      const context = await browser.newContext();
      try {
        const page = await context.newPage();
        page.setDefaultTimeout(15000);

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForSelector('.cifra_cnt', { timeout: 15000 });

        const result: Partial<CifraResult> = { cifraclub_url: url };
        await this.getDetails(page, result);
        await this.getCifra(page, result);

        return result as CifraResult;
      } finally {
        // Fecha context+page SEMPRE (inclusive em timeout) — sem isso vazam
        // um contexto/página por importação
        await context.close().catch(() => {});
      }
    } catch (err) {
      return { cifraclub_url: url, error: (err as Error).message };
    }
  }

  private async getDetails(page: Page, result: Partial<CifraResult>): Promise<void> {
    const outerHTML = await page.evaluate(
      () => document.querySelector('.cifra')?.outerHTML ?? ''
    );
    const $ = cheerio.load(outerHTML);

    result.name = $('h1.t1').text().trim();
    result.artist = $('h2.t3').text().trim();

    const imgSrc = $('div.player-placeholder img').attr('src') ?? '';
    const videoId = imgSrc.split('/vi/')[1]?.split('/')[0] ?? '';
    result.youtube_url = videoId ? `https://www.youtube.com/watch?v=${videoId}` : '';

    // Extrair tom/chave da música
    const keyText = await page.evaluate(() => {
      const selectors = [
        '.g-ico.key span',
        '.g-ico.key',
        '[class*="key"]',
        '.cifra-key',
        '.tom',
      ];
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el) {
          const text = el.textContent?.trim() || '';
          const match = text.match(/([A-G][#b]?m?)/i);
          if (match) return match[1];
        }
      }
      const bodyText = document.body.textContent || '';
      const tomMatch = bodyText.match(/(?:Tom|Chave|Key):?\s*([A-G][#b]?m?)/i);
      if (tomMatch) return tomMatch[1];
      return '';
    });
    
    if (keyText) {
      result.key = keyText.toUpperCase();
    }
  }

  private async getCifra(page: Page, result: Partial<CifraResult>): Promise<void> {
    // Pega o HTML interno do pre para preservar a formatação dos acordes
    const cifraHtml = await page.evaluate(() => {
      const pre = document.querySelector('.cifra_cnt pre');
      if (!pre) return '';
      
      // Clona para não modificar o DOM
      const clone = pre.cloneNode(true) as HTMLElement;
      
      // Substitui <span class="tablatura"> por [Tab]...[/Tab]
      const tabs = clone.querySelectorAll('.tablatura');
      tabs.forEach(tab => {
        const tabText = '[Tab]' + tab.textContent + '[/Tab]';
        const span = document.createElement('span');
        span.textContent = tabText;
        tab.replaceWith(span);
      });
      
      // Pega o texto preservando a estrutura de linhas
      return clone.innerHTML;
    });
    
    // Processa o HTML mantendo a estrutura de acordes acima da letra
    const $ = cheerio.load(cifraHtml);
    
    // O Cifra Club usa <b> para acordes e texto normal para a letra
    // Os acordes aparecem em uma linha e a letra na linha abaixo
    // Precisamos extrair linha por linha, preservando os acordes
    
    const lines: string[] = [];
    
    // Processa cada nó filho do pre
    const preContent = $.root().find('body').html() || cifraHtml;
    
    // Divide por quebras de linha HTML
    const rawLines = preContent.split(/\n/);
    
    for (const rawLine of rawLines) {
      // Remove tags HTML mas preserva o conteúdo
      const lineText = cheerio.load(rawLine).text();
      
      // Preserva a linha se tiver conteúdo (acordes ou letra)
      if (lineText.trim()) {
        lines.push(lineText);
      }
    }
    
    // Normaliza espaços em branco
    result.cifra = lines;
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

// Singleton instance for reuse
let scraperInstance: CifraClubScraper | null = null;

export function getScraper(): CifraClubScraper {
  if (!scraperInstance) {
    scraperInstance = new CifraClubScraper();
  }
  return scraperInstance;
}
