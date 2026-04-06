'use client';

interface ChordDisplayProps {
  cifra?: string | null;
  tom?: string | null;
}

export function ChordDisplay({ cifra, tom }: ChordDisplayProps) {
  if (!cifra) {
    return (
      <div className="chord-display bg-slate-50 rounded-xl p-8 border border-slate-200 text-center">
        <p className="text-slate-500">Nenhuma cifra disponível para esta música.</p>
      </div>
    );
  }

  // Simple formatter to preserve line breaks and highlight chords
  const formatCifra = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, index) => {
      // Check if line is a chord line (contains common chord patterns)
      const isChordLine = /^(\s*[A-G][#b]?[mM]?[0-9]?[\s]*)+$/.test(line) || 
                          line.trim().startsWith('[') ||
                          line.includes('  ') && /[A-G][#b]?/.test(line);
      
      return (
        <div 
          key={index} 
          className={`${isChordLine ? 'text-indigo-600 font-semibold my-1' : 'text-slate-700 my-0.5'} whitespace-pre-wrap`}
        >
          {line || '\u00A0'}
        </div>
      );
    });
  };

  return (
    <div className="chord-display bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {tom && (
        <div className="bg-indigo-50 px-4 py-2 border-b border-indigo-100">
          <span className="text-sm font-medium text-indigo-700">Tom: {tom}</span>
        </div>
      )}
      <div className="p-4 font-mono text-sm leading-relaxed overflow-x-auto">
        {formatCifra(cifra)}
      </div>
    </div>
  );
}
