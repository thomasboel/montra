import os from 'node:os';
import { execute } from '../lib/exec.js';

export async function notify(message: string) {
  const platform = os.platform();

  let command;

  switch (platform) {
    case 'darwin':
      command = `osascript -e 'display notification "${message}" with title "Montra CLI" sound name "Funk"'`;
      break;
    case 'win32':
      command = `powershell -Command "& {Add-Type -AssemblyName PresentationFramework;[System.Windows.MessageBox]::Show('${message}', 'Montra CLI')}"`;
      break;
  }

  if (!command) {
    return;
  }

  const result = await execute(command);

  if (!result.success) {
    console.error(
      `❌ Failed to notify user. Error: ${result.error.error.message}`,
    );
  }
}
