import { strict as assert } from 'node:assert';
import { runWithDenoWindows } from '../runners/deno.runner';

type Case = {
  name: string;
  code: string;
  expectStatus:
    | 'ok'
    | 'parse_error'
    | 'timeout'
    | 'oom'
    | 'killed'
    | 'crash'
    | Array<'ok' | 'parse_error' | 'timeout' | 'oom' | 'killed' | 'crash'>;
  timeoutMs: number;
  tests?: { input: unknown; expect?: unknown }[];
};

const cases: Case[] = [
  {
    name: 'deno_exit',
    code: 'Deno.exit(0)',
    expectStatus: 'crash',
    timeoutMs: 1000,
    tests: [{ input: 1 }],
  },
  {
    name: 'deno_stdout_write',
    code: 'Deno.stdout.writeSync(new TextEncoder().encode("x")); return 1;',
    expectStatus: 'ok',
    timeoutMs: 1000,
    tests: [{ input: 1, expect: 1 }],
  },
  {
    name: 'override_post_message',
    code: 'self.postMessage = () => {}; return 1;',
    expectStatus: 'ok',
    timeoutMs: 1000,
    tests: [{ input: 1, expect: 1 }],
  },
  {
    name: 'self_close',
    code: 'self.close(); return 1;',
    expectStatus: 'crash',
    timeoutMs: 1000,
    tests: [{ input: 1 }],
  },
  {
    name: 'infinite_loop',
    code: 'while (true) {}',
    expectStatus: ['crash', 'timeout'],
    timeoutMs: 500,
    tests: [{ input: 1, expect: 1 }],
  },
  {
    name: 'large_allocation',
    code: 'const xs = new Array(2_000_000).fill("x".repeat(1000)); return xs.length;',
    expectStatus: ['ok', 'oom', 'timeout', 'crash'],
    timeoutMs: 1000,
    tests: [{ input: 1 }],
  },
  {
    name: 'excessive_console_output',
    code: 'for (let i = 0; i < 5000; i++) console.log("x".repeat(200)); return 1;',
    expectStatus: ['ok', 'crash'],
    timeoutMs: 2000,
    tests: [{ input: 1, expect: 1 }],
  },
  {
    name: 'serialize_function_bigint_circular',
    code: 'const c = {}; c.self = c; console.log(()=>1, 1n, c); return 1;',
    expectStatus: 'ok',
    timeoutMs: 1000,
    tests: [{ input: 1, expect: 1 }],
  },
];

async function run() {
  for (const testCase of cases) {
    const result = await runWithDenoWindows({
      code: testCase.code,
      timeoutMs: testCase.timeoutMs,
      tests: testCase.tests as any,
      heapMb: 128,
      softenCpu: false,
    });

    console.log(
      JSON.stringify({
        name: testCase.name,
        status: result.status,
      }),
    );
    if (Array.isArray(testCase.expectStatus)) {
      assert.ok(testCase.expectStatus.includes(result.status), testCase.name);
    } else {
      assert.equal(result.status, testCase.expectStatus, testCase.name);
    }
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
