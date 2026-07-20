#!/usr/bin/env node
/**
 * Security audit script using OSV Scanner.
 * Reads pnpm-lock.yaml and scans for known vulnerabilities via OSV database.
 *
 * Usage: pnpm security:audit
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const ROOT = resolve(__filename, '..', '..', '..');
const LOCKFILE = resolve(ROOT, 'pnpm-lock.yaml');
const SCANNER = 'osv-scanner';

function main() {
  console.log('🔍 Security Audit — OSV Scanner');
  console.log('');

  // Check lockfile exists
  if (!existsSync(LOCKFILE)) {
    console.error('❌ pnpm-lock.yaml not found at', LOCKFILE);
    process.exit(1);
  }
  console.log('✓ Lockfile found:', LOCKFILE);

  // Check scanner in PATH
  try {
    execSync(`${SCANNER} --version`, { stdio: 'ignore' });
    console.log('✓ osv-scanner found in PATH');
  } catch {
    console.error('❌ osv-scanner not found in PATH');
    console.error('');
    console.error('Install OSV Scanner:');
    console.error('  macOS:  brew install google/osv-scanner/osv-scanner');
    console.error('  Linux:  curl -sSL https://github.com/google/osv-scanner/releases/latest/download/osv-scanner_linux_amd64 -o /usr/local/bin/osv-scanner && chmod +x /usr/local/bin/osv-scanner');
    console.error('  Windows: scoop install osv-scanner');
    console.error('  Go:     go install github.com/google/osv-scanner/cmd/osv-scanner@latest');
    console.error('');
    console.error('See: https://github.com/google/osv-scanner#installation');
    process.exit(1);
  }

  // Run scan
  console.log('');
  console.log('📋 Scanning dependencies...');
  console.log('');

  try {
    const output = execSync(`${SCANNER} scan --lockfile="${LOCKFILE}"`, {
      encoding: 'utf-8',
      stdio: 'pipe',
      timeout: 120000,
    });
    console.log(output);
    console.log('✅ No vulnerabilities found');
    process.exit(0);
  } catch (error) {
    // osv-scanner exits with code 1 when vulnerabilities found
    if (error.status === 1 && error.stdout) {
      console.log(error.stdout);
      console.log('');
      console.log('⚠️  Vulnerabilities detected. Review output above.');
      process.exit(1);
    } else if (error.status === 0) {
      console.log('✅ No vulnerabilities found');
      process.exit(0);
    } else {
      console.error('❌ Scan failed:', error.message);
      if (error.stderr) console.error(error.stderr);
      process.exit(2);
    }
  }
}

main();