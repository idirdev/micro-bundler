import { Graph, BundlerConfig } from './types';
import { transformModule } from './transformer';

/**
 * Generate the final bundle from the dependency graph.
 * Concatenates all transformed modules with the runtime loader.
 */
export function bundle(graph: Graph, config: BundlerConfig): string {
  const transformedModules = graph.sortedModules.map((mod) => transformModule(mod, graph));

  const runtime = generateRuntime(graph.entryModule.id);
  const moduleCode = transformedModules.join('\n\n');

  switch (config.format) {
    case 'cjs':
      return wrapCJS(runtime, moduleCode, graph.entryModule.id);
    case 'esm':
      return wrapESM(runtime, moduleCode, graph.entryModule.id);
    case 'iife':
      return wrapIIFE(runtime, moduleCode, graph.entryModule.id, config.globalName || 'Bundle');
    default:
      throw new Error(`Unknown output format: ${config.format}`);
  }
}

/**
 * Generate the module loader runtime.
 * This is the core of the bundler - it provides __require and __modules.
 */
function generateRuntime(entryId: number): string {
  return `
// micro-bundler runtime v1.0.0
var __modules = {};
var __cache = {};

function __require(moduleId) {
  // Return cached module if already loaded
  if (__cache[moduleId]) {
    return __cache[moduleId].exports;
  }

  // Create a new module entry
  var module = {
    id: moduleId,
    exports: {}
  };

  // Cache it before executing (handles circular dependencies)
  __cache[moduleId] = module;

  // Execute the module function
  var moduleFn = __modules[moduleId];
  if (!moduleFn) {
    throw new Error('Module not found: ' + moduleId);
  }

  moduleFn(module.exports, __require);

  return module.exports;
}
`.trim();
}

/**
 * Wrap the bundle in CommonJS format.
 * Suitable for Node.js environments.
 */
function wrapCJS(runtime: string, moduleCode: string, entryId: number): string {
  return [
    `'use strict';`,
    ``,
    runtime,
    ``,
    `// Modules`,
    moduleCode,
    ``,
    `// Execute entry point`,
    `var __entry = __require(${entryId});`,
    ``,
    `// Export entry module`,
    `if (typeof module !== 'undefined' && module.exports) {`,
    `  module.exports = __entry;`,
    `}`,
  ].join('\n');
}

/**
 * Wrap the bundle in ES Module format.
 * Uses export default for the entry module's exports.
 */
function wrapESM(runtime: string, moduleCode: string, entryId: number): string {
  return [
    runtime,
    ``,
    `// Modules`,
    moduleCode,
    ``,
    `// Execute entry point`,
    `var __entry = __require(${entryId});`,
    ``,
    `// Re-export entry module`,
    `export default __entry;`,
    `var __keys = Object.keys(__entry);`,
    `for (var __i = 0; __i < __keys.length; __i++) {`,
    `  var __k = __keys[__i];`,
    `  if (__k !== 'default') {`,
    `    Object.defineProperty(exports, __k, {`,
    `      enumerable: true,`,
    `      get: (function(k) { return function() { return __entry[k]; }; })(__k)`,
    `    });`,
    `  }`,
    `}`,
  ].join('\n');
}

/**
 * Wrap the bundle in IIFE format with a global variable name.
 * Suitable for browser <script> tags.
 */
function wrapIIFE(runtime: string, moduleCode: string, entryId: number, globalName: string): string {
  return [
    `/**`,
    ` * Bundled with micro-bundler`,
    ` * Format: IIFE`,
    ` * Global: ${globalName}`,
    ` */`,
    `var ${globalName} = (function() {`,
    `  'use strict';`,
    ``,
    `  ${indentLines(runtime, 2)}`,
    ``,
    `  // Modules`,
    `  ${indentLines(moduleCode, 2)}`,
    ``,
    `  // Execute entry point`,
    `  return __require(${entryId});`,
    `})();`,
  ].join('\n');
}

/**
 * Indent each line of a multi-line string.
 */
function indentLines(code: string, spaces: number): string {
  const indent = ' '.repeat(spaces);
  return code
    .split('\n')
    .map((line, i) => (i === 0 ? line : indent + line))
    .join('\n');
}
