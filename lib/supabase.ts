// lib/supabase.ts
import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

// Variáveis de ambiente com fallback para build
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Tipo do banco de dados (você pode substituir por um tipo mais específico se tiver)
type Database = any;

// Cliente singleton com lazy loading
let supabaseInstance: SupabaseClient<Database> | null = null;

/**
 * Retorna o cliente Supabase singleton
 * Cria apenas quando necessário (lazy loading)
 */
export function getSupabase(): SupabaseClient<Database> {
  // Validar apenas em runtime do browser/servidor (não durante build)
  if (typeof window !== 'undefined') {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Variáveis de ambiente faltando:');
      console.error('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.error('KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'OK' : 'Faltando');
      throw new Error('Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local');
    }
  }

  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey);
  }

  return supabaseInstance;
}

/**
 * Cliente Supabase exportado para compatibilidade
 * Use getSupabase() diretamente para melhor type safety
 */
export const supabase: SupabaseClient<Database> = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop) {
    const client = getSupabase();
    const value = client[prop as keyof SupabaseClient<Database>];
    
    // Se for uma função, fazer bind do contexto
    if (typeof value === 'function') {
      return value.bind(client);
    }
    
    return value;
  }
});