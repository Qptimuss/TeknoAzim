import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User as SupabaseUser } from "@supabase/supabase-js";

export interface User {
  id: string;
  email?: string;
  name: string | null;
  avatar_url: string | null;
  description: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  updateUser: (newUserData: { name: string; avatar_url: string; description: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (supabaseUser: SupabaseUser): Promise<User | null> => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('name, avatar_url, description')
      .eq('id', supabaseUser.id)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
    
    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      ...profile
    };
  };

  useEffect(() => {
    const getSessionAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const profile = await fetchUserProfile(session.user);
        setUser(profile);
      }
      setLoading(false);
    };

    getSessionAndProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await fetchUserProfile(session.user);
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

  const updateUser = async (newUserData: { name: string; avatar_url: string; description: string }) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('profiles')
      .update({ name: newUserData.name, avatar_url: newUserData.avatar_url, description: newUserData.description })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating profile:", error);
      throw error;
    }

    if (data) {
      setUser(prevUser => prevUser ? ({ ...prevUser, name: data.name, avatar_url: data.avatar_url, description: data.description }) : null);
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