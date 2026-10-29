import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { apiClient, clearTokenCache } from '../lib/apiClient';
import { Profile, ProfileCreate, UserRole } from '../types/auth';

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  login: (email: string, pass: string) => Promise<any>;
  signup: (email: string, pass: string, role: UserRole, displayName: string) => Promise<any>;
  updateProfile: (displayName: string) => Promise<Profile>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // In-flight promise deduping to avoid concurrent duplicate /auth/me calls
  const inflightProfileFetch = useRef<Promise<Profile | null> | null>(null);

  const fetchProfile = useCallback(async () => {
    if (inflightProfileFetch.current) {
      const res = await inflightProfileFetch.current;
      if (res) setProfile(res);
      return;
    }

    const fetchPromise = (async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const sess = sessionData?.session;

        if (!sess?.access_token || (sess.expires_at && Math.floor(Date.now() / 1000) >= sess.expires_at)) {
          setProfile(null);
          return null;
        }

        const userProfile = await apiClient<Profile>('/auth/me');
        setProfile(userProfile);
        setError(null);
        return userProfile;
      } catch (err: any) {
        setProfile(null);
        if (err?.status === 401) {
          setSession(null);
          setUser(null);
          await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
        } else {
          console.error('Failed to fetch profile:', err);
          setError(err.message || 'Failed to authenticate profile');
        }
        return null;
      } finally {
        inflightProfileFetch.current = null;
      }
    })();

    inflightProfileFetch.current = fetchPromise;
    await fetchPromise;
  }, []);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const metaRole = session.user.user_metadata?.role as UserRole;
        const metaName =
          session.user.user_metadata?.display_name ||
          session.user.user_metadata?.full_name ||
          (session.user.email ? session.user.email.split('@')[0] : 'Learner');

        setProfile((prev) => prev || {
          id: session.user.id,
          role: metaRole || 'student',
          display_name: metaName,
          created_at: session.user.created_at || new Date().toISOString(),
        });
        setLoading(false);
        fetchProfile();
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        const metaRole = newSession.user.user_metadata?.role as UserRole;
        const metaName =
          newSession.user.user_metadata?.display_name ||
          newSession.user.user_metadata?.full_name ||
          (newSession.user.email ? newSession.user.email.split('@')[0] : 'Learner');

        setProfile((prev) => prev || {
          id: newSession.user.id,
          role: metaRole || 'student',
          display_name: metaName,
          created_at: newSession.user.created_at || new Date().toISOString(),
        });
        setLoading(false);
        fetchProfile();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    setError(null);
    clearTokenCache();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      throw error;
    }
    if (data.session) {
      try {
        await fetchProfile();
      } catch (err: any) {
        setError(err.message);
      }
    }
    setLoading(false);
    return data;
  };

  const signup = async (email: string, pass: string, role: UserRole, displayName: string) => {
    setLoading(true);
    setError(null);
    clearTokenCache();

    try {
      // 1. Try standard Supabase signup first with metadata
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: {
            role,
            display_name: displayName,
          },
        },
      });

      if (error) {
        const isRateLimit =
          error.status === 429 ||
          error.message?.includes('429') ||
          error.message?.toLowerCase().includes('rate limit') ||
          error.message?.toLowerCase().includes('email rate');

        if (isRateLimit) {
          // 2. Seamlessly fallback to backend admin registration which bypasses IP rate limits
          const registeredProfile = await apiClient<Profile>('/auth/register', {
            method: 'POST',
            body: {
              email,
              password: pass,
              role,
              display_name: displayName,
            },
          });
          setProfile(registeredProfile);

          // Sign in immediately
          const loginRes = await supabase.auth.signInWithPassword({
            email,
            password: pass,
          });
          setLoading(false);
          return loginRes.data;
        }

        setError(error.message);
        setLoading(false);
        throw error;
      }

      if (data.user) {
        try {
          const profileData: ProfileCreate = {
            id: data.user.id,
            role,
            display_name: displayName,
          };
          const createdProfile = await apiClient<Profile>('/auth/profile', {
            method: 'POST',
            body: profileData,
          });
          setProfile(createdProfile);
        } catch (err: any) {
          console.error('Failed to create profile after signup:', err);
        }
      }

      setLoading(false);
      return data;
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Registration failed');
      throw err;
    }
  };

  const updateProfile = async (newDisplayName: string) => {
    try {
      const updated = await apiClient<Profile>('/auth/profile', {
        method: 'PATCH',
        body: { display_name: newDisplayName },
      });
      setProfile(updated);
      await supabase.auth.updateUser({
        data: { display_name: newDisplayName, full_name: newDisplayName },
      }).catch(() => {});
      return updated;
    } catch (err: any) {
      console.error('Failed to update profile display name:', err);
      throw err;
    }
  };

  const logout = async () => {
    setLoading(true);
    clearTokenCache();
    try {
      await supabase.auth.signOut();
    } catch (e) {
      await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
    }
    setSession(null);
    setUser(null);
    setProfile(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        error,
        login,
        signup,
        updateProfile,
        logout,
        refreshProfile: fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
