import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Track Supabase Auth State
  useEffect(() => {
    setLoading(true);
    let authSubscription;

    const initSupabaseAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          await fetchSupabaseRole(session.user.id, session.user.email);
        } else {
          setUser(null);
          setRole(null);
        }
      } catch (err) {
        console.error('Supabase auth session fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    initSupabaseAuth();

    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await fetchSupabaseRole(session.user.id, session.user.email);
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    authSubscription = data.subscription;

    return () => {
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []);

  // Fetch role from profiles table in Supabase
  const fetchSupabaseRole = async (userId, email) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (data && !error) {
        setRole(data.role);
      } else {
        // Fallback: Check email prefix if profile table not configured yet
        const inferredRole = email?.toLowerCase().includes('admin') ? 'admin' : 'accountant';
        setRole(inferredRole);
        console.warn(`Could not fetch profile from Supabase (${error?.message}). Inferred role: ${inferredRole}`);
      }
    } catch (e) {
      const inferredRole = e?.toLowerCase?.includes?.('admin') ? 'admin' : 'accountant';
      setRole(inferredRole);
    }
  };

  // Sign In
  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setLoading(false);
        return { success: false, error: error.message };
      }
      
      if (data.user) {
        await fetchSupabaseRole(data.user.id, data.user.email);
      }
      setLoading(false);
      return { success: true };
    } catch (err) {
      setLoading(false);
      return { success: false, error: err.message || 'An unexpected error occurred' };
    }
  };

  // Sign Out
  const logout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setRole(null);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
