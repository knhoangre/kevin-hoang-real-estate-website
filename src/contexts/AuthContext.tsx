import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  avatarUrl: string | null;
  avatarInitials: string | null;
  signIn: (email: string, password: string) => Promise<any>;
  signInWithGoogle: () => Promise<any>;
  signUp: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<any>;
  refreshUser: () => Promise<void>;
  updateAvatarUrl: (url: string) => Promise<void>;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarInitials, setAvatarInitials] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to refresh user data
  const refreshUser = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        setUser(data.session.user);
        updateUserAvatar(data.session.user);
      }
    } catch (error) {
      console.error("Error refreshing user:", error);
    }
  };

  // Function to update the user's avatar URL
  const updateAvatarUrl = async (url: string) => {
    if (!user) return;

    try {
      // Update the user's metadata with the new avatar URL
      const { error } = await supabase.auth.updateUser({
        data: { avatar_url: url }
      });

      if (error) throw error;

      // Update the local state
      setAvatarUrl(url);
      setAvatarInitials(null);

      // Refresh the user data to ensure everything is in sync
      await refreshUser();
    } catch (error) {
      console.error("Error updating avatar URL:", error);
      throw error;
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.user_metadata);
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Use timeout to prevent potential deadlocks
          setTimeout(() => {
            updateUserAvatar(session.user);
          }, 0);
        } else {
          setAvatarUrl(null);
          setAvatarInitials(null);
        }
      }
    );

    // THEN check for existing session
    const initializeAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
        setUser(data.session?.user ?? null);

        if (data.session?.user) {
          updateUserAvatar(data.session.user);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    return () => subscription.unsubscribe();
  }, []);

  const updateUserAvatar = async (user: User) => {
    // Check if user has Google avatar
    if (user.app_metadata?.provider === 'google' && user.user_metadata?.avatar_url) {
      setAvatarUrl(user.user_metadata.avatar_url);
      setAvatarInitials(null);
      return;
    }

    // Check if user has a custom avatar URL
    if (user.user_metadata?.avatar_url) {
      setAvatarUrl(user.user_metadata.avatar_url);
      setAvatarInitials(null);
      return;
    }

    // Otherwise generate initials from user metadata or email
    const firstName = user.user_metadata?.first_name || '';
    const lastName = user.user_metadata?.last_name || '';

    if (firstName && lastName) {
      setAvatarInitials(`${firstName.charAt(0)}${lastName.charAt(0)}`);
    } else {
      // Fallback to email
      const email = user.email || '';
      const parts = email.split('@');
      if (parts.length > 0 && parts[0]) {
        setAvatarInitials(parts[0].charAt(0).toUpperCase());
      } else {
        setAvatarInitials('U'); // Default if no email
      }
    }

    setAvatarUrl(null);
  };

  const signIn = (email: string, password: string) => {
    return supabase.auth.signInWithPassword({ email, password });
  };

  const signInWithGoogle = async () => {
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
  };

  const signUp = async (email: string, password: string) => {
    return supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      }
    });
  };

  const signOut = () => {
    return supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    avatarUrl,
    avatarInitials,
    signIn,
    signInWithGoogle,
    signUp,
    signOut,
    refreshUser,
    updateAvatarUrl,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
