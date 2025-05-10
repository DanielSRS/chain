#!/usr/bin/env node

import { execSync } from "child_process";
import { existsSync, readdirSync } from "fs";
import { resolve, join, dirname } from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rootDir = resolve(__dirname, "..");
const appsDir = resolve(rootDir, "apps");
const packagesDir = resolve(rootDir, "packages");

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  blue: "\x1b[34m",
};

console.log(
  `${colors.blue}Running TypeScript type checking across all workspaces${colors.reset}`
);

// Type check root
try {
  console.log(`\n${colors.cyan}Checking root project${colors.reset}`);
  execSync("tsc --noEmit", { stdio: "inherit", cwd: rootDir });
  console.log(`${colors.green}✓ Root project passed${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}✗ Root project failed${colors.reset}`);
  process.exit(1);
}

// Type check apps
if (existsSync(appsDir)) {
  const apps = readdirSync(appsDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  for (const app of apps) {
    const appDir = join(appsDir, app);
    const tsconfigPath = join(appDir, "tsconfig.json");

    if (existsSync(tsconfigPath)) {
      console.log(`\n${colors.cyan}Checking app: ${app}${colors.reset}`);
      try {
        execSync("tsc --noEmit", { stdio: "inherit", cwd: appDir });
        console.log(`${colors.green}✓ App ${app} passed${colors.reset}`);
      } catch (error) {
        console.error(`${colors.red}✗ App ${app} failed${colors.reset}`);
        process.exit(1);
      }
    }
  }
}

// Type check packages
if (existsSync(packagesDir)) {
  const packages = readdirSync(packagesDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  for (const pkg of packages) {
    const pkgDir = join(packagesDir, pkg);
    const tsconfigPath = join(pkgDir, "tsconfig.json");

    if (existsSync(tsconfigPath)) {
      console.log(`\n${colors.cyan}Checking package: ${pkg}${colors.reset}`);
      try {
        execSync("tsc --noEmit", { stdio: "inherit", cwd: pkgDir });
        console.log(`${colors.green}✓ Package ${pkg} passed${colors.reset}`);
      } catch (error) {
        console.error(`${colors.red}✗ Package ${pkg} failed${colors.reset}`);
        process.exit(1);
      }
    }
  }
}

console.log(`\n${colors.green}✨ All TypeScript checks passed${colors.reset}`);
