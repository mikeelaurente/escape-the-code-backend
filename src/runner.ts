import { spawn } from 'child_process';
import path from 'path';

export function runCode(args: string): Promise<string> {
  const scriptPath = path.join(__dirname, '../npc/runner.py');
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python', ['-u', scriptPath, args]);

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
        console.log('######################################');
        console.log(scriptOutput);
        console.log('######################################');
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
