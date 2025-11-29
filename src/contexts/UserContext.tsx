import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { Database } from '../lib/database.types';

// Define the Profile type based on your 'profiles' table
export type Profile = Database['public']['Tables']['profiles']['Row'];

interface UserContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean; // Loading state to prevent rendering before data is ready
  logout: () => Promise<void>;
}

// Create the context with a default value
export const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider = ({ children }: UserProviderProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true); // Start in loading state

  useEffect(() => {
    const fetchSessionAndProfile = async () => {
      try {
        // 1. Get the initial session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        setSession(session);
        setUser(session?.user ?? null);

        // 2. If a session exists, fetch the user's profile
        if (session?.user) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profileError) {
            // It's possible a profile doesn't exist yet for a new user
            console.warn("Could not fetch profile:", profileError.message);
            setProfile(null);
          } else {
            setProfile(profileData);
          }
        }
      } catch (error) {
        console.error("Error during initial session/profile fetch:", error);
      } finally {
        // 3. We are done loading, regardless of the outcome
        setLoading(false);
      }
    };

    fetchSessionAndProfile();

    // 4. Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // User logged in or session refreshed, re-fetch profile
          setLoading(true);
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profileError) {
            console.warn("Could not fetch profile on auth change:", profileError.message);
            setProfile(null);
          } else {
            setProfile(profileData);
          }
          setLoading(false);
        } else {
          // User logged out, clear profile
          setProfile(null);
        }
      }
    );

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  const value = {
    session,
    user,
    profile,
    loading,
    logout,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

// Custom hook to use the UserContext
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};