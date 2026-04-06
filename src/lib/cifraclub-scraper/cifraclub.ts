import { chromium, Browser, Page } from 'playwright';
import * as cheerio from 'cheerio';
import { CifraResponse, CifraResult } from './types';

const BASE_URL = 'https://www.cifraclub.com.br/';

export class CifraClubScraper {
  private browser: Browser | null = null;

  private async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      const launchArgs: string[] = [];
      this.browser = await chromium.launch({ 
        headless: true, 
        args: launchArgs,
        executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH,
      });
    }
    return this.browser;
  }

  async scrape(artist: string, song: string): Promise<CifraResponse> {
    const url = `${BASE_URL}${artist}/${song}`;
    let browser: Browser | null = null;

    try {
      browser = await this.getBrowser();
      const page = await browser.newPage();

      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.cifra_cnt', { timeout: 15000 });

      const result: Partial<CifraResult> = { cifraclub_url: url };
      await this.getDetails(page, result);
      await this.getCifra(page, result);

      return result as CifraResult;
    } catch (err) {
      return { cifraclub_url: url, error: (err as Error).message };
    } finally {
      // Don't close browser - keep it for reuse
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
    const outerHTML = await page.evaluate(
      () => document.querySelector('.cifra_cnt')?.outerHTML ?? ''
    );
    const $ = cheerio.load(outerHTML);
    result.cifra = $('pre').text().split('\n');
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
