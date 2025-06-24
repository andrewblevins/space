import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Handle email confirmation and other auth redirects
    const handleAuthCallback = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Auth callback error:', error);
      } else if (data?.session) {
        console.log('Auth callback successful, user authenticated:', data.session.user.email);
      }
      return data;
    };

    // Get initial session
    handleAuthCallback().then(({ session }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes including email confirmation
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, session?.user?.email);
      
      if (event === 'SIGNED_IN') {
        console.log('User signed in:', session?.user?.email);
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed for:', session?.user?.email);
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) throw error;
  };

  const signInWithEmail = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
  };

  const signUp = async (email, password) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin
      }
    });
    if (error) throw error;
  };

  const signOut = async () => {
    console.log('🔐 Sign out requested');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('🔐 Sign out error:', error);
        throw error;
      }
      console.log('🔐 Sign out successful');
    } catch (err) {
      console.error('🔐 Sign out exception:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      session,
      signInWithGoogle,
      signInWithEmail,
      signUp,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
};