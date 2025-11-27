import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { getProfile, saveProfile } from '@/lib/profile-store';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export interface User {
  id: string;
  email?: string;
  name?: string | null;
  description?: string | null;
  avatar_url?: string | null;
  exp?: number;
  gems: number;
  badges?: string[];
  selected_title?: string | null;
  last_daily_claim?: string | null;
  owned_frames?: string[];
  selected_frame?: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isSessionRefreshing: boolean;
  logout: () => Promise<void>;
  saveProfileDetails: (details: Partial<User>) => Promise<void>;
  updateUser: (updatedDetails: Partial<User>) => void;
  refetchProfile: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [isSessionRefreshing, setIsSessionRefreshing] = useState(false);

  const { data: user, isLoading: loadingProfile, refetch: refetchProfile } = useQuery({
    queryKey: ['userProfile', session?.user?.id],
    queryFn: async () => {
      if (!session?.user) return null;
      return getProfile(session.user.id);
    },
    enabled: !!session?.user,
    staleTime: Infinity,
    cacheTime: Infinity,
  });

  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoadingInitial(false);
    };

    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (_event === 'SIGNED_OUT') {
        queryClient.setQueryData(['userProfile', user?.id], null);
      } else if (_event === 'SIGNED_IN' || _event === 'TOKEN_REFRESHED') {
        queryClient.invalidateQueries({ queryKey: ['userProfile', session?.user?.id] });
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [queryClient, user?.id]);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        setIsSessionRefreshing(true);
        try {
          await supabase.auth.refreshSession();
          await refetchProfile();
        } catch (error) {
          console.error("Error refreshing session or profile:", error);
        } finally {
          setIsSessionRefreshing(false);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refetchProfile]);

  const saveProfileDetails = async (details: Partial<User>) => {
    if (!user) throw new Error("User not found");
    await saveProfile(user.id, details);
    await refetchProfile();
  };

  const updateUser = (updatedDetails: Partial<User>) => {
    if (user) {
      const newUser = { ...user, ...updatedDetails };
      queryClient.setQueryData(['userProfile', user.id], newUser);
    }
  };

  const value = {
    session,
    user: user ?? null,
    loading: loadingInitial || (!!session && loadingProfile),
    isSessionRefreshing,
    logout: async () => {
      await supabase.auth.signOut();
      queryClient.clear();
    },
    saveProfileDetails,
    updateUser,
    refetchProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};