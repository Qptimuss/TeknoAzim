import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Pencere tekrar odaklandığında (arka plandan öne geldiğinde)
 * tüm aktif React Query sorgularını yeniden çeker.
 * Supabase client, API çağrısı sırasında token'ın süresi dolmuşsa
 * otomatik olarak yenileyecektir.
 */
export function useRefetchOnFocus() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleFocus = () => {
      // Sadece React Query sorgularını yeniden tetikle.
      // Supabase'in kendi token yenileme mekanizmasına güveniyoruz.
      queryClient.refetchQueries({ type: 'active' });
    };

    // Tarayıcı penceresi tekrar odaklandığında çalışır
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [queryClient]);
}