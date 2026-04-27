import { NextResponse } from 'next/server'
import { readdir } from 'fs/promises'
import { join } from 'path'

export async function GET() {
  try {
    const samplesDir = join(process.cwd(), 'public', 'samples', 'drums')
    
    const categories = ['kick', 'snare', 'hihat-closed', 'crash', 'ride', 'tom']
    const result: Record<string, string[]> = {}
    
    for (const cat of categories) {
      try {
        const files = await readdir(join(samplesDir, cat))
        result[cat] = files.filter(f => f.endsWith('.wav')).slice(0, 10)
      } catch {
        result[cat] = ['(directory not found)']
      }
    }
    
    return NextResponse.json({
      status: 'ok',
      sampleFiles: result,
      message: 'Debug info for drum sample files'
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to list files',
      details: String(error)
    }, { status: 500 })
  }
}