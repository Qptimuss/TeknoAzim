import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { Profile } from "@shared/api";
import { toast } from "sonner";
import { updateProfileDetails, claimDailyReward } from "@/lib/profile-store";

export type User = Profile & { email?: string };

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  updateUser: (newUserData: Partial<User>) => Promise<void>;
  login: (supabaseUser: SupabaseUser) => Promise<void>;
  mergeProfileState: (data: Partial<User>) => void; 
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

// Define the keys that are safe for client-initiated updates via the /api/profile endpoint.
// All gamification fields (exp, level, gems, badges, owned_frames, last_daily_reward_claimed_at) 
// must be excluded as they are managed by secure server endpoints.
const SAFE_PROFILE_UPDATE_KEYS: Array<keyof Profile> = [
  'name',
  'avatar_url',
  'description',
  'selected_title',
  'selected_frame',
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (supabaseUser: SupabaseUser): Promise<User | null> => {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select(
        "id, name, avatar_url, description, level, exp, badges, selected_title, owned_frames, selected_frame, gems, last_daily_reward_claimed_at"
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

  // Function to merge state after a secure server call returns the updated profile
  const mergeProfileState = (data: Partial<User>) => {
    setUser(prevUser => {
      if (!prevUser) return null;
      return {
        ...prevUser,
        ...data,
      };
    });
  };

  // Server-side daily reward handling
  const handleDailyReward = async (profile: User): Promise<User> => {
    const lastClaimed = profile.last_daily_reward_claimed_at
      ? new Date(profile.last_daily_reward_claimed_at)
      : null;
    const today = new Date();

    if (!lastClaimed || !isSameDay(lastClaimed, today)) {
      try {
        const updatedProfile = await claimDailyReward();
        toast.success("Günlük Giriş Ödülü", {
          description: "Hesabına 5 Gem eklendi!",
        });
        return { ...updatedProfile, email: profile.email } as User;
      } catch (e) {
        // If claiming failed (e.g., already claimed or server error), return original profile
        if (e instanceof Error && e.message.includes("Daily reward already claimed today.")) {
             // This case should ideally not happen if isSameDay check passes, but good to handle.
        } else {
            console.error("Error claiming daily reward via server:", e);
        }
        return profile;
      }
    }

    return profile;
  };

  const login = async (supabaseUser: SupabaseUser) => {
    let profile = await fetchUserProfile(supabaseUser);
    if (profile) {
      profile = await handleDailyReward(profile);
    }
    setUser(profile);
  };

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

  // SECURE UPDATE USER: Only allows updating non-gamification fields via the secure server API.
  const updateUser = async (newUserData: Partial<User>) => {
    if (!user) return;

    const safeUpdateData: Partial<Profile> = {};

    // Filter newUserData to only include safe keys
    SAFE_PROFILE_UPDATE_KEYS.forEach(key => {
      if (newUserData[key] !== undefined) {
        safeUpdateData[key] = newUserData[key] as any;
      }
    });

    if (Object.keys(safeUpdateData).length === 0) {
        return;
    }

    // Use the secure server API for profile updates
    const updatedFields = await updateProfileDetails(safeUpdateData);

    // Merge the updated fields back into the current user state
    mergeProfileState(updatedFields);
  };

  const value = {
    user,
    loading,
    logout,
    updateUser,
    login,
    mergeProfileState,
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