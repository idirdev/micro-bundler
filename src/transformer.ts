import { Module, Graph } from './types';

/**
 * Transform a module's source code by rewriting imports and exports
 * to use the bundler's internal module system.
 */
export function transformModule(mod: Module, graph: Graph): string {
  let code = mod.source;
  const moduleMap = buildModuleMap(graph);

  // Rewrite ES module imports to internal require
  code = rewriteImports(code, mod, moduleMap);

  // Rewrite exports to internal module.exports
  code = rewriteExports(code, mod);

  // Wrap in module function
  return wrapInModuleFunction(code, mod.id);
}

/**
 * Build a mapping from file path to module ID.
 */
function buildModuleMap(graph: Graph): Map<string, number> {
  const map = new Map<string, number>();
  for (const mod of graph.modules) {
    map.set(mod.filePath, mod.id);
  }
  return map;
}

/**
 * Rewrite import statements to use the internal __require function.
 */
function rewriteImports(code: string, mod: Module, moduleMap: Map<string, number>): string {
  // Rewrite: import X from './y'  -->  const X = __require(id).default
  code = code.replace(
    /import\s+(\w+)\s+from\s*['"]([^'"]+)['"]\s*;?/g,
    (_match, name, _specifier) => {
      const dep = mod.dependencies.find((d) => d.specifier === _specifier);
      const id = dep ? moduleMap.get(dep.resolvedPath) : undefined;
      if (id !== undefined) {
        return `var ${name} = __require(${id}).default;`;
      }
      return `/* unresolved: ${_match} */`;
    }
  );

  // Rewrite: import { a, b } from './y'  -->  const { a, b } = __require(id)
  code = code.replace(
    /import\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]\s*;?/g,
    (_match, names, _specifier) => {
      const dep = mod.dependencies.find((d) => d.specifier === _specifier);
      const id = dep ? moduleMap.get(dep.resolvedPath) : undefined;
      if (id !== undefined) {
        return `var { ${names.trim()} } = __require(${id});`;
      }
      return `/* unresolved: ${_match} */`;
    }
  );

  // Rewrite: const X = require('./y')  -->  const X = __require(id)
  code = code.replace(
    /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    (_match, specifier) => {
      const dep = mod.dependencies.find((d) => d.specifier === specifier);
      const id = dep ? moduleMap.get(dep.resolvedPath) : undefined;
      if (id !== undefined) {
        return `__require(${id})`;
      }
      return `/* unresolved: ${_match} */`;
    }
  );

  return code;
}

/**
 * Rewrite export statements to assign to __exports.
 */
function rewriteExports(code: string, mod: Module): string {
  // Rewrite: export default X  -->  __exports.default = X
  code = code.replace(
    /export\s+default\s+/g,
    '__exports.default = '
  );

  // Rewrite: export const X = ...  -->  const X = ...; __exports.X = X
  code = code.replace(
    /export\s+(const|let|var)\s+(\w+)/g,
    (_match, decl, name) => `${decl} ${name}`
  );

  // Append named export assignments at the end for exported declarations
  const namedExports = mod.exports.filter((e) => !e.isDefault && !e.isReExport);
  if (namedExports.length > 0) {
    const assignments = namedExports
      .map((e) => `__exports.${e.name} = typeof ${e.name} !== 'undefined' ? ${e.name} : undefined;`)
      .join('\n');
    code += '\n' + assignments;
  }

  // Rewrite: export { a, b }  -->  remove (handled by assignments above)
  code = code.replace(/export\s*\{[^}]*\}\s*;?/g, '');

  // Rewrite re-exports: export { X } from './y'  -->  handled by transformer
  code = code.replace(/export\s*\{[^}]*\}\s*from\s*['"][^'"]+['"]\s*;?/g, '');

  return code;
}

/**
 * Wrap module code in a function for the module system.
 */
function wrapInModuleFunction(code: string, moduleId: number): string {
  return [
    `/* Module ${moduleId} */`,
    `__modules[${moduleId}] = function(__exports, __require) {`,
    code,
    `};`,
  ].join('\n');
}
