import { NextRequest, NextResponse } from 'next/server';
import { getProviderConfig, getApiKey } from '@/lib/llm-providers';

interface ExtractedCifra {
  titulo: string;
  artista: string;
  tom: string | null;
  cifra: string;
  observacoes?: string;
}

const PROMPT_TEMPLATE = `Esta é uma imagem de uma cifra de música. Analise a imagem e extraia as seguintes informações:

1. Título da música
2. Artista/Autor
3. Tom original (capo, opcional)
4. A cifra completa com acordes acima das letras

Retorne EXATAMENTE no seguinte formato JSON (sem markdown, sem código, apenas o JSON puro):
{
  "titulo": "nome da música",
  "artista": "artista",
  "tom": "tom original ou null se não conseguir identificar",
  "cifra": "letra com acordes格式, mantendo a formatação original",
  "observacoes": "qualquer nota adicional ou null"
}

REGRAS IMPORTANTES:
- Mantenha os acordes EXATAMENTE onde estão na imagem original (acima das sílabas corretas)
- Preserve quebras de linha
- Use formato [Intro], [Refrão], [Verso], etc para seções
- Não invente informações - se não conseguir ler algo, use null ou omita
- A cifra deve ser legível e copy-pasteable`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageBase64, imageUrl, provider: providerId } = body;

    if (!imageBase64 && !imageUrl) {
      return NextResponse.json(
        { error: 'Imagem é obrigatória (envie base64 ou URL)' },
        { status: 400 }
      );
    }

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider é obrigatório' },
        { status: 400 }
      );
    }

    const provider = getProviderConfig(providerId);
    if (!provider) {
      return NextResponse.json(
        { error: `Provider '${providerId}' não suportado` },
        { status: 400 }
      );
    }

    const apiKey = getApiKey(provider);
    if (!apiKey) {
      return NextResponse.json(
        { error: `API key não configurada para ${provider.name}` },
        { status: 500 }
      );
    }

    // Build the request based on provider
    let response;
    let extractedText: string;

    if (providerId === 'openai') {
      response = await fetch(provider.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: provider.visionModel,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: PROMPT_TEMPLATE },
                { 
                  type: 'image_url', 
                  image_url: imageBase64 
                    ? { url: `data:image/jpeg;base64,${imageBase64}` }
                    : { url: imageUrl }
                },
              ],
            },
          ],
          max_tokens: 4096,
        }),
      });

      const data = await response.json();
      extractedText = data.choices?.[0]?.message?.content || '';
    } 
    else if (providerId === 'google') {
      const base64Data = imageBase64 || imageUrl?.split(',')[1] || '';
      
      response = await fetch(`${provider.apiEndpoint}?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: PROMPT_TEMPLATE },
                { 
                  inlineData: {
                    mimeType: imageBase64 ? 'image/jpeg' : 'image/png',
                    data: base64Data
                  }
                },
              ],
            },
          ],
        }),
      });

      const data = await response.json();
      extractedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }
    else if (providerId === 'openrouter') {
      response = await fetch(provider.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://chordset.app',
          'X-Title': 'ChordSet',
        },
        body: JSON.stringify({
          model: provider.visionModel,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: PROMPT_TEMPLATE },
                { 
                  type: 'image_url', 
                  image_url: imageBase64 
                    ? { url: `data:image/jpeg;base64,${imageBase64}` }
                    : { url: imageUrl }
                },
              ],
            },
          ],
          max_tokens: 4096,
        }),
      });

      const data = await response.json();
      extractedText = data.choices?.[0]?.message?.content || '';
    }

    // Parse the JSON response
    // Try to extract JSON from the response (sometimes LLM wraps it in ```json)
    let parsed: ExtractedCifra;
    try {
      const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse LLM response:', extractedText);
      return NextResponse.json(
        { error: 'Falha ao interpretar a imagem. Tente novamente com uma foto mais clara.' },
        { status: 500 }
      );
    }

    // Validate required fields
    if (!parsed.titulo || !parsed.cifra) {
      return NextResponse.json(
        { error: 'Não consegui identificar a cifra na imagem. Tente uma foto mais clara.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        titulo: parsed.titulo || 'Desconhecido',
        artista: parsed.artista || 'Desconhecido',
        tom: parsed.tom || null,
        cifra: parsed.cifra,
        observacoes: parsed.observacoes || null,
      },
    });
  } catch (error) {
    console.error('Error processing image:', error);
    return NextResponse.json(
      { error: 'Erro ao processar imagem' },
      { status: 500 }
    );
  }
}
