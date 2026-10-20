import { strict as assert } from 'node:assert';
import type { AbortableAsyncIterator, ChatResponse } from 'ollama';
import { generateOllamaFeedbackText, mergeAbortSignals } from '../feedback.js';

function abortError(message: string): Error {
  const error = new Error(message);
  error.name = 'AbortError';
  return error;
}

function createNeverEndingStream() {
  let aborted = false;
  let abortCalls = 0;
  const pendingRejectors: Array<(reason?: unknown) => void> = [];

  const stream = {
    abort() {
      abortCalls += 1;
      aborted = true;
      while (pendingRejectors.length) {
        const reject = pendingRejectors.shift();
        reject?.(abortError('stream aborted'));
      }
    },
    async *[Symbol.asyncIterator]() {
      while (!aborted) {
        await new Promise<void>((_resolve, reject) => {
          pendingRejectors.push(reject);
        });
      }
      throw abortError('stream aborted');
    },
  };

  return {
    stream,
    getAbortCalls: () => abortCalls,
  };
}

async function testStalledStreamInitTimeout() {
  let signalWasAborted = false;

  await assert.rejects(
    () =>
      generateOllamaFeedbackText(
        'test',
        50,
        (_query, options) =>
          new Promise((_resolve, reject) => {
            const signal = options?.signal;
            if (!signal) {
              reject(new Error('missing signal'));
              return;
            }

            signal.addEventListener(
              'abort',
              () => {
                signalWasAborted = true;
                reject(abortError('request aborted'));
              },
              { once: true },
            );
          }),
      ),
    (error) => error instanceof Error && error.message === 'feedback_timeout',
  );

  assert.equal(
    signalWasAborted,
    true,
    'timeout must abort stalled request initialization',
  );
}

async function testNeverEndingStreamTimeout() {
  const neverEnding = createNeverEndingStream();

  await assert.rejects(
    () =>
      generateOllamaFeedbackText('test', 50, async () => {
        return neverEnding.stream as unknown as AbortableAsyncIterator<ChatResponse>;
      }),
    (error) => error instanceof Error && error.message === 'feedback_timeout',
  );

  assert.ok(
    neverEnding.getAbortCalls() > 0,
    'timeout must abort the underlying stream',
  );
}

async function testMergeAbortSignalsCleanupAfterSuccess() {
  const primaryController = new AbortController();
  const secondaryController = new AbortController();
  const merged = mergeAbortSignals(
    primaryController.signal,
    secondaryController.signal,
  );

  assert.equal(
    merged.signal?.aborted ?? false,
    false,
    'merged signal should start active',
  );

  merged.cleanup();
  primaryController.abort(new Error('primary abort after cleanup'));

  assert.equal(
    merged.signal?.aborted ?? false,
    false,
    'merged signal must remain active once listeners are cleaned up',
  );
}

async function testMergeAbortSignalsAbortPropagation() {
  const primaryController = new AbortController();
  const secondaryController = new AbortController();
  const merged = mergeAbortSignals(
    primaryController.signal,
    secondaryController.signal,
  );
  const abortReason = new Error('secondary aborted');

  secondaryController.abort(abortReason);

  assert.equal(
    merged.signal?.aborted ?? false,
    true,
    'merged signal should abort when secondary aborts',
  );
  assert.equal(
    merged.signal?.reason,
    abortReason,
    'merged signal should preserve abort reason from aborted source',
  );
}

async function run() {
  await testStalledStreamInitTimeout();
  await testNeverEndingStreamTimeout();
  await testMergeAbortSignalsCleanupAfterSuccess();
  await testMergeAbortSignalsAbortPropagation();
  console.log('PASS: feedback timeout integration checks');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
