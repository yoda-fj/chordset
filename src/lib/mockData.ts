// Mock data para desenvolvimento quando o Supabase não está configurado
import { Template, TemplateMusicaWithMusica, Evento, EventoMusicaWithMusica, Musica, EventoWithTemplate } from '@/types/database'

export const mockMusicas: Musica[] = [
  { 
    id: 1, 
    titulo: 'Amazing Grace', 
    artista: 'John Newton', 
    tom_original: 'G', 
    cifra: `Tom: G

[Intro] G  D  Em  C

[Verso 1]
G              D
Amazing grace, how sweet the sound
Em             C
That saved a wretch like me
G              D
I once was lost, but now I'm found
Em             C
Was blind, but now I see

[Refrão]
G        D
Grace, grace
Em       C
God's grace`,
    tags: ['hino', 'clássico'], 
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  },
  { 
    id: 2, 
    titulo: 'How Great Thou Art', 
    artista: 'Carl Boberg', 
    tom_original: 'A', 
    cifra: `Tom: A

[Intro] A  E/G#  F#m  D

[Verso 1]
A                      E/G#
O Senhor, meu Deus, quando eu maravilhado
F#m               D
Contemplo a Tua imensidão`,
    tags: ['louvor', 'clássico'], 
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  },
  { id: 3, titulo: '10.000 Reasons', artista: 'Matt Redman', tom_original: 'C', cifra: null, tags: ['louvor', 'contemporâneo'], created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 4, titulo: 'Oceans', artista: 'Hillsong United', tom_original: 'D', cifra: null, tags: ['louvor', 'contemporâneo'], created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 5, titulo: 'What a Beautiful Name', artista: 'Hillsong Worship', tom_original: 'E', cifra: null, tags: ['louvor', 'contemporâneo'], created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 6, titulo: 'Graves into Gardens', artista: 'Elevation Worship', tom_original: 'B', cifra: null, tags: ['louvor', 'rock'], created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 7, titulo: 'Way Maker', artista: 'Sinach', tom_original: 'B', cifra: null, tags: ['louvor', 'gospel'], created_at: '2024-01-15', updated_at: '2024-01-15' },
  { id: 8, titulo: 'Goodness of God', artista: 'Bethel Music', tom_original: 'G', cifra: null, tags: ['louvor', 'contemporâneo'], created_at: '2024-01-20', updated_at: '2024-01-20' },
  { id: 9, titulo: 'Great Are You Lord', artista: 'All Sons & Daughters', tom_original: 'B', cifra: null, tags: ['louvor', 'adoracao'], created_at: '2024-02-01', updated_at: '2024-02-01' },
  { id: 10, titulo: 'This Is Amazing Grace', artista: 'Phil Wickham', tom_original: 'C', cifra: null, tags: ['louvor', 'rock'], created_at: '2024-02-10', updated_at: '2024-02-10' },
]

export const mockTemplates: Template[] = [
  { id: 1, nome: 'Culto Domingo Manhã', descricao: 'Template padrão para cultos de domingo', tags: ['culto', 'domingo'], created_at: '2024-01-01' },
  { id: 2, nome: 'Culto Quarta', descricao: 'Template para cultos de quarta-feira', tags: ['culto', 'quarta'], created_at: '2024-01-01' },
  { id: 3, nome: 'Evento Especial', descricao: 'Template para eventos especiais', tags: ['evento', 'especial'], created_at: '2024-01-01' },
]

export const mockTemplateMusicas: TemplateMusicaWithMusica[] = [
  { id: 1, template_id: 1, musica_id: 1, ordem: 1, tom_sugerido: 'G', observacoes: 'Entrada suave', created_at: '2024-01-01', musicas: mockMusicas[0] },
  { id: 2, template_id: 1, musica_id: 3, ordem: 2, tom_sugerido: 'C', observacoes: null, created_at: '2024-01-01', musicas: mockMusicas[2] },
  { id: 3, template_id: 1, musica_id: 5, ordem: 3, tom_sugerido: 'E', observacoes: 'Momento de adoração', created_at: '2024-01-01', musicas: mockMusicas[4] },
]

export const mockEventos: EventoWithTemplate[] = [
  { id: 1, nome: 'Culto - 14/01/2024', data: '2024-01-14', hora: '10:00:00', local: 'Templo Principal', status: 'confirmado', template_id: 1, tags: ['culto', 'domingo'], observacoes: null, audio_url: null, created_at: '2024-01-01', updated_at: '2024-01-01', templates: mockTemplates[0] },
  { id: 2, nome: 'Culto - 17/01/2024', data: '2024-01-17', hora: '19:30:00', local: 'Templo Principal', status: 'rascunho', template_id: 2, tags: ['culto', 'quarta'], observacoes: null, audio_url: null, created_at: '2024-01-01', updated_at: '2024-01-01', templates: mockTemplates[1] },
  { id: 3, nome: 'Conferência Jovem', data: '2024-02-10', hora: '18:00:00', local: 'Ginásio', status: 'confirmado', template_id: 3, tags: ['evento', 'jovens'], observacoes: null, audio_url: null, created_at: '2024-01-01', updated_at: '2024-01-01', templates: mockTemplates[2] },
]

export const mockEventoMusicas: EventoMusicaWithMusica[] = [
  { id: 1, evento_id: 1, musica_id: 1, ordem: 1, tom_evento: 'A', observacoes: 'Tom mais alto', confirmada: true, responsavel: 'João', created_at: '2024-01-01', updated_at: '2024-01-01', musicas: mockMusicas[0] },
  { id: 2, evento_id: 1, musica_id: 3, ordem: 2, tom_evento: 'D', observacoes: null, confirmada: true, responsavel: 'Maria', created_at: '2024-01-01', updated_at: '2024-01-01', musicas: mockMusicas[2] },
  { id: 3, evento_id: 1, musica_id: 5, ordem: 3, tom_evento: 'F', observacoes: 'Mudança de tom', confirmada: false, responsavel: null, created_at: '2024-01-01', updated_at: '2024-01-01', musicas: mockMusicas[4] },
]
