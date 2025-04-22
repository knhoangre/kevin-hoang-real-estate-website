import { createContext, useContext, useEffect, useState } from 'react';
import { createClient, User, Session } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zvipgykolpoxukyjgffx.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2aXBneWtvbHBveHVreWpnZmZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTQwMDQ4NzIsImV4cCI6MjAyOTU4MDg3Mn0.jpHt9I0DKjgpU8EjbXIhEStHYH0hl4O1VPNQZtG9cCg';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});

type AuthContextType = {
  user: User | null;
  session: Session | null;
  avatarUrl: string | null;
  avatarInitials: string | null;
  signIn: (email: string, password: string) => Promise<any>;
  signInWithGoogle: () => Promise<any>;
  signUp: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<any>;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarInitials, setAvatarInitials] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        updateUserAvatar(session.user);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const updateUserAvatar = async (user: User) => {
    // Check if user has Google avatar
    if (user.app_metadata?.provider === 'google' && user.user_metadata?.avatar_url) {
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

export { supabase };
