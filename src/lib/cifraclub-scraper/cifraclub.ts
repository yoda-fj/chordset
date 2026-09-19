import { chromium, Browser, Page } from 'playwright';
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
        await page.waitForSelector('pre[data-chord-content]', { timeout: 15000 });

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
    // O Cifra Club usa classes hashed (CSS modules) que mudam a cada build —
    // os seletores abaixo miram estrutura/atributos estáveis, não classes.
    const details = await page.evaluate(() => {
      // Título: h1 da página, removendo ícones (ex.: selo de verificado)
      let name = '';
      const h1 = document.querySelector('h1');
      if (h1) {
        const clone = h1.cloneNode(true) as HTMLElement;
        clone.querySelectorAll('.icon, [data-icon]').forEach(el => el.remove());
        name = clone.textContent?.trim() ?? '';
      }

      // Artista: link para a página do artista (slug vem da URL atual)
      const artistSlug = location.pathname.split('/').filter(Boolean)[0];
      let artist = '';
      if (artistSlug) {
        const link = document.querySelector(`a[href="/${artistSlug}/"], a[href="/${artistSlug}"]`);
        artist = link?.textContent?.trim() ?? '';
      }

      // Tom: span com texto "Tom:" seguido de botão com a nota
      let key = '';
      const tomSpan = Array.from(document.querySelectorAll('span'))
        .find(s => /^Tom:\s*$/.test(s.textContent?.trim() ?? ''));
      const keyText = tomSpan?.nextElementSibling?.textContent?.trim() ?? '';
      const keyMatch = keyText.match(/^([A-G][#b]?m?)$/);
      if (keyMatch) key = keyMatch[1];

      // YouTube: iframe de player embutido, se houver
      const ytSrc = document.querySelector('iframe[src*="youtube.com/embed/"]')?.getAttribute('src') ?? '';
      const videoId = ytSrc.split('/embed/')[1]?.split(/[?/]/)[0] ?? '';

      return { name, artist, key, videoId };
    });

    result.name = details.name;
    result.artist = details.artist;
    result.youtube_url = details.videoId ? `https://www.youtube.com/watch?v=${details.videoId}` : '';
    if (details.key) {
      result.key = details.key.toUpperCase();
    }
  }

  private async getCifra(page: Page, result: Partial<CifraResult>): Promise<void> {
    // A cifra está em <pre data-chord-content>; cada linha é um <div> filho
    // e cada acorde um <b data-chord-name>. Extrai o texto linha a linha,
    // marcando blocos de tablatura com [Tab]...[/Tab].
    const lines = await page.evaluate(() => {
      const pre = document.querySelector('pre[data-chord-content]');
      if (!pre) return null;

      // Clona para não modificar o DOM
      const clone = pre.cloneNode(true) as HTMLElement;

      // Substitui blocos de tablatura por marcador de texto
      clone.querySelectorAll('.tabs').forEach(tab => {
        tab.replaceWith(document.createTextNode('[Tab]' + (tab.textContent ?? '') + '[/Tab]'));
      });

      const lines: string[] = [];
      clone.childNodes.forEach(node => {
        lines.push(...(node.textContent ?? '').split('\n'));
      });
      return lines;
    });

    if (!lines) {
      result.cifra = [];
      return;
    }

    // Remove linhas vazias só das bordas (as internas separam estrofes)
    while (lines.length && !lines[0].trim()) lines.shift();
    while (lines.length && !lines[lines.length - 1].trim()) lines.pop();

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
