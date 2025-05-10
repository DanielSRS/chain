# Contributing

This document contains guidelines on how to contribute to the project.

## TypeScript Setup

This project uses TypeScript for type checking only, without transpilation. The code runs directly with Node.js's native TypeScript support.

### Available Scripts

- `yarn typecheck` - Run type checking for all projects
- `yarn typecheck:watch` - Watch mode for type checking
- `yarn update-refs` - Update and verify TypeScript configurations across workspaces
- `yarn validate` - Run a validation script to test TypeScript setup

### Adding a New Package or App

1. Create your package with a `tsconfig.json` file that extends from the base configuration:

For apps:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    /* Add any app-specific types here */
    "types": ["your-types-if-needed"]
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules"]
}
```

For packages:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    /* Add any package-specific compiler options here */
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules"]
}
```

2. Run `yarn update-refs` to verify TypeScript configurations

### Running TypeScript Files Directly

This project is set up to run TypeScript files directly with Node.js:

```bash
# Run a TypeScript file directly
node path/to/your/file.ts

# For scripts that need to be executable
chmod +x path/to/your/file.ts
./path/to/your/file.ts
```

### TypeScript Configuration Details

- We use `noEmit: true` in our base tsconfig to ensure type checking only
- Node's type stripping feature enables direct TypeScript execution
- Each workspace has its own tsconfig.json that extends from the base configuration
- For module resolution, we use `NodeNext` to ensure compatibility with Node.js's ESM support
