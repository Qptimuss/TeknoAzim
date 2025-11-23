import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { Profile } from "@shared/api";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";

export type User = Profile & { email?: string };

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  updateUser: (newUserData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isSameDay = (d1: Date, d2: Date) => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (supabaseUser: SupabaseUser): Promise<User | null> => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, name, avatar_url, description, level, exp, badges, selected_title, owned_frames, selected_frame, gems, last_daily_reward_claimed_at')
      .eq('id', supabaseUser.id)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
    
    return {
      ...profile,
      email: supabaseUser.email,
    } as User;
  };

  const handleDailyReward = async (profile: User): Promise<User | null> => {
    const lastClaimed = profile.last_daily_reward_claimed_at ? new Date(profile.last_daily_reward_claimed_at) : null;
    const today = new Date();

    if (!lastClaimed || !isSameDay(lastClaimed, today)) {
      const newGems = (profile.gems || 0) + 20;
      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update({ gems: newGems, last_daily_reward_claimed_at: today.toISOString() })
        .eq('id', profile.id)
        .select('id, name, avatar_url, description, level, exp, badges, selected_title, owned_frames, selected_frame, gems, last_daily_reward_claimed_at')
        .single();
      
      if (error) {
        console.error("Error claiming daily reward:", error);
        return profile;
      }
      
      toast.success("Günlük Giriş Ödülü", { description: "Hesabına 20 Elmas eklendi!" });
      return { ...updatedProfile, email: profile.email } as User;
    }
    return profile;
  };

  useEffect(() => {
    const getSessionAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        let profile = await fetchUserProfile(session.user);
        if (profile) {
          profile = await handleDailyReward(profile);
        }
        setUser(profile);
      }
      setLoading(false);
    };

    getSessionAndProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        let profile = await fetchUserProfile(session.user);
        if (profile) {
          profile = await handleDailyReward(profile);
        }
        setUser(profile);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const updateUser = async (newUserData: Partial<User>) => {
    if (!user) return;

    try {
      const updatedProfile = await apiFetch('/user/profile', {
        method: 'PUT',
        body: JSON.stringify(newUserData),
      });
      setUser({ ...updatedProfile, email: user.email });
    } catch (error) {
      console.error("Error updating profile via API:", error);
      toast.error("Profil güncellenemedi", {
        description: error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu.",
      });
      // Re-throw the error so the calling component knows it failed
      throw error;
    }
  };

  const value = {
    user,
    loading,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}