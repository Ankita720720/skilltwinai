import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHead, PageHeader, Btn, Field, inputCls, Modal } from '../components/ui';
import { useAuth } from '../store/AuthContext';
import { useData } from '../store/DataContext';
import { useToast } from '../store/ToastContext';
import { supabase } from '../lib/supabase';

const USER_TABLES = ['quiz_attempts', 'coding_attempts', 'resume_analyses', 'resource_progress', 'project_progress', 'job_actions', 'interview_sessions', 'goals', 'activity_log', 'skill_claims'];

export function Settings() {
  const { profile, updateProfile, session, signOut } = useAuth();
  const d = useData();
  const toast = useToast();
  const nav = useNavigate();
  const [goal, setGoal] = useState(profile?.daily_goal_minutes ?? 30);
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState(false);

  async function savePrefs() {
    try { await updateProfile({ daily_goal_minutes: goal }); toast('Preferences saved'); } catch (e) { toast(e instanceof Error ? e.message : 'Failed', 'err'); }
  }
  async function changePw() {
    if (pw.length < 6) return toast('Use at least 6 characters.', 'err');
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) toast(error.message, 'err'); else { toast('Password updated'); setPw(''); }
  }
  async function resetProgress() {
    if (!session) return;
    for (const t of USER_TABLES) await supabase.from(t).delete().eq('user_id', session.user.id);
    setConfirm(false); await d.refresh(); toast('All progress cleared.');
  }

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Settings" />
      <Card>
        <CardHead title="Preferences" />
        <div className="px-5 pb-5 space-y-4">
          <Field label="Daily learning goal (minutes)"><input type="number" min={5} max={480} className={inputCls} value={goal} onChange={(e) => setGoal(Number(e.target.value))} /></Field>
          <label className="flex items-center gap-3 text-sm text-navy">
            <input type="checkbox" checked={profile?.email_reminders ?? true} onChange={(e) => updateProfile({ email_reminders: e.target.checked })} className="w-4 h-4 accent-[#5B2EFF]" />
            Email me progress reminders
          </label>
          <Btn onClick={savePrefs}>Save preferences</Btn>
        </div>
      </Card>
      <Card>
        <CardHead title="Security" />
        <div className="px-5 pb-5 flex gap-3 items-end">
          <div className="flex-1"><Field label="New password"><input type="password" className={inputCls} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" /></Field></div>
          <Btn onClick={changePw}>Update</Btn>
        </div>
      </Card>
      <Card>
        <CardHead title="Account" />
        <div className="px-5 pb-5 flex flex-wrap gap-3">
          <Btn variant="ghost" onClick={async () => { await signOut(); nav('/'); }}>Sign out</Btn>
          <Btn variant="danger" onClick={() => setConfirm(true)}>Reset all my progress</Btn>
        </div>
      </Card>
      <Modal open={confirm} onClose={() => setConfirm(false)} title="Reset all progress?">
        <p className="text-sm text-muted mb-4">This permanently deletes your quiz and coding attempts, resume analyses, interview sessions, goals, learning and project progress. Your account and profile stay.</p>
        <div className="flex justify-end gap-3"><Btn variant="ghost" onClick={() => setConfirm(false)}>Cancel</Btn><Btn variant="danger" onClick={resetProgress}>Yes, reset</Btn></div>
      </Modal>
    </div>
  );
}
