import { spawn } from 'node:child_process';

/* ---------- Types ---------- */

export interface SandboxLogEntry {
  level: 'log' | 'info' | 'warn' | 'error';
  args: unknown[];
}

export interface SandboxPerTest {
  index: number;
  ok: boolean;
  result?: unknown;
  error?: string;
  errorType?: 'syntax'; // set only for syntax errors
  logs: SandboxLogEntry[];
  ms: number;
}

export interface SandboxRunOk {
  status: 'ok';
  results: SandboxPerTest[];
}

export interface SandboxRunEnd {
  status: 'timeout' | 'oom' | 'killed' | 'crash' | 'parse_error';
  detail?: string; // stderr/stdout snippet or reason
}

export type SandboxRunResult = SandboxRunOk | SandboxRunEnd;
export type CodeTest = {
  input: unknown;
  expect?: unknown;
  expect_print?: string;
};

export interface RunOpts {
  code: string;
  tests?: CodeTest[];
  timeoutMs: number;
  /** Optional V8 heap cap in MB (applies to Deno child). Default: 256. */
  heapMb?: number;
  /** Lower CPU impact by reducing scheduler priority & pinning to one core (best-effort). */
  softenCpu?: boolean;
}

/* ---------- Config ---------- */

const DENO_BIN = process.env.DENO_BIN || 'deno';

/**
 * HARNESS_BATCH
 * Runs inside the Deno child process (via `deno eval`).
 * - Reads base64-encoded `code` and JSON `tests` from argv
 * - Defines a callable function on globalThis (__USER_FN__)
 * - Executes once per test, capturing logs and assertions
 * - Emits exactly ONE JSON object to stdout
 */
export const HARNESS_BATCH = `
(function main() {
  // ─────────────────────────────────────────────────────────────────────────────
  // Utilities
  // ─────────────────────────────────────────────────────────────────────────────

  let userAnswer = undefined;

  function print(...args) {
    return console.log(...args);
  }

  function checkAnswer(answer) {
    userAnswer = answer;
  }

  function b64decode(b64) {
    const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    return new TextDecoder().decode(bin);
  }

  function escapeRegex(s) {
    return String(s).replace(/[.*+?^\${}()|[\\]\\\\]/g, "\\\\$&");
  }

  // Deep equality with first-diff reporting and optional numeric epsilon
  function isNumber(x) { return typeof x === "number" && !Number.isNaN(x); }
  function eqNumber(a, b, eps) {
    if (Object.is(a, b)) return true;                     // handles -0
    if (Number.isNaN(a) && Number.isNaN(b)) return true;
    if (typeof eps === "number") return Math.abs(a - b) <= Math.max(0, eps);
    return a === b;
  }
  function deepEqualWithDiff(a, b, eps, path) {
    path = path || "$";

    // Fast path (strict equal)
    if (a === b) return { equal: true };

    // Numbers with epsilon
    if (isNumber(a) && isNumber(b)) {
      return eqNumber(a, b, eps) ? { equal: true } : { equal: false, path, expected: b, actual: a };
    }

    // Type/null checks
    if (a === null || b === null || typeof a !== typeof b) {
      return { equal: false, path, expected: b, actual: a };
    }

    // Arrays
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) {
        return { equal: false, path: path + ".length", expected: b.length, actual: a.length };
      }
      for (let i = 0; i < a.length; i++) {
        const r = deepEqualWithDiff(a[i], b[i], eps, path + "[" + i + "]");
        if (!r.equal) return r;
      }
      return { equal: true };
    }

    // Plain objects (compare sorted keys)
    if (a && b && typeof a === "object" && typeof b === "object") {
      const ak = Object.keys(a).sort();
      const bk = Object.keys(b).sort();
      if (ak.length !== bk.length) {
        return { equal: false, path: path + ".keys", expected: bk, actual: ak };
      }
      for (let i = 0; i < ak.length; i++) {
        if (ak[i] !== bk[i]) {
          return { equal: false, path: path + ".keys", expected: bk, actual: ak };
        }
      }
      for (const key of ak) {
        const r = deepEqualWithDiff(a[key], b[key], eps, path + "." + key);
        if (!r.equal) return r;
      }
      return { equal: true };
    }

    // Fallback strict compare for other types
    return { equal: Object.is(a, b), path, expected: b, actual: a };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Inputs
  // ─────────────────────────────────────────────────────────────────────────────

  // argv: [codeB64, testsB64, virtualFilename?]
  const [codeB64, testsB64, virtualName] = Deno.args;

  const code  = b64decode(codeB64 || "");
  const tests = JSON.parse(b64decode(testsB64 || "W10=")); // each: { input, expect?, epsilon? }
  const fname = virtualName || "submitted_code.js";

  // ─────────────────────────────────────────────────────────────────────────────
  // Console capture (do NOT echo to real stdout)
  // ─────────────────────────────────────────────────────────────────────────────
  const logs = [];
  ["log", "info", "warn", "error"].forEach(level => {
    console[level] = (...args) => {
      try { logs.push({ level, args }); } catch {}
    };
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Compile user function on globalThis with sourceURL
  // ─────────────────────────────────────────────────────────────────────────────
  // Keep this simple so startLineInEval stays stable:
  //   1: globalThis.__USER_FN__ = function __USER_FN__(input)
  //   2: {
  //   3:   "use strict";
  //   4+:  ... user code ...
  //      }
  //      //# sourceURL=<fname>
  const PRE   = 'globalThis.__USER_FN__ = function __USER_FN__(input)\\n{\\n\\"use strict\\";\\n';
  const POST  = '\\n};\\n//# sourceURL=' + fname;
  const START = PRE.split("\\n").length;    // first user-code line inside eval file

  let fn = null;
  let syntaxError = null;

  try {
    eval(PRE + code + POST);
    fn = globalThis.__USER_FN__;
  } catch (e) {
    syntaxError = (e?.name || "SyntaxError") + ": " + (e?.message || String(e));
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Test runner
  // ─────────────────────────────────────────────────────────────────────────────

  function runTest(index) {
    const t0   = Date.now();
    const base = logs.length;
    const test = tests[index] || {};
    const eps  = (typeof test.epsilon === "number") ? test.epsilon : undefined;

    return new Promise(resolve => {
      try {
        let out = fn(test.input);
        if (out === undefined && userAnswer !== undefined) {
          // If user called checkAnswer(), use that instead of return value
          out = userAnswer;
          userAnswer = undefined; // reset for next test
        }

        const onOk = (value) => {
          // If expect is provided, assertion decides ok-ness
          let passed = true;
          let diff;

          if ("expect" in test) {
            // Optional: mark missing return as failure
            if (typeof value === "undefined") {
              passed = false;
              diff = { path: "$", expected: test.expect, actual: undefined, reason: "No return value" };
            } else {
              const r = deepEqualWithDiff(value, test.expect, eps, "$");
              passed = !!r.equal;
              if (!passed) diff = { path: r.path, expected: r.expected, actual: r.actual };
            }
          }

          if ("expect_print" in test) {
            let printed = logs.slice(base).filter(l => l.level === "log" || l.level === "info").map(l => l.args.join('')).join('');
            try {
              const expect_print_value = JSON.parse(test.expect_print);
              test.expect_print = expect_print_value;
            } catch(e) {
            }
            if (typeof test.expect_print === 'number') {
              printed = Number(printed);
            }
            if (typeof test.expect_print === 'boolean') {
              if (typeof printed === 'string') {
                printed = printed === 'true' ? true : false;
              }
            }
            if (typeof test.expect_print === 'object' && Array.isArray(test.expect_print)) {
                printed = logs.slice(base).filter(l => l.level === "log" || l.level === "info").map(l => l.args.flat()).flat();
                const r = deepEqualWithDiff(printed, test.expect_print, eps, "$");
                passed = !!r.equal;
                if (!passed) diff = { path: r.path, expected: r.expected, actual: r.actual };
            } else {
              if (printed !== test.expect_print) {
                  passed = false;
                  diff = { path: "print", expected: test.expect_print, actual: printed };
              } else {
                  passed = true;
              }
            }
                
        }

          resolve({
            index,
            ok: passed,
            result: value,
            assert: ("expect" in test) ? { passed, expected: test.expect, diff } : undefined,
            assert_print: ("expect_print" in test) ? { passed, expected: test.expect_print, diff } : undefined,
            logs: logs.slice(base),
            ms: Date.now() - t0
          });
        };

        const onErr = (err) => {
          resolve({
            index,
            ok: false,
            error: (err?.name || "Error") + ": " + (err?.message || String(err)),
            logs: logs.slice(base),
            ms: Date.now() - t0
          });
        };

        if (out && typeof out === "object" && typeof out.then === "function") {
          out.then(onOk).catch(onErr);
        } else {
          onOk(out);
        }
      } catch (err) {
        resolve({
          index,
          ok: false,
          error: (err?.name || "Error") + ": " + (err?.message || String(err)),
          logs: logs.slice(base),
          ms: Date.now() - t0
        });
      }
    });
  }

  function runAll() {
    if (syntaxError) {
      // Report syntax error for every test
      return Promise.resolve(
        tests.map((_, i) => ({
          index: i,
          ok: false,
          errorType: "syntax",
          error: syntaxError,
          logs: [],
          ms: 0
        }))
      );
    }
    return Promise.all(tests.map((_, i) => runTest(i)));
  }

  function runCode() {
    if (syntaxError) {
      // Report syntax error for every test
      return Promise.resolve({
          ok: false,
          errorType: "syntax",
          error: syntaxError,
          logs: [],
          ms: 0
        });
    }
    
    const t0   = Date.now();
    const base = logs.length;

    return new Promise(resolve => {
      try {
        let out = fn();

        const onOk = (value) => {
          resolve({
            ok: true,
            result: value,
            logs: logs.slice(base),
            ms: Date.now() - t0
          });
        };

        const onErr = (err) => {
          resolve({
            ok: false,
            error: (err?.name || "Error") + ": " + (err?.message || String(err)),
            logs: logs.slice(base),
            ms: Date.now() - t0
          });
        };

        if (out && typeof out === "object" && typeof out.then === "function") {
          out.then(onOk).catch(onErr);
        } else {
          onOk(out);
        }
      } catch (err) {
        resolve({
          ok: false,
          error: (err?.name || "Error") + ": " + (err?.message || String(err)),
          logs: logs.slice(base),
          ms: Date.now() - t0
        });
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Emit a single JSON payload
  // ─────────────────────────────────────────────────────────────────────────────

  if (!tests || tests.length === 0) {
    runCode()
      .then(results => {
        const enc = new TextEncoder();
        return Deno.stdout.write(enc.encode(JSON.stringify({ ok: true, results: [results] })));
      })
      .catch(err => {
        const enc = new TextEncoder();
        return Deno.stdout.write(enc.encode(JSON.stringify({ ok: false, error: "harness_failure", detail: String(err) })));
      });
  } else {
    runAll()
      .then(results => {
        const enc = new TextEncoder();
        return Deno.stdout.write(enc.encode(JSON.stringify({ ok: true, results })));
      })
      .catch(err => {
        const enc = new TextEncoder();
        return Deno.stdout.write(enc.encode(JSON.stringify({ ok: false, error: "harness_failure", detail: String(err) })));
      });
  }
})();
`;

/* ---------- Helpers ---------- */

const b64 = (s: string) => Buffer.from(s, 'utf8').toString('base64');

/** Detect common V8/Deno OOM patterns from stderr/stdout */
function looksLikeOom(text: string): boolean {
  const t = text || '';
  return /heap out of memory|Reached heap limit|Allocation failed|JavaScript heap|Fatal JavaScript OOM/i.test(
    t,
  );
}

/** Best-effort: lower priority & pin to 1 core (does not hard-cap CPU). */
function softenCpuOnWindows(pid: number) {
  try {
    // Fire & forget PowerShell to adjust the child
    spawn(
      'powershell.exe',
      [
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        `$p = Get-Process -Id ${pid}; ` +
          `$p.PriorityClass = 'BelowNormal'; ` + // or 'Idle'
          `$p.ProcessorAffinity = 1`, // 1 = CPU0 only
      ],
      { windowsHide: true, stdio: 'ignore' },
    );
  } catch {
    /* ignore */
  }
}

/* ---------- Public API (batch) ---------- */

export async function runWithDenoWindows({
  code,
  tests,
  timeoutMs,
  heapMb = 256,
  softenCpu = false,
}: RunOpts): Promise<SandboxRunResult> {
  const syntaxCheckResult = await spawnChild({
    args: ['eval', code],
    opts: { softenCpu: false, timeoutMs: 150 },
  });

  const codeB64 = b64(code);
  const testsB64 = b64(JSON.stringify(tests ? tests : []));

  const args = [
    'eval',
    HARNESS_BATCH,
    codeB64,
    testsB64,
    '--no-remote',
    // V8 heap cap (affects JS heap, not total RSS)
    `--v8-flags=--max-old-space-size=${Math.max(64, Math.floor(heapMb))}`,
    // sandbox
    '--',
    '--deny-env',
    '--deny-net',
    '--deny-read',
    '--deny-write',
    '--deny-run',
    '--deny-ffi',
  ];

  const userCodeResult = await spawnChild({
    args,
    opts: { softenCpu, timeoutMs },
  });

  console.log('########userCodeResult', userCodeResult);

  if (
    syntaxCheckResult.status === 'parse_error' &&
    userCodeResult.status === 'ok' &&
    userCodeResult.results.every((r) => r.errorType === 'syntax')
  ) {
    return {
      status: 'parse_error',
      ...extractSyntaxErrorDetails(code, syntaxCheckResult.detail || ''),
    };
  }
  return userCodeResult;
}

async function spawnChild(params: {
  args: string[];
  opts: {
    softenCpu: boolean;
    timeoutMs: number;
  };
}) {
  const {
    args,
    opts: { softenCpu, timeoutMs },
  } = params;

  const child = spawn(DENO_BIN, args, {
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (softenCpu) softenCpuOnWindows(child.pid!);

  let stdout = '',
    stderr = '';
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stdout.on('data', (d: string) => (stdout += d));
  child.stderr.on('data', (d: string) => (stderr += d));

  let killedByTimeout = false;
  const killTimer = setTimeout(() => {
    killedByTimeout = true;
    try {
      child.kill('SIGKILL');
    } catch {}
  }, timeoutMs + 50);

  return await new Promise<SandboxRunResult>((resolve) => {
    child.on(
      'close',
      (_code: number | null, _signal: NodeJS.Signals | null) => {
        clearTimeout(killTimer);

        // If we killed it due to time, report timeout
        if (killedByTimeout) {
          resolve({ status: 'timeout', detail: 'execution exceeded timeout' });
          return;
        }

        // Try to parse the harness JSON
        try {
          const parsed = JSON.parse(stdout) as {
            ok?: boolean;
            results?: SandboxPerTest[];
          };
          if (parsed && parsed.ok && Array.isArray(parsed.results)) {
            resolve({ status: 'ok', results: parsed.results });
            return;
          }
        } catch {
          /* fall through */
        }

        // Classify OOM vs generic crash/parse failure
        const blob = (stderr || stdout || '').slice(0, 4000);
        if (looksLikeOom(blob)) {
          resolve({ status: 'oom', detail: blob });
        } else {
          resolve({ status: 'parse_error', detail: blob || 'non-JSON output' });
        }
      },
    );
  });
}

function extractSyntaxErrorDetails(code: string, stack: string) {
  const fname = 'submitted_code.js';
  const START = 1;

  function escapeRegex(s: string) {
    return String(s).replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&');
  }

  function extractUserPosition(
    stack: string,
    filename: string,
    startLineInEval: number,
  ) {
    if (!stack) return { line: undefined, column: undefined, stack: undefined };

    const s = String(stack);

    // 1) Our virtual filename
    const rxFile = new RegExp(escapeRegex(filename) + ':(\\d+):(\\d+)');
    let m = s.match(rxFile);
    if (m) {
      return {
        line: Number(m[1]) || undefined,
        column: Number(m[2]) || undefined,
        stack: s,
      };
    }

    // 2) Deno's eval wrapper ($deno$eval.mts)
    m = s.match(/\$deno\$eval\.mts:(\d+):(\d+)/);
    if (m) {
      const evalLine = Number(m[1]);
      const col = Number(m[2]) || undefined;
      if (Number.isFinite(evalLine) && Number.isFinite(startLineInEval)) {
        const userLine = Math.max(1, evalLine - startLineInEval + 1);
        return { line: userLine, column: col, stack: s };
      }
      return { line: undefined, column: col, stack: s };
    }

    // 3) Generic fallback
    m = s.match(/:(\d+):(\d+)/);
    return {
      line: m ? Number(m[1]) : undefined,
      column: m ? Number(m[2]) : undefined,
      stack: s,
    };
  }

  const pos = extractUserPosition(stack, fname, START);
  const errorLine = pos.line;
  const errorColumn = pos.column;

  const lines = code.split(/\r?\n/);
  const bad =
    typeof errorLine === 'number' && errorLine >= 1 && errorLine <= lines.length
      ? lines[errorLine - 1]
      : '';

  const caret =
    bad && errorColumn
      ? '\n' + ' '.repeat(Math.max(0, errorColumn - 1)) + '^'
      : '';

  const codeFrame =
    typeof errorLine === 'number'
      ? `> ${errorLine} | ${bad}    ${caret}`
      : `> ? | ${bad}    ${caret}`;

  return {
    ok: false,
    errorType: 'syntax',
    errorLine,
    errorColumn,
    codeFrame,
    logs: [],
    ms: 0,
  };
}
