// Supabase client - usado apenas se NEXT_PUBLIC_SUPABASE_URL estiver configurado
// Caso contrário, o app usa SQLite local (better-sqlite3)

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Apenas cria cliente se URL e Key estiverem configurados
export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null

// Cliente para uso em Server Components
export function createServerClient() {
  if (!supabaseUrl || !supabaseKey) return null
  return createClient(supabaseUrl, supabaseKey)
}
