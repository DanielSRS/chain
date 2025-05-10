#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

// Recreate __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Find all workspace folders
const appsDir = path.resolve(__dirname, "..", "apps");
const packagesDir = path.resolve(__dirname, "..", "packages");

interface Workspaces {
  apps: string[];
  packages: string[];
}

const workspaces: Workspaces = {
  apps: fs.existsSync(appsDir) ? fs.readdirSync(appsDir) : [],
  packages: fs.existsSync(packagesDir) ? fs.readdirSync(packagesDir) : [],
};

// Check apps
for (const app of workspaces.apps) {
  const tsconfigPath = path.join(appsDir, app, "tsconfig.json");
  if (fs.existsSync(tsconfigPath)) {
    console.log(`✓ Found app with TypeScript config: ${app}`);
  }
}

// Check packages
for (const pkg of workspaces.packages) {
  const tsconfigPath = path.join(packagesDir, pkg, "tsconfig.json");
  if (fs.existsSync(tsconfigPath)) {
    console.log(`✓ Found package with TypeScript config: ${pkg}`);
  }
}

console.log("\n✨ TypeScript configuration check completed");
