#!/usr/bin/env node

/**
 * This is a simple script to validate TypeScript is working
 * with our configuration settings.
 */

// Demonstrate type checking
function greet(name: string): string {
  return `Hello, ${name}!`;
}

// Using the function with proper type
console.log(greet("TypeScript"));

// This would cause a type error if uncommented:
// console.log(greet(123));

// Demonstrate ES Module syntax
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read package.json to demonstrate file operations
try {
  const packageJsonPath = join(__dirname, "..", "package.json");
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
  console.log(`Project name: ${packageJson.name}`);
} catch (error) {
  console.error("Error reading package.json:", error);
}

// Create a simple interface to demonstrate type checking
interface User {
  id: number;
  name: string;
  email: string;
}

// Use the interface
const user: User = {
  id: 1,
  name: "John Doe",
  email: "john@example.com",
};

console.log("User:", user);
console.log("TypeScript validation complete!");
