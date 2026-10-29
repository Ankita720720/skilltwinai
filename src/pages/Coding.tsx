import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Play, Send, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardHead, Btn, Badge } from '../components/ui';
import { useData } from '../store/DataContext';
import { useAuth } from '../store/AuthContext';
import { useToast } from '../store/ToastContext';
import { supabase } from '../lib/supabase';
import { runTests, type TestResult } from '../lib/codeRunner';

export function Coding() {
  const { challengeId } = useParams();
  const d = useData();
  const { session } = useAuth();
  const toast = useToast();
  const ch = d.challenges.find((c) => c.id === challengeId);
  const [code, setCode] = useState('');
  const [results, setResults] = useState<TestResult[] | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (ch) { setCode(d.coding.find((a) => a.challenge_id === ch.id)?.code || ch.starter_code); setResults(null); } }, [ch?.id]);
  if (!ch) return <p className="text-sm text-muted">Challenge not found. <Link to="/assessments" className="text-brand font-bold">Back</Link></p>;

  async function run(submit: boolean) {
    setBusy(true);
    const r = await runTests(code, ch!.fn_name, ch!.tests);
    setResults(r);
    const passed = r.filter((x) => x.passed).length;
    if (submit && session) {
      const { error } = await supabase.from('coding_attempts').insert({ user_id: session.user.id, challenge_id: ch!.id, passed, total: r.length, code });
      if (error) toast(error.message, 'err');
      else { await d.log('coding', `${ch!.title}: ${passed}/${r.length} tests`, passed * 3); await d.refresh(); toast(passed === r.length ? 'All tests passed! 🎉' : `${passed}/${r.length} tests passed — saved.`); }
    }
    setBusy(false);
  }

  const passed = results?.filter((r) => r.passed).length ?? 0;
  return (
    <div className="grid xl:grid-cols-2 gap-6">
      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-2"><Badge tone="purple" >JavaScript</Badge><Badge tone="slate">{ch.difficulty}</Badge></div>
          <h1 className="text-xl font-extrabold text-navy">{ch.title}</h1>
          <p className="text-sm text-muted mt-2 leading-relaxed">{ch.prompt.split('`').map((p, i) => (i % 2 ? <code key={i} className="bg-slate-100 text-brand px-1 rounded">{p}</code> : p))}</p>
          <div className="mt-4 text-xs text-muted">Sample: <code className="bg-slate-100 px-1 rounded">{ch.fn_name}({JSON.stringify(ch.tests[0].args).slice(1, -1)})</code> → <code className="bg-slate-100 px-1 rounded">{JSON.stringify(ch.tests[0].expected)}</code></div>
        </Card>
        <Card>
          <CardHead title="Test results" right={results && <Badge tone={passed === results.length ? 'green' : 'amber'}>{passed}/{results.length} passed</Badge>} />
          <div className="px-5 pb-5 space-y-2.5">
            {!results && <p className="text-xs text-muted">Run your code to see results.</p>}
            {results?.map((r, i) => (
              <div key={i} className="flex items-start gap-2.5 text-xs border border-line rounded-lg p-3">
                {r.passed ? <CheckCircle2 className="w-4 h-4 text-teal shrink-0" /> : <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
                <div className="font-mono text-navy break-all">
                  <div>Test {i + 1}: {ch.fn_name}({JSON.stringify(r.args).slice(1, -1)})</div>
                  <div className="text-muted">expected {JSON.stringify(r.expected)}{!r.passed && (r.error ? <span className="text-red-600"> · {r.error}</span> : <span className="text-red-600"> · got {JSON.stringify(r.actual)}</span>)}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Card className="flex flex-col">
        <CardHead title="Code editor" />
        <div className="px-5 pb-5 flex-1 flex flex-col">
          <textarea value={code} onChange={(e) => setCode(e.target.value)} spellCheck={false}
            onKeyDown={(e) => { if (e.key === 'Tab') { e.preventDefault(); const t = e.currentTarget, s = t.selectionStart; setCode(code.slice(0, s) + '  ' + code.slice(t.selectionEnd)); requestAnimationFrame(() => { t.selectionStart = t.selectionEnd = s + 2; }); } }}
            className="flex-1 min-h-[360px] w-full rounded-xl bg-navy text-slate-100 font-mono text-[13px] leading-relaxed p-4 outline-none focus:ring-2 focus:ring-brand/40" />
          <div className="flex gap-3 mt-4 justify-end">
            <Btn variant="ghost" disabled={busy} onClick={() => run(false)}><Play className="w-4 h-4" /> Run</Btn>
            <Btn disabled={busy} onClick={() => run(true)}><Send className="w-4 h-4" /> Submit</Btn>
          </div>
        </div>
      </Card>
    </div>
  );
}
