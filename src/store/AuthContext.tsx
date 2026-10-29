import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile } from '../lib/types';

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, college: string) => Promise<{ needsConfirm: boolean }>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (patch: Partial<Profile>) => Promise<void>;
  reloadProfile: () => Promise<void>;
}
const Ctx = createContext<AuthState>(null as unknown as AuthState);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (uid: string, email?: string | null, fullName?: string) => {
    let { data } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
    if (!data) { // trigger may lag behind on first login — create defensively
      const ins = await supabase.from('profiles').insert({ id: uid, email, full_name: fullName || email?.split('@')[0] || 'Student' }).select('*').maybeSingle();
      data = ins.data;
    }
    setProfile(data as Profile | null);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session) await loadProfile(data.session.user.id, data.session.user.email, data.session.user.user_metadata?.full_name);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s) setTimeout(() => loadProfile(s.user.id, s.user.email, s.user.user_metadata?.full_name), 0);
      else setProfile(null);
    });
    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const value: AuthState = {
    session, profile, loading,
    async signUp(email, password, fullName, college) {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName, college } } });
      if (error) throw error;
      return { needsConfirm: !data.session };
    },
    async signIn(email, password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    async signOut() { await supabase.auth.signOut(); },
    async updateProfile(patch) {
      if (!session) return;
      const { data, error } = await supabase.from('profiles').update(patch).eq('id', session.user.id).select('*').single();
      if (error) throw error;
      setProfile(data as Profile);
    },
    async reloadProfile() { if (session) await loadProfile(session.user.id, session.user.email); },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
