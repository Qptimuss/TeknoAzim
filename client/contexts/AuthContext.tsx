import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { Profile } from "@shared/api";
import { toast } from "sonner";
import { updateProfileDetails, claimDailyReward } from "@/lib/profile-store";
import { queryClient, authErrorHandlerRef } from "@/App"; // Global queryClient ve authErrorHandlerRef import edildi

export type User = Profile & { email?: string };

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  saveProfileDetails: (newUserData: Partial<User>) => Promise<void>;
  login: (supabaseUser: SupabaseUser) => Promise<void>;
  isDailyRewardEligible: boolean;
  triggerDailyRewardClaim: () => Promise<void>;
  handleAuthErrorAndRedirect: () => Promise<void>; // NEW: Expose this function
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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDailyRewardEligible, setIsDailyRewardEligible] = useState(false);

  useEffect(() => {
    const SUPABASE_PROJECT_ID = "bhfshljiqbdxgbpgmllp";
    const oldLocalStorageKey = `sb-${SUPABASE_PROJECT_ID}-auth-token`;
    if (typeof localStorage !== "undefined" && localStorage.getItem(oldLocalStorageKey)) {
      console.log("Eski oturum verisi localStorage'dan temizleniyor.");
      localStorage.removeItem(oldLocalStorageKey);
    }
  }, []);

  const fetchAndSetUser = async (supabaseUser: SupabaseUser) => {
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
        if (error.code === 'PGRST116' || error.message.includes('Row not found')) {
          toast.error("Profil verisi bulunamadı.", { description: "Lütfen Supabase'de 'profiles' tablonuzun ve RLS ayarlarınızın doğru olduğundan emin olun." });
        } else {
          toast.error("Profil yüklenemedi.", { description: error.message });
        }
        setUser(null);
        setIsDailyRewardEligible(false);
        return;
      }

      const fullUser = { ...profile, email: supabaseUser.email } as User;
      setUser(fullUser);

      const lastClaimed = fullUser.last_daily_reward_claimed_at
        ? new Date(fullUser.last_daily_reward_claimed_at)
        : null;
      const today = new Date();
      setIsDailyRewardEligible(!lastClaimed || !isSameDay(lastClaimed, today));
    } catch (e) {
      console.error("Critical error in fetchAndSetUser:", e);
      toast.error("Kritik Profil Hatası", { description: "Lütfen konsolu kontrol edin." });
      setUser(null);
      setIsDailyRewardEligible(false);
    }
  };

  const updateUser = (data: Partial<User>) => {
    setUser((prevUser) => (prevUser ? { ...prevUser, ...data } : null));
  };

  const triggerDailyRewardClaim = async () => {
    if (!user) {
      toast.error("Günlük ödülü almak için giriş yapmalısınız.");
      return;
    }
    try {
      const updatedProfile = await claimDailyReward();
      updateUser({ ...updatedProfile, email: user.email });
      setIsDailyRewardEligible(false);
      toast.success("Günlük Giriş Ödülü", { description: "Hesabına 20 Elmas ve 25 EXP eklendi!" });
    } catch (e) {
      if (e instanceof Error && e.message.includes("Daily reward already claimed today")) {
        toast.info("Günlük ödül zaten alındı.", { description: "Yarın tekrar deneyin." });
      } else {
        toast.error("Günlük ödül alınırken bir hata oluştu.", { description: e instanceof Error ? e.message : "Bilinmeyen bir hata." });
      }
    }
  };

  const login = async (supabaseUser: SupabaseUser) => {
    await fetchAndSetUser(supabaseUser);
  };

  // Modified logout to clear queryClient
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsDailyRewardEligible(false);
    queryClient.clear(); // Clear React Query cache on logout
  };

  // NEW: Centralized auth error handler for React Query
  const handleAuthErrorAndRedirect = async () => {
    toast.dismiss('session-expired-toast'); // Dismiss any existing toast
    toast.error("Oturum Süresi Doldu", {
      id: 'session-expired-toast',
      description: "Güvenliğiniz için oturumunuz sonlandırıldı. Lütfen tekrar giriş yapın.",
      duration: 5000, // Give user some time to read
    });
    await logout(); // Clear session and query cache
    window.location.href = '/giris'; // Redirect
  };

  useEffect(() => {
    // Set the global auth error handler
    authErrorHandlerRef.current = handleAuthErrorAndRedirect;

    setLoading(true);
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
        const supabaseUser = session?.user;
        if (supabaseUser) {
          await fetchAndSetUser(supabaseUser);
        } else {
          setUser(null);
          setIsDailyRewardEligible(false);
        }
      }

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsDailyRewardEligible(false);
        queryClient.clear(); // Ensure cache is cleared here too
      }

      if (event === 'INITIAL_SESSION') {
        setLoading(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
      authErrorHandlerRef.current = null; // Clear ref on unmount
    };
  }, []); // Dependency array should be empty for auth listener

  const saveProfileDetails = async (newUserData: Partial<User>) => {
    if (!user) return;
    const safeUpdateData: Partial<Profile> = {};
    SAFE_PROFILE_UPDATE_KEYS.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(newUserData, key) && newUserData[key] !== undefined) {
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

  const value = { user, loading, logout, updateUser, saveProfileDetails, login, isDailyRewardEligible, triggerDailyRewardClaim, handleAuthErrorAndRedirect };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}