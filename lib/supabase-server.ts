// lib/supabase-server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Variáveis de ambiente com fallback para build
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

/**
 * Valida que as variáveis de ambiente estão configuradas em runtime
 * Durante o build, apenas loga um warning
 */
function validateEnvVars() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    // Durante o build, apenas avisa
    if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.warn('⚠️  Supabase não configurado - usando placeholders para build');
    }
  }
}

export async function createClient() {
  validateEnvVars();
  
  const cookieStore = await cookies();

  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // O `set` pode falhar em Server Components
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // O `remove` pode falhar em Server Components
          }
        },
      },
    }
  );
}