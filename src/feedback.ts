import { spawn } from 'child_process';
import path from 'path';
import ollama, { AbortableAsyncIterator, ChatResponse } from 'ollama';

export function generateFeedback(args: string): Promise<string> {
  const query = Buffer.from(args).toString('base64');
  const scriptPath = path.join(__dirname, '../npc/runner.py');
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn(process.env.PYTHON_EXEC!, [
      '-u',
      scriptPath,
      query,
    ]);

    let scriptOutput = '';
    let scriptError = '';

    pythonProcess.stdout.on('data', (data) => {
      scriptOutput += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      scriptError += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        resolve(scriptOutput.trim());
      } else {
        reject(
          new Error(
            `Python script exited with code ${code}. Error: ${scriptError.trim()}`,
          ),
        );
      }
    });

    pythonProcess.on('error', (err) => {
      reject(new Error(`Failed to start Python process: ${err.message}`));
    });
  });
}

export async function generateOllamaFeedback(
  query: string,
): Promise<AbortableAsyncIterator<ChatResponse> | undefined> {
  try {
    const message = {
      role: 'user',
      content: `You are to give feedback about the provided source code. The source code is written in Javascript. Remember you are talking to a complete beginner.\n\nQuery: ${query}`,
    };
    return await ollama.chat({
      model: 'llama3.2',
      messages: [message],
      stream: true,
    });
  } catch (e) {}
}
