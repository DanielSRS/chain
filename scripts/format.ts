#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * A utility script to format specific files or directories with Prettier.
 * Usage: node scripts/format.ts [path1] [path2] ...
 */

import { execSync } from 'child_process';
import { resolve } from 'path';

const DEFAULT_PATTERNS = [
  '**/*.{js,ts,jsx,tsx,json,md,yml,yaml}',
  '!node_modules/**',
  '!.yarn/**',
];

// Get paths from command line arguments or use default patterns
const paths = process.argv.slice(2).length
  ? process.argv.slice(2)
  : DEFAULT_PATTERNS;

try {
  console.log('🧹 Formatting files with Prettier...');

  const command = `npx prettier --write ${paths.map(p => `"${p}"`).join(' ')}`;

  execSync(command, {
    stdio: 'inherit',
    cwd: resolve(process.cwd()),
  });

  console.log('✨ Formatting complete!');
} catch (error) {
  console.error('❌ Formatting failed:', error);
  process.exit(1);
}
