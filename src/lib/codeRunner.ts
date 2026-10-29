export interface TestResult { passed: boolean; args: unknown[]; expected: unknown; actual?: unknown; error?: string }

/** Runs user code inside a Web Worker with a timeout so infinite loops can't freeze the page. */
export function runTests(code: string, fnName: string, tests: { args: unknown[]; expected: unknown }[], timeoutMs = 2500): Promise<TestResult[]> {
  return new Promise((resolve) => {
    const src = `
      self.onmessage = (e) => {
        const { code, fnName, tests } = e.data;
        const results = [];
        let fn;
        try { fn = new Function(code + '\\n; return typeof ' + fnName + ' === "function" ? ' + fnName + ' : undefined;')(); }
        catch (err) { self.postMessage(tests.map(t => ({ passed:false, args:t.args, expected:t.expected, error:String(err) }))); return; }
        if (!fn) { self.postMessage(tests.map(t => ({ passed:false, args:t.args, expected:t.expected, error:'Function ' + fnName + ' is not defined' }))); return; }
        for (const t of tests) {
          try {
            const actual = fn(...JSON.parse(JSON.stringify(t.args)));
            results.push({ passed: JSON.stringify(actual) === JSON.stringify(t.expected), args:t.args, expected:t.expected, actual });
          } catch (err) { results.push({ passed:false, args:t.args, expected:t.expected, error:String(err) }); }
        }
        self.postMessage(results);
      };`;
    const url = URL.createObjectURL(new Blob([src], { type: 'application/javascript' }));
    const worker = new Worker(url);
    const done = (r: TestResult[]) => { clearTimeout(timer); worker.terminate(); URL.revokeObjectURL(url); resolve(r); };
    const timer = setTimeout(() => done(tests.map((t) => ({ passed: false, args: t.args, expected: t.expected, error: 'Timed out (possible infinite loop)' }))), timeoutMs);
    worker.onmessage = (e) => done(e.data as TestResult[]);
    worker.onerror = (e) => done(tests.map((t) => ({ passed: false, args: t.args, expected: t.expected, error: e.message })));
    worker.postMessage({ code, fnName, tests });
  });
}
