import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { MOCK_USERS } from '../utils/mockData';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(() => {
    const saved = localStorage.getItem('openskools_is_demo_mode');
    return saved !== null ? JSON.parse(saved) : true; // Default to Demo mode
  });

  // Track Supabase Auth State
  useEffect(() => {
    if (isDemoMode) {
      const savedUser = localStorage.getItem('openskools_mock_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        setRole(parsed.role);
      }
      setLoading(false);
      return;
    }

    // Supabase auth subscription
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
  }, [isDemoMode]);

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
      const inferredRole = email?.toLowerCase().includes('admin') ? 'admin' : 'accountant';
      setRole(inferredRole);
    }
  };

  // Switch between Demo Mode & Supabase
  const toggleDemoMode = (val) => {
    setIsDemoMode(val);
    localStorage.setItem('openskools_is_demo_mode', JSON.stringify(val));
    // Logout from current session
    setUser(null);
    setRole(null);
    localStorage.removeItem('openskools_mock_user');
    if (!val) {
      supabase.auth.signOut().catch(() => {});
    }
  };

  // Sign In
  const login = async (email, password) => {
    setLoading(true);
    try {
      if (isDemoMode) {
        const mockUser = MOCK_USERS[email.toLowerCase()];
        if (mockUser && password === 'password') {
          setUser(mockUser);
          setRole(mockUser.role);
          localStorage.setItem('openskools_mock_user', JSON.stringify(mockUser));
          setLoading(false);
          return { success: true };
        } else {
          setLoading(false);
          return { success: false, error: 'Invalid credentials. Use admin@openskools.com or accountant@openskools.com with password "password"' };
        }
      } else {
        // Supabase sign in
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setLoading(false);
          return { success: false, error: error.message };
        }
        
        // Supabase signin triggers the onAuthStateChange hook which fetches the profile role
        // However, we wait briefly and load role
        if (data.user) {
          await fetchSupabaseRole(data.user.id, data.user.email);
        }
        setLoading(false);
        return { success: true };
      }
    } catch (err) {
      setLoading(false);
      return { success: false, error: err.message || 'An unexpected error occurred' };
    }
  };

  // Sign Out
  const logout = async () => {
    setLoading(true);
    try {
      if (isDemoMode) {
        setUser(null);
        setRole(null);
        localStorage.removeItem('openskools_mock_user');
      } else {
        await supabase.auth.signOut();
        setUser(null);
        setRole(null);
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, login, logout, isDemoMode, toggleDemoMode }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
