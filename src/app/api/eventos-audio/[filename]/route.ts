import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const AUDIO_DIR = path.join(process.cwd(), 'public', 'eventos-audio');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  // Security: Prevent path traversal
  const decodedFilename = decodeURIComponent(filename);
  if (decodedFilename.includes('..') || decodedFilename.includes('/') || decodedFilename.includes('\\')) {
    return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
  }

  const filePath = path.join(AUDIO_DIR, decodedFilename);

  // Ensure the file is within the eventos-audio directory
  const resolvedPath = path.resolve(filePath);
  const resolvedAudioDir = path.resolve(AUDIO_DIR);
  if (!resolvedPath.startsWith(resolvedAudioDir)) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  // Check if file exists
  if (!fs.existsSync(resolvedPath)) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  // Determine content type based on extension
  const ext = path.extname(decodedFilename).toLowerCase();
  const contentTypes: Record<string, string> = {
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.m4a': 'audio/mp4',
    '.webm': 'audio/webm',
  };

  const contentType = contentTypes[ext] || 'application/octet-stream';

  // Stream the file
  const fileStream = fs.createReadStream(resolvedPath);

  return new NextResponse(fileStream as unknown as BodyInit, {
    headers: {
      'Content-Type': contentType,
      'Content-Length': String(fs.statSync(resolvedPath).size),
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}