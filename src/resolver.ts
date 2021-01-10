import * as path from 'path';
import * as fs from 'fs';

const EXTENSIONS = ['.ts', '.js', '.json', '.jsx', '.tsx'];

/**
 * Resolve a module specifier to an absolute file path.
 * Handles relative paths, node_modules, and various file extensions.
 */
export function resolveModule(specifier: string, fromFile: string): string {
  const fromDir = path.dirname(fromFile);

  // Relative path resolution
  if (specifier.startsWith('.') || specifier.startsWith('/')) {
    const absolutePath = path.resolve(fromDir, specifier);
    return resolveFilePath(absolutePath);
  }

  // Node modules resolution
  return resolveNodeModule(specifier, fromDir);
}

/**
 * Try to resolve a file path by testing different extensions and index files.
 */
function resolveFilePath(absolutePath: string): string {
  // Exact file exists
  if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile()) {
    return absolutePath;
  }

  // Try adding extensions
  for (const ext of EXTENSIONS) {
    const withExt = absolutePath + ext;
    if (fs.existsSync(withExt) && fs.statSync(withExt).isFile()) {
      return withExt;
    }
  }

  // Try as directory with index file
  if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isDirectory()) {
    for (const ext of EXTENSIONS) {
      const indexFile = path.join(absolutePath, `index${ext}`);
      if (fs.existsSync(indexFile)) {
        return indexFile;
      }
    }
  }

  throw new Error(`Cannot resolve module: ${absolutePath}`);
}

/**
 * Walk up the directory tree looking for node_modules.
 */
function resolveNodeModule(specifier: string, fromDir: string): string {
  let currentDir = fromDir;

  while (true) {
    const nodeModulesPath = path.join(currentDir, 'node_modules', specifier);

    // Check if the module directory exists
    if (fs.existsSync(nodeModulesPath)) {
      // Check package.json for "main" field
      const pkgJsonPath = path.join(nodeModulesPath, 'package.json');
      if (fs.existsSync(pkgJsonPath)) {
        const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
        const mainField = pkgJson.module || pkgJson.main || 'index.js';
        const mainPath = path.resolve(nodeModulesPath, mainField);
        return resolveFilePath(mainPath);
      }

      // Fallback to index.js
      return resolveFilePath(nodeModulesPath);
    }

    // Move up one directory
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      break; // Reached filesystem root
    }
    currentDir = parentDir;
  }

  throw new Error(`Cannot resolve node module: ${specifier} from ${fromDir}`);
}
