import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { Profile } from "@shared/api";
import { toast } from "sonner";

export type User = Profile & { email?: string };

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  updateUser: (newUserData: Partial<User>) => Promise<void>;
  // login: (supabaseUser: SupabaseUser) => Promise<void>; // Kaldırıldı
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to check if the last reward was claimed today
const isSameDay = (d1: Date, d2: Date) => {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (supabaseUser: SupabaseUser): Promise<User | null> => {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select(
        "id, name, avatar_url, description, level, xp, badges, selected_title, owned_frames, selected_frame, gems, last_daily_reward_claimed_at"
      )
      .eq("id", supabaseUser.id)
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
    const lastClaimed = profile.last_daily_reward_claimed_at
      ? new Date(profile.last_daily_reward_claimed_at)
      : null;
    const today = new Date();

    if (!lastClaimed || !isSameDay(lastClaimed, today)) {
      const newGems = (profile.gems || 0) + 5;
      const { data: updatedProfile, error } = await supabase
        .from("profiles")
        .update({ gems: newGems, last_daily_reward_claimed_at: today.toISOString() })
        .eq("id", profile.id)
        .select(
          "id, name, avatar_url, description, level, xp, badges, selected_title, owned_frames, selected_frame, gems, last_daily_reward_claimed_at"
        )
        .single();

      if (error) {
        console.error("Error claiming daily reward:", error);
        return profile;
      }

      toast.success("Günlük Giriş Ödülü", {
        description: "Hesabına 5 Gem eklendi!",
      });

      return { ...updatedProfile, email: profile.email } as User;
    }

    return profile;
  };

  // login fonksiyonu kaldırıldı. Artık sadece listener'a güveniyoruz.
  // const login = async (supabaseUser: SupabaseUser) => {
  //   let profile = await fetchUserProfile(supabaseUser);
  //   if (profile) {
  //     profile = await handleDailyReward(profile);
  //   }
  //   setUser(profile);
  // };

  useEffect(() => {
    const getSessionAndProfile = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
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

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
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
      }
    );

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

    const { error: updateError } = await supabase
      .from("profiles")
      .update(newUserData)
      .eq("id", user.id);

    if (updateError) {
      console.error("Error updating profile:", updateError);
      throw updateError;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      const updatedProfile = await fetchUserProfile(session.user);
      setUser(updatedProfile);
    }
  };

  const value = {
    user,
    loading,
    logout,
    updateUser,
    // login, // Kaldırıldı
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