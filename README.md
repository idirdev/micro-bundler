# micro-bundler

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D14-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-4.5-blue)

A JavaScript module bundler built from scratch for educational purposes. Understand how tools like Webpack, Rollup, and Parcel work under the hood.

## How Bundlers Work

A module bundler takes multiple JavaScript files with `import`/`require` statements and combines them into one (or more) output files that can run in the browser or Node.js. Here is what happens step by step:

```
1. PARSE        Read source files and extract import/export statements
2. RESOLVE      Find the actual file path for each import specifier
3. GRAPH        Build a dependency graph of all connected modules
4. TRANSFORM    Rewrite imports/exports to use an internal module system
5. BUNDLE       Concatenate all modules with a runtime loader
6. OPTIMIZE     (Optional) Minify, tree-shake, generate source maps
```

## Architecture

```
                          +------------------+
                          |   CLI (index.ts) |
                          +--------+---------+
                                   |
                                   v
  +----------+   +----------+   +----------+   +-------------+   +----------+
  | parser.ts|-->|resolver.ts|-->| graph.ts |-->|transformer.ts|-->|bundler.ts|
  +----------+   +----------+   +----------+   +-------------+   +----------+
       |                              |                                |
       v                              v                                v
  Extract imports            Build dep graph                    Generate output
  Extract exports            Detect cycles                     (CJS / ESM / IIFE)
  Detect re-exports          Topological sort                  Inject runtime
                             Tree-shake
                                   |
                          +--------+---------+
                          |                  |
                     +---------+      +-----------+
                     |minifier |      |  watcher  |
                     +---------+      +-----------+
```

## Features

- **Module resolution** - Resolves relative paths, `node_modules`, file extensions (`.ts`, `.js`, `.json`), `index.js` files, and `package.json` main field
- **Dependency graph** - BFS traversal, adjacency list, circular dependency detection, topological sort
- **Tree-shaking** - Marks used exports and identifies dead code
- **Multiple output formats** - CommonJS (`cjs`), ES Modules (`esm`), IIFE (`iife`)
- **Minification** - Comment removal, whitespace collapsing, console stripping, basic variable mangling
- **Watch mode** - File system watcher with debounced rebuilds
- **Source maps** - (Planned) Source map generation for debugging

## Installation

```bash
npm install
npm run build
```

## Usage

### CLI

```bash
# Basic bundle (CommonJS output)
node dist/index.js bundle --entry src/app.js --output dist/bundle.js

# ES Module output
node dist/index.js bundle -e src/app.js -o dist/bundle.mjs --format esm

# IIFE for browsers with minification
node dist/index.js bundle -e src/app.js -o dist/bundle.min.js --format iife --minify --global-name MyApp

# Watch mode
node dist/index.js bundle -e src/app.js -o dist/bundle.js --watch
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `-e, --entry <path>` | Entry point file path | (required) |
| `-o, --output <path>` | Output bundle file path | (required) |
| `-f, --format <format>` | Output format: `esm`, `cjs`, `iife` | `cjs` |
| `-m, --minify` | Minify the output | `false` |
| `-s, --sourcemap` | Generate source map | `false` |
| `-w, --watch` | Watch for changes | `false` |
| `-g, --global-name <name>` | Global name for IIFE | `Bundle` |

### Example

```bash
# Bundle the included example
npm run bundle:example
```

## How It Works

### 1. Parsing (`parser.ts`)

The parser reads a JavaScript file and uses regex-based analysis to extract:
- ES module imports (`import X from './y'`)
- CommonJS requires (`const X = require('./y')`)
- Dynamic imports (`import('./y')`)
- Named and default exports
- Re-exports (`export { X } from './y'`)

### 2. Resolution (`resolver.ts`)

The resolver converts import specifiers into absolute file paths:
- Relative paths (`./utils` -> `/project/src/utils.js`)
- Extension resolution (tries `.ts`, `.js`, `.json`)
- Index files (`./utils` -> `./utils/index.js`)
- Node modules (walks up `node_modules` directories)
- Package.json `main` and `module` fields

### 3. Graph Building (`graph.ts`)

Starting from the entry file, BFS traversal discovers all modules:
- Builds an adjacency list of dependencies
- Detects circular dependencies
- Performs topological sort (Kahn's algorithm)
- Marks used exports for tree-shaking

### 4. Transformation (`transformer.ts`)

Each module's source code is transformed:
- `import X from './y'` becomes `var X = __require(id).default`
- `export const X` becomes `__exports.X = X`
- Module code is wrapped in a factory function

### 5. Bundling (`bundler.ts`)

All transformed modules are concatenated with a runtime:

```javascript
// Runtime provides __require and __modules
var __modules = {};
var __cache = {};
function __require(id) { /* ... */ }

// Each module is registered
__modules[0] = function(__exports, __require) { /* ... */ };
__modules[1] = function(__exports, __require) { /* ... */ };

// Entry point is executed
var entry = __require(0);
```

## Project Structure

```
micro-bundler/
  src/
    index.ts          CLI entry point
    types.ts          TypeScript interfaces
    parser.ts         Source file parser
    resolver.ts       Module path resolver
    graph.ts          Dependency graph builder
    transformer.ts    Import/export rewriter
    bundler.ts        Bundle generator + runtime
    minifier.ts       Code minifier
    watcher.ts        File change watcher
  examples/
    src/
      index.js        Example entry point
      math.js         Example math module
      utils.js        Example utils module
  dist/               Compiled output (git ignored)
```

## Limitations

This is an educational project. It does not handle:
- CSS/asset imports
- Code splitting / lazy loading
- Full AST parsing (uses regex)
- Production-grade source maps
- Hot Module Replacement (HMR)
- Plugins / loader system

## License

MIT

## Known Limitations

- Dynamic imports not yet supported
- CSS modules require a plugin
