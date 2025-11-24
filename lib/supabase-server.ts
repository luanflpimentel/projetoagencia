// lib/supabase-server.ts - NEXT.JS 15+
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// ✅ ASYNC porque cookies() agora é async no Next.js 15
export async function createClient() {
  const cookieStore = await cookies(); // ← AWAIT aqui!

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component - can't set cookies
          }
        },
      },
    }
  );
}