import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Pencere tekrar odaklandığında (arka plandan öne geldiğinde)
 * tüm aktif React Query sorgularını yeniden çeker.
 */
export function useRefetchOnFocus() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleFocus = () => {
      // Tüm aktif React Query sorgularını yeniden çek
      queryClient.refetchQueries({ type: 'active' });
    };

    // Tarayıcı penceresi tekrar odaklandığında çalışır
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [queryClient]);
}