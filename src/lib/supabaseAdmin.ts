import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL manquant');
}

if (!serviceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY manquant');
}

// Client admin (service role) pour les opérations serveur nécessitant de bypass RLS
export const supabaseAdmin = createClient(supabaseUrl, serviceKey);


