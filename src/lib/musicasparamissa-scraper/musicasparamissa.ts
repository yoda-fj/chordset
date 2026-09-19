import * as cheerio from 'cheerio';

export interface MpmResult {
  url: string;
  name: string;
  artist: string;
  cifra: string[];
}

export interface MpmError {
  url: string;
  error: string;
}

/**
 * O h1#titulo-musica traz título + artista em dois formatos:
 *   "OUVI, SENHOR, AS PRECES DO VOSSO SERVO - (Ruzye)"
 *   "A BARCA (Padre Zezinho)"
 * Sem parênteses, a linha inteira é o título e o artista fica vazio.
 */
export function parseTitleArtist(rawTitle: string): { name: string; artist: string } {
  const match = rawTitle.match(/^(.*?)\s*(?:-\s*)?\(([^)]+)\)\s*$/);
  if (match && match[1].trim()) {
    return { name: match[1].trim(), artist: match[2].trim() };
  }
  return { name: rawTitle.trim(), artist: '' };
}

/**
 * Extrai as linhas do pre#div-cifra: acordes vêm em <b> na linha acima
 * da letra, alinhados por coluna. Linhas em branco internas são
 * preservadas (separam estrofes); só as das bordas são removidas.
 */
export function extractCifraLines(preHtml: string): string[] {
  const withBreaks = preHtml.replace(/<br\s*\/?>/gi, '\n');
  let lines: string[] = [];

  for (const rawLine of withBreaks.split('\n')) {
    lines.push(cheerio.load(rawLine).text());
  }

  // Páginas com mais de um tom embutem versões extras no mesmo pre, após
  // uma linha de pontos seguida de "TOM: X" — fica só a primeira versão.
  const sepIndex = lines.findIndex((line, i) => {
    if (!/^\.{5,}\s*$/.test(line.trim())) return false;
    return /TOM\s*:/i.test(lines.slice(i + 1, i + 4).join(' '));
  });
  if (sepIndex > 0) {
    lines = lines.slice(0, sepIndex);
  }

  while (lines.length && !lines[0].trim()) lines.shift();
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();

  return lines;
}

/**
 * Faz scraping de uma página de música do Músicas para Missa.
 * A cifra já vem no HTML server-side em pre#div-cifra (a aba "Cifra"
 * só faz show/hide via JS), então fetch + cheerio bastam.
 */
export async function scrapeMusicaParaMissa(url: string): Promise<MpmResult | MpmError> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html',
      },
    });

    if (!response.ok) {
      return { url, error: `Página não encontrada (HTTP ${response.status})` };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const titleText = $('#titulo-musica').first().text().trim();
    const { name, artist } = parseTitleArtist(titleText);
    if (!name) {
      return { url, error: 'Título não encontrado nesta página' };
    }

    const preHtml = $('#div-cifra').html();
    if (!preHtml) {
      return { url, error: 'Cifra não encontrada nesta página' };
    }

    const cifra = extractCifraLines(preHtml);
    if (cifra.length === 0) {
      return { url, error: 'Cifra vazia nesta página' };
    }

    return { url, name, artist, cifra };
  } catch (error) {
    console.error('[MusicasParaMissa] Error:', error);
    return { url, error: 'Erro ao acessar a página do Músicas para Missa' };
  }
}
