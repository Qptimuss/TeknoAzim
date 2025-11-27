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
  updateUser: (data: Partial<User>) => void;
  saveProfileDetails: (newUserData: Partial<User>) => Promise<void>;
  login: (supabaseUser: SupabaseUser) => Promise<void>;
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

  // One-time effect to clean up old localStorage data from previous session management
  useEffect(() => {
    const SUPABASE_PROJECT_ID = 'bhfshljiqbdxgbpgmllp';
    const oldLocalStorageKey = `sb-${SUPABASE_PROJECT_ID}-auth-token`;
    
    if (typeof localStorage !== 'undefined') {
      const oldToken = localStorage.getItem(oldLocalStorageKey);
      if (oldToken) {
        console.log("Eski oturum verisi localStorage'dan temizleniyor.");
        localStorage.removeItem(oldLocalStorageKey);
      }
    }
  }, []);

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

  // This function is for merging state that has already been updated on the server
  const updateUser = (data: Partial<User>) => {
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
          description: "Hesabına 20 Gem eklendi!",
        });
        return { ...updatedProfile, email: profile.email } as User;
      } catch (e) {
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
    setLoading(true);
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          if (session?.user) {
            let profile = await fetchUserProfile(session.user);
            // Only check for daily reward on initial sign-in or session restoration
            if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
              if (profile) {
                profile = await handleDailyReward(profile);
              }
            }
            setUser(profile);
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error("Kimlik doğrulama durumu değişikliğinde hata:", error);
          setUser(null);
        } finally {
          setLoading(false);
        }
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

  // This function is for client-initiated updates of profile details (name, description, etc.)
  const saveProfileDetails = async (newUserData: Partial<User>) => {
    if (!user) return;

    const safeUpdateData: Partial<Profile> = {};
    let hasSafeFields = false;

    SAFE_PROFILE_UPDATE_KEYS.forEach(key => {
      if (newUserData.hasOwnProperty(key)) {
        (safeUpdateData as any)[key] = (newUserData as any)[key];
        hasSafeFields = true;
      }
    });

    if (!hasSafeFields) {
      console.warn("saveProfileDetails called with no updatable fields.");
      return;
    }

    try {
      const updatedFields = await updateProfileDetails(safeUpdateData);
      updateUser(updatedFields); // Use the state merger to update context
    } catch (e) {
      throw e instanceof Error ? e : new Error(String(e));
    }
  };

  const value = {
    user,
    loading,
    logout,
    updateUser,
    saveProfileDetails,
    login,
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