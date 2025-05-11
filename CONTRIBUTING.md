# Contributing

This document contains guidelines on how to contribute to the project.

## Commit Conventions

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for our commit messages. This leads to more readable messages that are easy to follow when looking through the project history and enables automatic generation of changelogs.

### Commit Message Format

Each commit message consists of a **header**, a **body**, and a **footer**. The header has a special format that includes a **type**, **scope**, and **subject**:

```
<type>(<scope>): <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

The **header** is mandatory, and the **scope** of the header is optional.

#### Type

The type must be one of the following:

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing or correcting existing tests
- **chore**: Changes to the build process or auxiliary tools and libraries such as documentation generation
- **ci**: Changes to our CI configuration files and scripts

#### Scope

The scope should be the name of the package/module affected (as perceived by the person reading the changelog).

#### Subject

The subject contains a succinct description of the change:

- Use the imperative, present tense: "change" not "changed" nor "changes"
- Don't capitalize the first letter
- No period (.) at the end

#### Body

The body should include the motivation for the change and contrast this with previous behavior.

#### Footer

The footer should contain any information about **Breaking Changes** and is also the place to reference GitHub issues that this commit **Closes**.

### Examples

```
feat(api): add ability to upload files to storage

Added a new endpoint to upload files to cloud storage with progress tracking.

Closes #123
```

```
fix(client): prevent session timeout during active use

Added a timer to refresh the auth token while the user is actively
using the application.

Fixes #456
```

```
docs(readme): update installation instructions

Updated the README with more detailed steps for development setup.
```

## Code Style and Formatting

This project uses Prettier for code formatting and ESLint for code quality. All code is automatically formatted on commit using Lefthook.

### Prettier

We use Prettier to ensure consistent code formatting across the project. The configuration is defined in `.prettierrc.json`.

- Run `yarn format` to format all files in the project
- Run `yarn format:check` to check if files are properly formatted without modifying them

VS Code users: Install the recommended Prettier extension and formatting will happen automatically on save.

## TypeScript Setup

This project uses TypeScript for type checking only, without transpilation. The code runs directly with Node.js's native TypeScript support.

### Available Scripts

- `yarn typecheck` - Run type checking for all projects
- `yarn typecheck:watch` - Watch mode for type checking
- `yarn typecheck:all` - Run type checking across all workspaces
- `yarn update-refs` - Update and verify TypeScript configurations across workspaces
- `yarn validate` - Run a validation script to test TypeScript setup
- `yarn format` - Format all files with Prettier
- `yarn format:check` - Check if files are properly formatted
- `yarn lint` - Run ESLint on all files

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
