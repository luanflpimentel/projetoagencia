// lib/supabase-browser.ts
import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

// Variáveis de ambiente com fallback para build
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

// Client singleton (compartilhado)
let supabaseInstance: SupabaseClient | null = null;

/**
 * Valida que as variáveis de ambiente estão configuradas em runtime
 * Lança erro apenas quando executado no browser (não durante build)
 */
function validateEnvVars() {
  if (typeof window !== 'undefined') {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Variáveis de ambiente faltando:');
      console.error('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.error('KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'OK' : 'Faltando');
      throw new Error('Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local');
    }
  }
}

/**
 * Retorna o client Supabase singleton (compartilhado entre componentes)
 * Use para operações normais de leitura
 */
export function createClient() {
  validateEnvVars();
  
  if (!supabaseInstance) {
    supabaseInstance = createBrowserClient(
      supabaseUrl,
      supabaseKey
    );
  }
  return supabaseInstance;
}

/**
 * Cria um novo client Supabase (fresh)
 * Use para operações críticas que requerem garantia de estado atualizado
 * Exemplo: operações após voltar de outra aba, mutations importantes
 */
export function createFreshClient() {
  validateEnvVars();
  
  return createBrowserClient(
    supabaseUrl,
    supabaseKey
  );
}

/**
 * Reseta o client singleton
 * Use apenas em casos especiais (logout, erro de auth)
 */
export function resetClient() {
  supabaseInstance = null;
}