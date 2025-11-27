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
  refetchProfile: () => Promise<void>; // Yeni eklendi
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isSameDay = (d1: Date, d2: Date) => {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

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
      .select("id, name, avatar_url, description, level, exp, badges, selected_title, owned_frames, selected_frame, gems, last_daily_reward_claimed_at")
      .eq("id", supabaseUser.id)
      .single();
    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
    return { ...profile, email: supabaseUser.email } as User;
  };

  const updateUser = (data: Partial<User>) => {
    setUser(prevUser => (prevUser ? { ...prevUser, ...data } : null));
  };

  const handleDailyReward = async (profile: User): Promise<User> => {
    const lastClaimed = profile.last_daily_reward_claimed_at ? new Date(profile.last_daily_reward_claimed_at) : null;
    const today = new Date();
    if (!lastClaimed || !isSameDay(lastClaimed, today)) {
      try {
        const updatedProfile = await claimDailyReward();
        toast.success("Günlük Giriş Ödülü", { description: "Hesabına 20 Gem eklendi!" });
        return { ...updatedProfile, email: profile.email } as User;
      } catch (e) {
        console.error("Error claiming daily reward via server:", e);
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
  
  // Yeni eklenen fonksiyon: Profili manuel olarak yeniden çek
  const refetchProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const profile = await fetchUserProfile(session.user);
      if (profile) {
        setUser(profile);
      }
    }
  };

  useEffect(() => {
    // Clean up old local storage key if it exists
    const SUPABASE_PROJECT_ID = 'bhfshljiqbdxgbpgmllp';
    const oldLocalStorageKey = `sb-${SUPABASE_PROJECT_ID}-auth-token`;
    if (typeof localStorage !== 'undefined' && localStorage.getItem(oldLocalStorageKey)) {
      console.log("Eski oturum verisi localStorage'dan temizleniyor.");
      localStorage.removeItem(oldLocalStorageKey);
    }

    // 1. Set initial session state
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        let profile = await fetchUserProfile(session.user);
        if (profile) {
          profile = await handleDailyReward(profile);
        }
        setUser(profile);
      }
      setLoading(false);
    });

    // 2. Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const supabaseUser = session?.user;
        if (supabaseUser) {
          let profile = await fetchUserProfile(supabaseUser);
          // Only claim daily reward on explicit sign-in, not on every token refresh
          if (event === 'SIGNED_IN' && profile) {
            profile = await handleDailyReward(profile);
          }
          setUser(profile);
        } else {
          setUser(null);
        }
      }
    );

    // 3. Listen for tab focus/visibility changes to force a session refresh
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        // When tab becomes visible, proactively refresh the session.
        // This handles cases where the token expired while the tab was in the background.
        const { error } = await supabase.auth.refreshSession();
        if (error) {
          console.error("Error refreshing session on visibility change:", error.message);
          // The onAuthStateChange listener will handle the sign-out if refresh fails.
        }
        
        // Ek olarak, profil verilerini de yenilemeyi zorla (özellikle gem/exp gibi dinamik veriler için)
        await refetchProfile();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup function
    return () => {
      authListener.subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

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
    if (!hasSafeFields) return;
    try {
      const updatedFields = await updateProfileDetails(safeUpdateData);
      updateUser(updatedFields);
    } catch (e) {
      throw e instanceof Error ? e : new Error(String(e));
    }
  };

  const value = { user, loading, logout, updateUser, saveProfileDetails, login, refetchProfile };

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