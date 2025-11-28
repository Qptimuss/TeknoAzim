import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getProfile, updateProfileDetails } from "@/lib/profile-store";
import { useQueryClient, useQuery } from "@tanstack/react-query";

export interface User {
  id: string;
  email?: string;
  name?: string | null;
  description?: string | null;
  avatar_url?: string | null;
  exp?: number;
  gems?: number;
  badges?: string[];
  selected_title?: string | null;
  last_daily_claim?: string | null;
  owned_frames?: string[];
  selected_frame?: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  updateUser: (updatedDetails: Partial<User>) => void;
  saveProfileDetails: (details: Partial<User>) => Promise<void>;
  refetchProfile: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [session, setSession] = useState(supabase.auth.session());
  const [loading, setLoading] = useState(true);

  const userQueryKey = session?.user?.id ? ["userProfile", session.user.id] : ["userProfile", "unknown"];

  const { data: user, refetch: refetchProfile } = useQuery<User | null>({
    queryKey: userQueryKey,
    queryFn: async () => {
      if (!session?.user) return null;
      return getProfile(session.user.id);
    },
    enabled: !!session?.user,
    staleTime: Infinity,
    cacheTime: Infinity,
  });

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (_event === "SIGNED_OUT") {
        if (user?.id) queryClient.setQueryData(["userProfile", user.id], null);
      } else if (_event === "SIGNED_IN" || _event === "TOKEN_REFRESHED") {
        if (newSession?.user?.id) queryClient.invalidateQueries(["userProfile", newSession.user.id]);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, [queryClient, user?.id]);

  const updateUser = (updatedDetails: Partial<User>) => {
    if (!user?.id) return;
    const currentUser = queryClient.getQueryData<User>(["userProfile", user.id]);
    if (!currentUser) return;
    const newUser: User = { ...currentUser, ...updatedDetails };
    queryClient.setQueryData(["userProfile", user.id], newUser);
  };

  const saveProfileDetails = async (details: Partial<User>) => {
    if (!user?.id) throw new Error("User not found");
    await updateProfileDetails(details);
    await refetchProfile();
  };

  const logout = async () => {
    await supabase.auth.signOut();
    queryClient.clear();
  };

  return (
    <AuthContext.Provider value={{ user: user ?? null, loading, logout, updateUser, saveProfileDetails, refetchProfile }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
