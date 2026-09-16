// LAYER: Infrastructure
// Cliente Supabase para Browser / Componentes de Cliente

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    'your-anon-key';

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
