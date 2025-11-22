// lib/supabase-browser.ts - VERSÃO SIMPLIFICADA
import { createBrowserClient } from '@supabase/ssr'

let clienteSupabase: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (clienteSupabase) return clienteSupabase;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Configure variáveis de ambiente Supabase');
  }

  clienteSupabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
  return clienteSupabase;
}