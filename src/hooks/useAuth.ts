import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AUTH_STORAGE_KEY = 'skautowa-gra-auth';

interface AuthState {
  user: { id: string } | null;
  isLeaderOf: string | null;
}

interface UseAuthReturn extends AuthState {
  signIn: (patrolId: string, password: string, rememberMe: boolean) => Promise<boolean>;
  signOut: () => void;
  isLeader: (patrolId: string) => boolean;
  loading: boolean;
}

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({ user: null, isLeaderOf: null });
  const [loading, setLoading] = useState(true);

  // Load saved session on mount
  useEffect(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setState(parsed);
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  const signIn = useCallback(async (patrolId: string, password: string, rememberMe: boolean): Promise<boolean> => {
    try {
      // Check password in Supabase
      const { data, error } = await supabase
        .from('patrol_auth')
        .select('password')
        .eq('patrol_id', patrolId)
        .single();

      if (error || !data) {
        console.error('Auth error:', error);
        return false;
      }

      const authData = data as { password: string };
      if (authData.password === password) {
        const newState = {
          user: { id: `leader-${patrolId}` },
          isLeaderOf: patrolId,
        };
        setState(newState);
        
        if (rememberMe) {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newState));
        }
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Sign in error:', err);
      return false;
    }
  }, []);

  const signOut = useCallback(() => {
    setState({ user: null, isLeaderOf: null });
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  const isLeader = useCallback((patrolId: string): boolean => {
    return state.isLeaderOf === patrolId;
  }, [state.isLeaderOf]);

  return {
    user: state.user,
    isLeaderOf: state.isLeaderOf,
    signIn,
    signOut,
    isLeader,
    loading,
  };
}
