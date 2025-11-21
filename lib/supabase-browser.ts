// lib/supabase-browser.ts
import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

// Client singleton (compartilhado)
let supabaseInstance: SupabaseClient | null = null;

/**
 * Retorna o client Supabase singleton (compartilhado entre componentes)
 * Use para operações normais de leitura
 */
export function createClient() {
  if (!supabaseInstance) {
    supabaseInstance = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * Reseta o client singleton
 * Use apenas em casos especiais (logout, erro de auth)
 */
export function resetClient() {
  supabaseInstance = null;
}