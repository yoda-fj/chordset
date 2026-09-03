/* eslint-disable */
// Verificação: compara duas bases linha a linha, normalizando por NOME de coluna
// (a ordem física das colunas pode diferir entre bancos migrados e bancos novos)
const D = require('better-sqlite3')
const tables = ['drum_patterns','musicas','templates','template_musicas','eventos','evento_musicas','practice_sessions']
const a = new D(process.argv[2], { readonly: true })
const b = new D(process.argv[3], { readonly: true })
const normalize = (rows) => rows.map(r => JSON.stringify(Object.keys(r).sort().map(k => [k, r[k]]))).sort()
let ok = true
for (const t of tables) {
  const ra = a.prepare(`SELECT * FROM ${t} ORDER BY id`).all()
  const rb = b.prepare(`SELECT * FROM ${t} ORDER BY id`).all()
  const equal = JSON.stringify(normalize(ra)) === JSON.stringify(normalize(rb))
  if (!equal) ok = false
  console.log(`${t}: origem=${ra.length} restaurado=${rb.length} conteúdo ${equal ? 'IDÊNTICO' : 'DIFERENTE'}`)
}
a.close(); b.close()
console.log(ok ? 'RESULTADO: RESTORE VERIFICADO COM SUCESSO' : 'RESULTADO: FALHOU')
process.exit(ok ? 0 : 1)
