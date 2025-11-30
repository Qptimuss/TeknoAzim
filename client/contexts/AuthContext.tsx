import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { Profile } from "@shared/api";
import { toast } from "sonner";
import { updateProfileDetails, claimDailyReward } from "@/lib/profile-store";
import { useQueryClient, useQuery } from "@tanstack/react-query";

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

const isSameDay = (d1: Date, d2: Date) =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate();

const SAFE_PROFILE_UPDATE_KEYS: Array<keyof Profile> = [
  "name",
  "avatar_url",
  "description",
  "selected_title",
  "selected_frame",
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Eski oturum verilerini temizleyen kod kaldırıldı.
  // useEffect(() => {
  //   const SUPABASE_PROJECT_ID = "bhfshljiqbdxgbpgmllp";
  //   const oldLocalStorageKey = `sb-${SUPABASE_PROJECT_ID}-auth-token`;
  //   if (typeof localStorage !== "undefined" && localStorage.getItem(oldLocalStorageKey)) {
  //     console.log("Eski oturum verisi localStorage'dan temizleniyor.");
  //     localStorage.removeItem(oldLocalStorageKey);
  //   }
  // }, []);

  const fetchUserProfile = async (supabaseUser: SupabaseUser): Promise<User | null> => {
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select(
          "id, name, avatar_url, description, level, exp, badges, selected_title, owned_frames, selected_frame, gems, last_daily_reward_claimed_at"
        )
        .eq("id", supabaseUser.id)
        .single();
      
      if (error) {
        console.error("Error fetching profile from Supabase:", error);
        // RLS hatası veya profilin olmaması durumunda kullanıcıya bilgi ver
        if (error.code === 'PGRST116' || error.message.includes('Row not found')) {
            toast.error("Profil verisi bulunamadı.", { description: "Lütfen Supabase'de 'profiles' tablonuzun ve RLS ayarlarınızın doğru olduğundan emin olun." });
        } else {
            toast.error("Profil yüklenemedi.", { description: error.message });
        }
        return null;
      }
      
      return { ...profile, email: supabaseUser.email } as User;
    } catch (e) {
      console.error("Critical error in fetchUserProfile:", e);
      toast.error("Kritik Profil Hatası", { description: "Lütfen konsolu kontrol edin." });
      return null;
    }
  };

  const updateUser = (data: Partial<User>) => {
    setUser((prevUser) => (prevUser ? { ...prevUser, ...data } : null));
  };

  const handleDailyReward = async (profile: User): Promise<User> => {
    const lastClaimed = profile.last_daily_reward_claimed_at
      ? new Date(profile.last_daily_reward_claimed_at)
      : null;
    const today = new Date();
    if (!lastClaimed || !isSameDay(lastClaimed, today)) {
      try {
        const updatedProfile = await claimDailyReward();
        toast.success("Günlük Giriş Ödülü", { description: "Hesabına 20 Gem eklendi!" });
        return { ...updatedProfile, email: profile.email } as User;
      } catch (e) {
        // Eğer hata zaten ödülün alındığına dairse, sessiz kal
        if (e instanceof Error && e.message.includes("Daily reward already claimed today")) {
            return profile;
        }
        console.error("Error claiming daily reward via server:", e);
      }
    }
    return profile;
  };

  const login = async (supabaseUser: SupabaseUser) => {
    let profile = await fetchUserProfile(supabaseUser);
    if (profile) profile = await handleDailyReward(profile);
    setUser(profile);
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          let profile = await fetchUserProfile(session.user);
          if (profile) profile = await handleDailyReward(profile);
          setUser(profile);
        }
      } catch (e) {
        console.error("Initial auth session error:", e);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const supabaseUser = session?.user;
      if (supabaseUser) {
        let profile = await fetchUserProfile(supabaseUser);
        if (_event === "SIGNED_IN" && profile) profile = await handleDailyReward(profile);
        setUser(profile);
      } else {
        setUser(null);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    queryClient.clear();
  };

  const saveProfileDetails = async (newUserData: Partial<User>) => {
    if (!user) return;
    const safeUpdateData: Partial<Profile> = {};
    SAFE_PROFILE_UPDATE_KEYS.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(newUserData, key) && newUserData[key] !== undefined) {
        // Fix: Using 'as any' to bypass strict index signature check during iteration.
        (safeUpdateData as any)[key] = newUserData[key];
      }
    });
    if (Object.keys(safeUpdateData).length === 0) return;
    try {
      const updatedFields = await updateProfileDetails(safeUpdateData);
      updateUser(updatedFields);
    } catch (e) {
      throw e instanceof Error ? e : new Error(String(e));
    }
  };

  const value = { user, loading, logout, updateUser, saveProfileDetails, login };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}