import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Crée un client Supabase côté serveur avec gestion des cookies
 * Compatible avec Next.js App Router (Server Components, Server Actions)
 * 
 * ⚠️ Ce fichier ne peut être importé que côté serveur grâce à 'server-only'
 * 
 * @example
 * import { createServerSupabaseClient } from '@/lib/supabase/server'
 * const supabase = await createServerSupabaseClient()
 * const { data } = await supabase.from('users').select('*')
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set(name, value, options);
          } catch (error) {
            // En API routes, les cookies peuvent être en mode read-only
            // On ignore l'erreur car get() suffit pour l'authentification
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set(name, '', { ...options, maxAge: 0 });
          } catch (error) {
            // En API routes, les cookies peuvent être en mode read-only
          }
        },
      },
    }
  );
}

