import * as cheerio from 'cheerio';

export interface CifraVersion {
  type: string;
  label: string;
  url: string;
  instrument?: string;
  difficulty?: string;
}

const VERSION_LABELS: Record<string, string> = {
  'simplificada': 'Simplificada',
  'avancada': 'Avançada',
  'ao-vivo': 'Ao Vivo',
  'teclado': 'Teclado',
  'ukulele': 'Ukulele',
  'baixo': 'Baixo',
  'violao': 'Violão',
  'guitarra': 'Guitarra',
  'cavaco': 'Cavaquinho',
  'viola': 'Viola Caipira',
};

/**
 * Descobre versões disponíveis de uma música no Cifra Club
 * Faz scraping da página principal da música para encontrar links para outras versões
 */
export async function discoverVersions(artist: string, song: string): Promise<CifraVersion[]> {
  const url = `https://www.cifraclub.com.br/${artist}/${song}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const versions: CifraVersion[] = [];

    // Versão principal (sempre existe)
    const mainKey = $('.g-ico.key span').text().trim() || 
                   $('.cifra-key').text().trim() ||
                   $('meta[property="og:title"]').attr('content')?.match(/([A-G][#b]?m?)/)?.[1];
    
    versions.push({
      type: 'principal',
      label: 'Violão (Principal)',
      url: url,
      instrument: 'violao',
      difficulty: 'padrao',
    });

    // Busca por links de versões alternativas
    // O Cifra Club geralmente tem um menu ou lista de versões
    const versionSelectors = [
      '.cifra-versions a',
      '.versions-list a',
      '.version-item a',
      '[data-version] a',
      '.cifra-menu a[href*="/simplificada/"]',
      '.cifra-menu a[href*="/teclado/"]',
      '.cifra-menu a[href*="/ukulele/"]',
      '.cifra-menu a[href*="/baixo/"]',
      // Seletores mais genéricos
      'a[href*="/simplificada/"]',
      'a[href*="/teclado/"]',
      'a[href*="/ukulele/"]',
      'a[href*="/baixo/"]',
      'a[href*="/guitarra/"]',
      'a[href*="/cavaco/"]',
      'a[href*="/viola/"]',
    ];

    const foundUrls = new Set<string>();

    for (const selector of versionSelectors) {
      $(selector).each((_, el) => {
        const href = $(el).attr('href');
        if (!href) return;

        // Constrói URL absoluta
        const fullUrl = href.startsWith('http') ? href : `https://www.cifraclub.com.br${href}`;
        
        // Evita duplicados
        if (foundUrls.has(fullUrl)) return;
        foundUrls.add(fullUrl);

        // Extrai o tipo da versão da URL
        const type = extractVersionType(fullUrl);
        if (!type || type === 'principal') return;

        const label = $(el).text().trim() || VERSION_LABELS[type] || type;
        const instrument = extractInstrument(type);

        versions.push({
          type,
          label,
          url: fullUrl,
          instrument,
        });
      });
    }

    // Se não encontrou versões no HTML, tenta URLs conhecidas
    const knownVersions = ['simplificada', 'teclado', 'ukulele', 'baixo', 'guitarra', 'cavaco', 'viola'];
    
    for (const versionType of knownVersions) {
      const versionUrl = `${url}/${versionType}/`;
      
      // Verifica se a URL existe (HEAD request)
      try {
        const headResponse = await fetch(versionUrl, { 
          method: 'HEAD',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });
        
        if (headResponse.ok && !foundUrls.has(versionUrl)) {
          versions.push({
            type: versionType,
            label: VERSION_LABELS[versionType] || versionType,
            url: versionUrl,
            instrument: extractInstrument(versionType),
          });
          foundUrls.add(versionUrl);
        }
      } catch {
        // Ignora erros de verificação
      }
    }

    return versions;
  } catch (error) {
    console.error('[CifraClub Versions] Error:', error);
    // Retorna apenas a versão principal em caso de erro
    return [{
      type: 'principal',
      label: 'Violão (Principal)',
      url: url,
      instrument: 'violao',
      difficulty: 'padrao',
    }];
  }
}

function extractVersionType(url: string): string | null {
  const match = url.match(/\/([^/]+)\/$/);
  if (!match) return null;
  
  const type = match[1];
  const knownTypes = ['simplificada', 'avancada', 'ao-vivo', 'teclado', 'ukulele', 'baixo', 'guitarra', 'cavaco', 'viola'];
  
  return knownTypes.includes(type) ? type : null;
}

function extractInstrument(versionType: string): string | undefined {
  const instrumentMap: Record<string, string> = {
    'teclado': 'teclado',
    'ukulele': 'ukulele',
    'baixo': 'baixo',
    'guitarra': 'guitarra',
    'cavaco': 'cavaco',
    'viola': 'viola',
    'simplificada': 'violao',
    'avancada': 'violao',
    'ao-vivo': 'violao',
  };
  
  return instrumentMap[versionType];
}
