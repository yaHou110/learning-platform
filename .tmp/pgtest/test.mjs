import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

async function main() {
  try {
    // Check if embedded-postgres is available
    const { stdout } = await execAsync('npx --yes embedded-postgres --version 2>&1');
    console.log('embedded-postgres:', stdout);
  } catch (e) {
    console.error('embedded-postgres not available:', e.message);
  }
}
main();
