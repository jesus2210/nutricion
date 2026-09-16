// LAYER: Interface
// Escucha eventos de autenticación en el navegador para tokens en hash (#access_token=...)
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/infrastructure/db/supabase/client';

export function AuthHashListener() {
  const router = useRouter();

  useEffect(() => {
    // Si hay hash en la URL (como #access_token=... proveniente de confirmación de email)
    if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
      const supabase = createClient();
      supabase.auth.onAuthStateChange((event, session) => {
        if (session && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
          router.push('/portal/plan');
          router.refresh();
        }
      });
    }
  }, [router]);

  return null;
}
