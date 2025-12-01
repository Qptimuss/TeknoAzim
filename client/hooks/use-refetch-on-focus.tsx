import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Pencere tekrar odaklandığında (arka plandan öne geldiğinde)
 * Supabase oturumunu yenilemeye zorlar ve tüm aktif sorguları yeniden çeker.
 */
export function useRefetchOnFocus() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleFocus = async () => {
      // 1. Supabase oturumunu yenilemeye zorla
      // Bu, oturumun süresi dolmuşsa yeni bir oturum almayı dener.
      const { data: { session }, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error("Supabase session refresh failed on focus:", error);
      } else if (session) {
        console.log("Supabase session refreshed on focus.");
      } else {
        console.log("Supabase session is null after refresh on focus.");
      }

      // 2. Tüm aktif React Query sorgularını yeniden çek
      // Bu, blog listeleri gibi yüklenmede kalan tüm bileşenleri tetikler.
      queryClient.refetchQueries({ type: 'active' });
    };

    // Tarayıcı penceresi tekrar odaklandığında çalışır
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [queryClient]);
}