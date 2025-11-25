import { useQuery } from '@tanstack/react-query';
import { getProfileById } from '@/lib/blog-store';
import { Profile } from '@shared/api';

export const useProfile = (userId: string | undefined) => {
  const { data: profile, isLoading, error, refetch } = useQuery<Profile | null>({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      return getProfileById(userId);
    },
    enabled: !!userId, // Sadece userId mevcut olduğunda sorguyu çalıştır
  });

  return { profile, isLoading, error, refetch };
};