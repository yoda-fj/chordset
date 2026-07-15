import { serveAudioFile } from '@/lib/api-helpers';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  return serveAudioFile('eventos-audio', filename);
}
