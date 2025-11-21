// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Debug (remover depois)
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Variáveis de ambiente faltando:');
  console.error('URL:', supabaseUrl);
  console.error('KEY:', supabaseAnonKey ? 'Existe' : 'Faltando');
  throw new Error('Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);