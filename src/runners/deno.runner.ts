import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Script } from 'node:vm';

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
const RESULT_MARKER = '__SANDBOX_RESULT__';
const SUBMITTED_FILENAME = 'submitted_code.js';
const MAX_RESULT_PAYLOAD_BYTES = 512 * 1024;
const MAX_STDOUT_BYTES = 512 * 1024;
const MAX_STDERR_BYTES = 512 * 1024;
const USER_FN_BODY_PREFIX = '"use strict";\n';
const USER_FN_BODY_PREFIX_LINES = USER_FN_BODY_PREFIX.split('\n').length - 1;

/**
 * HARNESS_BATCH
 * Runs inside the Deno child process (via `deno run`).
 * - Reads base64-encoded `code` and JSON `tests` from argv
 * - Executes user code inside a Worker with `permissions: "none"`
 * - Emits exactly ONE marker-prefixed JSON payload to stdout
 *
 * Security note:
 * - This is a hardened runner with strict Deno permission denial and worker isolation,
 *   but it is still process-level isolation on the same host.
 * - Treat it as defense-in-depth, not as a full multi-tenant security boundary.
 */
export const HARNESS_BATCH = `
(async function main() {
  function b64decode(b64) {
    const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    return new TextDecoder().decode(bin);
  }

  const [codeB64, testsB64, resultToken, timeoutMsRaw] = Deno.args;
  const code = b64decode(codeB64 || "");
  const tests = JSON.parse(b64decode(testsB64 || "W10="));
  const workerTimeoutMs = Math.max(100, Number(timeoutMsRaw || 0) || 0);

  const workerToken = crypto.randomUUID();
  const workerSource = \`
const RUN_TOKEN = \${JSON.stringify(workerToken)};
const FILENAME = "submitted_code.js";
const MAX_TESTS = 64;
const MAX_LOGS_PER_TEST = 200;
const MAX_STRING = 4000;
const MAX_ARRAY = 100;
const MAX_OBJECT_KEYS = 50;
const MAX_DEPTH = 8;

function deepClone(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function isNumber(x) { return typeof x === "number" && !Number.isNaN(x); }
function eqNumber(a, b, eps) {
  if (Object.is(a, b)) return true;
  if (Number.isNaN(a) && Number.isNaN(b)) return true;
  if (typeof eps === "number") return Math.abs(a - b) <= Math.max(0, eps);
  return a === b;
}
function deepEqualWithDiff(a, b, eps, path) {
  path = path || "$";
  if (a === b) return { equal: true };

  if (isNumber(a) && isNumber(b)) {
    return eqNumber(a, b, eps) ? { equal: true } : { equal: false, path, expected: b, actual: a };
  }

  if (a === null || b === null || typeof a !== typeof b) {
    return { equal: false, path, expected: b, actual: a };
  }

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

  return { equal: Object.is(a, b), path, expected: b, actual: a };
}

function buildUserFn(source) {
  const wrapped = ['"use strict";', source, '//# sourceURL=' + FILENAME].join("\\\\n");
  return new Function(
    "input",
    "checkAnswer",
    "print",
    "console",
    wrapped,
  );
}

function toSerializable(value, seen, depth) {
  if (value === null || value === undefined) return null;
  if (depth > MAX_DEPTH) return "[MaxDepth]";
  if (typeof value === "string") {
    return value.length > MAX_STRING ? value.slice(0, MAX_STRING) + "...(truncated)" : value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return String(value);
    return value;
  }
  if (typeof value === "boolean") return value;
  if (typeof value === "bigint") return value.toString() + "n";
  if (typeof value === "symbol") return value.toString();
  if (typeof value === "function") return "[Function]";

  if (seen.has(value)) return "[Circular]";
  seen.add(value);

  if (Array.isArray(value)) {
    const out = [];
    const length = Math.min(value.length, MAX_ARRAY);
    for (let i = 0; i < length; i++) {
      out.push(toSerializable(value[i], seen, depth + 1));
    }
    if (value.length > MAX_ARRAY) out.push("...(truncated)");
    return out;
  }

  if (typeof value === "object") {
    const out = {};
    const keys = Object.keys(value).slice(0, MAX_OBJECT_KEYS);
    for (const key of keys) {
      out[key] = toSerializable(value[key], seen, depth + 1);
    }
    if (Object.keys(value).length > MAX_OBJECT_KEYS) {
      out.__truncated__ = true;
    }
    return out;
  }

  try {
    return String(value);
  } catch (_err) {
    return "[Unserializable]";
  }
}

function normalizePrinted(logs, base) {
  return logs
    .slice(base)
    .filter((l) => l.level === "log" || l.level === "info")
    .map((l) => l.args.join(""))
    .join("");
}

async function runOne(fn, test, index) {
  const logs = [];
  let userAnswer = undefined;
  const t0 = Date.now();
  const eps = typeof test?.epsilon === "number" ? test.epsilon : undefined;

  const safeConsole = Object.freeze({
    log: (...args) => {
      if (logs.length < MAX_LOGS_PER_TEST) logs.push({ level: "log", args: args.map((x) => toSerializable(x, new WeakSet(), 0)) });
    },
    info: (...args) => {
      if (logs.length < MAX_LOGS_PER_TEST) logs.push({ level: "info", args: args.map((x) => toSerializable(x, new WeakSet(), 0)) });
    },
    warn: (...args) => {
      if (logs.length < MAX_LOGS_PER_TEST) logs.push({ level: "warn", args: args.map((x) => toSerializable(x, new WeakSet(), 0)) });
    },
    error: (...args) => {
      if (logs.length < MAX_LOGS_PER_TEST) logs.push({ level: "error", args: args.map((x) => toSerializable(x, new WeakSet(), 0)) });
    },
  });

  const print = (...args) => {
    if (logs.length < MAX_LOGS_PER_TEST) {
      logs.push({ level: "log", args: args.map((x) => toSerializable(x, new WeakSet(), 0)) });
    }
    return undefined;
  };

  const checkAnswer = (answer) => {
    userAnswer = answer;
  };

  const input = "input" in (test || {}) ? deepClone(test.input) : undefined;
  const expect = "expect" in (test || {}) ? deepClone(test.expect) : undefined;
  const expectPrintRaw = "expect_print" in (test || {}) ? test.expect_print : undefined;
  const base = logs.length;

  try {
    let out = fn(input, checkAnswer, print, safeConsole);
    if (out && typeof out === "object" && typeof out.then === "function") {
      out = await out;
    }

    if (typeof out === "undefined" && userAnswer !== undefined) {
      out = userAnswer;
    }

    let passed = true;
    let diff;

    if ("expect" in (test || {})) {
      if (typeof out === "undefined") {
        passed = false;
        diff = { path: "$", expected: expect, actual: undefined, reason: "No return value" };
      } else {
        const r = deepEqualWithDiff(out, expect, eps, "$");
        passed = !!r.equal;
        if (!passed) {
          diff = { path: r.path, expected: r.expected, actual: r.actual };
        }
      }
    }

    if ("expect_print" in (test || {})) {
      let printed = normalizePrinted(logs, base);
      let expectPrint = expectPrintRaw;
      try {
        expectPrint = JSON.parse(expectPrintRaw);
      } catch (_err) {}

      if (typeof expectPrint === "number") {
        printed = Number(printed);
      }
      if (typeof expectPrint === "boolean" && typeof printed === "string") {
        printed = printed === "true";
      }
      if (typeof expectPrint === "object" && Array.isArray(expectPrint)) {
        printed = logs
          .slice(base)
          .filter((l) => l.level === "log" || l.level === "info")
          .map((l) => l.args.flat())
          .flat();
      }

      const r = deepEqualWithDiff(printed, expectPrint, eps, "$");
      passed = passed && !!r.equal;
      if (!r.equal) {
        diff = { path: r.path, expected: r.expected, actual: r.actual };
      }
    }

    return {
      index,
      ok: passed,
      result: toSerializable(out, new WeakSet(), 0),
      logs,
      ms: Date.now() - t0,
      assert: "expect" in (test || {}) ? toSerializable({ passed, expected: expect, diff }, new WeakSet(), 0) : undefined,
      assert_print: "expect_print" in (test || {}) ? toSerializable({ passed, expected: expectPrintRaw, diff }, new WeakSet(), 0) : undefined,
    };
  } catch (err) {
    return {
      index,
      ok: false,
      error: (err?.name || "Error") + ": " + (err?.message || String(err)),
      logs,
      ms: Date.now() - t0,
    };
  }
}

self.onmessage = async (event) => {
  const trustedPostMessage = self.postMessage.bind(self);
  const payload = event?.data || {};
  if (payload.token !== RUN_TOKEN) {
    return;
  }

  try {
    const fn = buildUserFn(payload.code || "");
    const tests = Array.isArray(payload.tests) ? payload.tests.slice(0, MAX_TESTS) : [];
    const executionTests = tests.length === 0 ? [{}] : tests;
    const results = [];
    for (let i = 0; i < executionTests.length; i++) {
      const result = await runOne(fn, executionTests[i], i);
      results.push(toSerializable(result, new WeakSet(), 0));
    }

    trustedPostMessage(toSerializable({ token: RUN_TOKEN, ok: true, results }, new WeakSet(), 0));
  } catch (err) {
    const syntaxError = (err?.name || "SyntaxError") + ": " + (err?.message || String(err));
    const tests = Array.isArray(payload.tests) ? payload.tests : [];
    const total = tests.length === 0 ? 1 : tests.length;
    const results = Array.from({ length: total }, (_x, i) => ({
      index: i,
      ok: false,
      errorType: "syntax",
      error: syntaxError,
      logs: [],
      ms: 0,
    }));
    trustedPostMessage(toSerializable({ token: RUN_TOKEN, ok: true, results }, new WeakSet(), 0));
  }
};
\`;

  const workerUrl = URL.createObjectURL(
    new Blob([workerSource], { type: 'application/javascript' }),
  );
  const worker = new Worker(workerUrl, {
    type: 'module',
    deno: { permissions: 'none' },
  });

  try {
    const response = await new Promise((resolve) => {
      const workerWaitTimer = workerTimeoutMs
        ? setTimeout(() => {
            worker.terminate();
            resolve({
              ok: false,
              error: 'worker_timeout',
              detail: 'worker execution exceeded timeout budget',
            });
          }, workerTimeoutMs)
        : null;

      const finish = (value) => {
        if (workerWaitTimer) {
          clearTimeout(workerWaitTimer);
        }
        resolve(value);
      };

      worker.onmessage = (event) => {
        const data = event?.data;
        if (!data || data.token !== workerToken) {
          return;
        }
        finish(data);
      };
      worker.onerror = (event) => {
        finish({
          ok: false,
          error: 'harness_failure',
          detail: event?.message || 'worker runtime failure',
        });
      };
      worker.onmessageerror = () => {
        finish({
          ok: false,
          error: 'worker_message_error',
          detail: 'worker emitted a malformed message',
        });
      };
      worker.postMessage({ token: workerToken, code, tests });
    });

    const payload = JSON.stringify(response);
    await Deno.stdout.write(
      new TextEncoder().encode((resultToken || '') + payload),
    );
  } catch (err) {
    const payload = JSON.stringify({
      ok: false,
      error: 'harness_failure',
      detail: String(err),
    });
    await Deno.stdout.write(
      new TextEncoder().encode((resultToken || '') + payload),
    );
  } finally {
    worker.terminate();
    URL.revokeObjectURL(workerUrl);
  }
})();
`;

/* ---------- Helpers ---------- */

const b64 = (s: string) => Buffer.from(s, 'utf8').toString('base64');

function buildErrorDetail(error: unknown): string {
  if (error instanceof Error) {
    const stack = error.stack ? `\n${error.stack}` : '';
    return `${error.name}: ${error.message}${stack}`;
  }
  return String(error);
}

function validateSyntaxWithoutExecution(code: string) {
  try {
    const wrappedSource = [
      'globalThis.__USER_FN__ = function __USER_FN__(input, checkAnswer, print, console) {',
      USER_FN_BODY_PREFIX.trimEnd(),
      code,
      `\n//# sourceURL=${SUBMITTED_FILENAME}`,
      '};',
    ].join('\n');
    new Script(wrappedSource, {
      filename: SUBMITTED_FILENAME,
    });
    return { ok: true as const };
  } catch (error) {
    return {
      ok: false as const,
      detail: buildErrorDetail(error),
    };
  }
}

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
    spawn(
      'powershell.exe',
      [
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        `$p = Get-Process -Id ${pid}; ` +
          `$p.PriorityClass = 'BelowNormal'; ` +
          `$p.ProcessorAffinity = 1`,
      ],
      { windowsHide: true, stdio: 'ignore' },
    );
  } catch {
    /* ignore */
  }
}

async function withHarnessFile<T>(
  cb: (params: { harnessPath: string; resultToken: string }) => Promise<T>,
): Promise<T> {
  const dir = await mkdtemp(join(tmpdir(), 'etc-deno-runner-'));
  const harnessPath = join(dir, 'sandbox_harness.mjs');
  const resultToken = `${RESULT_MARKER}${crypto.randomUUID()}::`;

  try {
    await writeFile(harnessPath, HARNESS_BATCH, 'utf8');
    return await cb({ harnessPath, resultToken });
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => undefined);
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
  const syntaxCheckResult = validateSyntaxWithoutExecution(code);
  if (!syntaxCheckResult.ok) {
    return {
      status: 'parse_error',
      ...extractSyntaxErrorDetails(code, syntaxCheckResult.detail),
    };
  }

  const codeB64 = b64(code);
  const testsB64 = b64(JSON.stringify(tests ? tests : []));
  const workerTimeoutMs = Math.max(100, timeoutMs - 250);

  return await withHarnessFile(async ({ harnessPath, resultToken }) => {
    const args = [
      'run',
      '--quiet',
      '--no-config',
      '--no-prompt',
      '--no-remote',
      '--no-npm',
      '--unstable-worker-options',
      `--allow-read=${harnessPath}`,
      '--deny-write',
      '--deny-net',
      '--deny-env',
      '--deny-run',
      '--deny-ffi',
      '--deny-sys',
      '--deny-import',
      `--v8-flags=--max-old-space-size=${Math.max(64, Math.floor(heapMb))}`,
      harnessPath,
      codeB64,
      testsB64,
      resultToken,
      String(workerTimeoutMs),
    ];

    return await spawnChild({
      args,
      resultToken,
      opts: { softenCpu, timeoutMs },
    });
  });
}

async function spawnChild(params: {
  args: string[];
  resultToken: string;
  opts: {
    softenCpu: boolean;
    timeoutMs: number;
  };
}) {
  const {
    args,
    resultToken,
    opts: { softenCpu, timeoutMs },
  } = params;

  const child = spawn(DENO_BIN, args, {
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (softenCpu) softenCpuOnWindows(child.pid!);

  let stdout = '';
  let stderr = '';
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  let killedByOutputCap = false;
  child.stdout.on('data', (d: string) => {
    stdout += d;
    if (stdout.length > MAX_STDOUT_BYTES) {
      killedByOutputCap = true;
      try {
        child.kill('SIGKILL');
      } catch {
        /* ignore */
      }
    }
  });
  child.stderr.on('data', (d: string) => {
    stderr += d;
    if (stderr.length > MAX_STDERR_BYTES) {
      killedByOutputCap = true;
      try {
        child.kill('SIGKILL');
      } catch {
        /* ignore */
      }
    }
  });

  let killedByTimeout = false;
  const killTimer = setTimeout(() => {
    killedByTimeout = true;
    try {
      child.kill('SIGKILL');
    } catch {
      /* ignore */
    }
  }, timeoutMs + 50);

  return await new Promise<SandboxRunResult>((resolve) => {
    child.on('close', (_code, signal) => {
      clearTimeout(killTimer);

      if (killedByTimeout) {
        resolve({ status: 'timeout', detail: 'execution exceeded timeout' });
        return;
      }
      if (killedByOutputCap) {
        resolve({
          status: 'crash',
          detail: 'execution output exceeded safe size limit',
        });
        return;
      }

      const markerAt = stdout.lastIndexOf(resultToken);
      const markedPayload =
        markerAt >= 0 ? stdout.slice(markerAt + resultToken.length) : '';

      if (markedPayload.length > MAX_RESULT_PAYLOAD_BYTES) {
        resolve({
          status: 'crash',
          detail: 'harness output exceeded safe payload size',
        });
        return;
      }

      try {
        const parsed = JSON.parse(markedPayload) as {
          ok?: boolean;
          error?: string;
          detail?: string;
          results?: SandboxPerTest[];
        };
        if (
          parsed &&
          parsed.ok === true &&
          Array.isArray(parsed.results) &&
          parsed.results.every(
            (result) =>
              result &&
              typeof result === 'object' &&
              typeof result.index === 'number' &&
              typeof result.ok === 'boolean' &&
              Array.isArray(result.logs),
          )
        ) {
          resolve({ status: 'ok', results: parsed.results });
          return;
        }
        if (parsed && parsed.ok === false) {
          resolve({
            status: 'crash',
            detail: [parsed.error || 'harness_failure', parsed.detail]
              .filter(Boolean)
              .join(': '),
          });
          return;
        }
      } catch {
        /* fall through */
      }

      const blob = (stderr || markedPayload || stdout || '').slice(0, 4000);
      if (looksLikeOom(blob)) {
        resolve({ status: 'oom', detail: blob });
      } else if (signal) {
        resolve({ status: 'killed', detail: `terminated by signal ${signal}` });
      } else {
        resolve({ status: 'crash', detail: blob || 'invalid harness output' });
      }
    });
  });
}

function extractSyntaxErrorDetails(code: string, stack: string) {
  const fname = SUBMITTED_FILENAME;

  function escapeRegex(s: string) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function extractUserPosition(stack: string, filename: string) {
    if (!stack) return { line: undefined, column: undefined };
    const s = String(stack);

    const rxFile = new RegExp(escapeRegex(filename) + ':(\\d+)(?::(\\d+))?');
    let m = s.match(rxFile);
    if (m) {
      const rawLine = Number(m[1]) || undefined;
      const line =
        typeof rawLine === 'number'
          ? Math.max(1, rawLine - USER_FN_BODY_PREFIX_LINES - 1)
          : rawLine;
      let column = m[2] ? Number(m[2]) || undefined : undefined;
      if (!column) {
        const caretMatch = s.match(/\n([ \t]*)\^/);
        const spaces = caretMatch?.[1];
        if (typeof spaces === 'string') {
          column = spaces.length + 1;
        }
      }
      return {
        line,
        column,
      };
    }

    m = s.match(/<anonymous>:(\d+):(\d+)/);
    if (m) {
      return {
        line: Number(m[1]) || undefined,
        column: Number(m[2]) || undefined,
      };
    }

    m = s.match(/:(\d+):(\d+)/);
    return {
      line: m ? Number(m[1]) : undefined,
      column: m ? Number(m[2]) : undefined,
    };
  }

  const pos = extractUserPosition(stack, fname);
  const lines = code.split(/\r?\n/);
  const mappedLine =
    typeof pos.line === 'number'
      ? Math.min(Math.max(1, pos.line), Math.max(1, lines.length))
      : undefined;
  const errorLine = mappedLine;
  const errorColumn = pos.column;

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
      ? `> ${errorLine} | ${bad}${caret}`
      : `> ? | ${bad}${caret}`;

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
