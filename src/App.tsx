import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './store/AuthContext';
import { DataProvider } from './store/DataContext';
import { ToastProvider } from './store/ToastContext';
import { Layout } from './components/Layout';
import { isConfigured } from './lib/supabase';
import { Landing } from './pages/Landing';
import { AuthPage } from './pages/AuthPage';
import { Dashboard } from './pages/Dashboard';
import { Domains } from './pages/Domains';
import { Resume } from './pages/Resume';
import { Assessments } from './pages/Assessments';
import { Quiz } from './pages/Quiz';
import { Coding } from './pages/Coding';
import { SkillGap } from './pages/SkillGap';
import { CareerPath } from './pages/CareerPath';
import { Learning } from './pages/Learning';
import { Projects, ProjectDetail } from './pages/Projects';
import { Interview } from './pages/Interview';
import { Jobs } from './pages/Jobs';
import { Analytics } from './pages/Analytics';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { PWAControls } from './components/PWAControls';

function SetupNeeded() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-canvas">
      <div className="bg-white border border-line rounded-2xl p-8 max-w-lg shadow-sm">
        <h1 className="text-xl font-extrabold text-navy mb-2">Connect your Supabase project</h1>
        <p className="text-sm text-muted mb-4">Create a <code className="bg-slate-100 px-1 rounded">.env</code> file in the project root:</p>
        <pre className="bg-navy text-slate-100 text-xs rounded-xl p-4 overflow-x-auto">{`VITE_SUPABASE_URL=https://xxxx.supabase.co\nVITE_SUPABASE_ANON_KEY=your-anon-key`}</pre>
        <p className="text-sm text-muted mt-4">Then run <code className="bg-slate-100 px-1 rounded">supabase/schema.sql</code> and <code className="bg-slate-100 px-1 rounded">supabase/seed.sql</code> in the Supabase SQL editor and restart <code className="bg-slate-100 px-1 rounded">npm run dev</code>.</p>
      </div>
    </div>
  );
}

export default function App() {
  if (!isConfigured) return <SetupNeeded />;
  return (
    <BrowserRouter>
      <PWAControls />
      <ToastProvider>
        <AuthProvider>
          <DataProvider>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<AuthPage mode="login" />} />
              <Route path="/signup" element={<AuthPage mode="signup" />} />
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/domains" element={<Domains />} />
                <Route path="/resume" element={<Resume />} />
                <Route path="/assessments" element={<Assessments />} />
                <Route path="/assessments/quiz/:skillId" element={<Quiz />} />
                <Route path="/assessments/coding/:challengeId" element={<Coding />} />
                <Route path="/skill-gap" element={<SkillGap />} />
                <Route path="/career-path" element={<CareerPath />} />
                <Route path="/learning" element={<Learning />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/projects/:id" element={<ProjectDetail />} />
                <Route path="/interview" element={<Interview />} />
                <Route path="/jobs" element={<Jobs />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </DataProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
