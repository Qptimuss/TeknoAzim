import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { Profile } from "@shared/api";
import { toast } from "sonner";

export type User = Profile & { email?: string };

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  updateUser: (newUserData: Partial<User>) => Promise<void>;
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
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select(
          "id, name, avatar_url, description, level, xp, badges, selected_title, owned_frames, selected_frame, gems, last_daily_reward_claimed_at"
        )
        .eq("id", supabaseUser.id)
        .single();

      if (error) {
        console.error("AUTH ERROR: Error fetching profile:", error);
        return null;
      }

      return {
        ...profile,
        email: supabaseUser.email,
      } as User;
    } catch (e) {
      console.error("AUTH ERROR: Exception during profile fetch:", e);
      return null;
    }
  };

  const handleDailyReward = async (profile: User): Promise<User | null> => {
    try {
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
          console.error("AUTH ERROR: Error claiming daily reward:", error);
          return profile;
        }

        toast.success("Günlük Giriş Ödülü", {
          description: "Hesabına 5 Gem eklendi!",
        });

        return { ...updatedProfile, email: profile.email } as User;
      }

      return profile;
    } catch (e) {
      console.error("AUTH ERROR: Exception during daily reward handling:", e);
      return profile;
    }
  };

  // Core function to handle session and profile loading
  const loadUserSession = async (session: { user: SupabaseUser } | null) => {
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
  };

  useEffect(() => {
    // 1. Initial load
    supabase.auth.getSession().then(({ data: { session } }) => {
      loadUserSession(session);
    });

    // 2. Listener for real-time changes (login/logout/token refresh)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        // We set loading to true temporarily if the event is a sign-in/out
        if (_event === 'SIGNED_IN' || _event === 'SIGNED_OUT') {
            setLoading(true);
        }
        loadUserSession(session);
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

    // 1. Update profile table
    const { error: updateError } = await supabase
      .from("profiles")
      .update(newUserData)
      .eq("id", user.id);

    if (updateError) {
      console.error("Error updating profile:", updateError);
      throw updateError;
    }

    // 2. Re-fetch and set the updated user data
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
  };

  return (
    <AuthContext.Provider value={value}>
      {/* Only render children when loading is complete */}
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