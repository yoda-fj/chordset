# AGENTS.md — Regras do projeto ChordSet

## Workflow obrigatório

1. **Sempre passar pelas checagens críticas antes de commitar:**
   - `npm run lint:ci`
   - `npx tsc --noEmit`
   - `npm test`
   - Se qualquer uma falhar, corrigir antes de continuar (atualizar testes quando o comportamento mudar intencionalmente).
2. **Sempre commitar e dar push para `main` assim que a funcionalidade estiver funcionando** — não deixar commits locais acumulados. Incluir no commit apenas arquivos relevantes da mudança (excluir `data/*.db*`, `tsconfig.tsbuildinfo` e outros artefatos locais).
3. Mensagens de commit em português, no estilo `feat:` / `fix:` com corpo explicando o porquê.
4. UI em português (pt-BR), incluindo labels, aria-labels e títulos.

## Contexto técnico

- Next.js (App Router) + Tailwind (`darkMode: 'class'`), tema dark/light via `next-themes` + tokens semânticos em `src/app/globals.css`.
- Áudio via Tone.js; testes com vitest + Testing Library.
