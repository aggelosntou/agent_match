import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { API_BASE_URL } from '@/constants/api';

export type UserProfile = {
  id: string;
  name: string;
  interests: string[];
  location: string;
  skill_level: string;
  availability: string[];
  avatar_url?: string | null;
  bio?: string | null;
};

export type RegisterData = {
  email: string;
  password: string;
  name: string;
  interests: string[];
  location: string;
  skill_level: string;
  availability: string[];
};

type AuthState = {
  token: string | null;
  user: UserProfile | null;
  loading: boolean;
};

type AuthContextType = AuthState & {
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ token: null, user: null, loading: true });

  // Listen for Supabase session changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchProfile(session.access_token, session.user.id);
      } else {
        setState({ token: null, user: null, loading: false });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchProfile(session.access_token, session.user.id);
      } else {
        setState({ token: null, user: null, loading: false });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (token: string, _userId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const profile = await res.json();
        setState({ token, user: profile, loading: false });
      } else {
        setState({ token, user: null, loading: false });
      }
    } catch {
      setState({ token, user: null, loading: false });
    }
  };

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail ?? 'Login failed');
    }
    const data = await res.json();
    setState({ token: data.access_token, user: data.user, loading: false });
  }, []);

  const register = useCallback(async (payload: RegisterData) => {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail ?? 'Registration failed');
    }
    const data = await res.json();
    setState({ token: data.access_token, user: data.user, loading: false });
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setState({ token: null, user: null, loading: false });
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!state.token) return;
    await fetchProfile(state.token, state.user?.id ?? '');
  }, [state.token, state.user?.id]);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
