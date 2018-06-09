import { Graph, Module, Dependency } from './types';
import { parseSource } from './parser';
import { resolveModule } from './resolver';
import * as fs from 'fs';

let moduleIdCounter = 0;

/**
 * Build the complete dependency graph starting from the entry file.
 * Uses BFS traversal to discover all modules, then performs topological sort.
 */
export function buildGraph(entryPath: string): Graph {
  moduleIdCounter = 0;

  const modules: Module[] = [];
  const adjacencyList = new Map<string, string[]>();
  const visited = new Map<string, Module>();
  const circularDeps: [string, string][] = [];

  // BFS queue
  const queue: string[] = [entryPath];
  const inProgress = new Set<string>();

  while (queue.length > 0) {
    const filePath = queue.shift()!;

    if (visited.has(filePath)) continue;

    inProgress.add(filePath);

    const source = fs.readFileSync(filePath, 'utf-8');
    const parseResult = parseSource(source, filePath);

    const mod: Module = {
      id: moduleIdCounter++,
      filePath,
      source,
      dependencies: [],
      exports: parseResult.exports,
      isEntry: filePath === entryPath,
      usedExports: new Set<string>(),
    };

    const neighbors: string[] = [];

    for (const dep of parseResult.dependencies) {
      try {
        const resolvedPath = resolveModule(dep.specifier, filePath);
        const resolvedDep: Dependency = { ...dep, resolvedPath };
        mod.dependencies.push(resolvedDep);
        neighbors.push(resolvedPath);

        // Detect circular dependencies
        if (inProgress.has(resolvedPath)) {
          circularDeps.push([filePath, resolvedPath]);
          console.warn(`[micro-bundler] Circular dependency detected: ${filePath} <-> ${resolvedPath}`);
        }

        if (!visited.has(resolvedPath)) {
          queue.push(resolvedPath);
        }
      } catch (err: any) {
        console.warn(`[micro-bundler] Could not resolve "${dep.specifier}" from ${filePath}: ${err.message}`);
      }
    }

    adjacencyList.set(filePath, neighbors);
    visited.set(filePath, mod);
    modules.push(mod);
    inProgress.delete(filePath);
  }

  // Mark used exports (basic tree-shaking)
  markUsedExports(modules);

  // Topological sort
  const sortedModules = topologicalSort(modules, adjacencyList);

  const entryModule = modules.find((m) => m.isEntry)!;

  return { modules, adjacencyList, sortedModules, entryModule, circularDeps };
}

/**
 * Mark which exports are actually used by other modules (basic tree-shaking).
 */
function markUsedExports(modules: Module[]): void {
  const moduleByPath = new Map(modules.map((m) => [m.filePath, m]));

  for (const mod of modules) {
    for (const dep of mod.dependencies) {
      const target = moduleByPath.get(dep.resolvedPath);
      if (target) {
        for (const name of dep.importedNames) {
          target.usedExports.add(name);
        }
      }
    }
  }

  // Entry module exports are always considered used
  const entry = modules.find((m) => m.isEntry);
  if (entry) {
    entry.exports.forEach((e) => entry.usedExports.add(e.name));
  }
}

/**
 * Perform a topological sort on the module graph using Kahn's algorithm.
 * Returns modules in dependency-first order.
 */
function topologicalSort(modules: Module[], adjacencyList: Map<string, string[]>): Module[] {
  const moduleByPath = new Map(modules.map((m) => [m.filePath, m]));
  const inDegree = new Map<string, number>();
  const result: Module[] = [];

  // Initialize in-degrees
  for (const mod of modules) {
    if (!inDegree.has(mod.filePath)) inDegree.set(mod.filePath, 0);
  }

  for (const [, neighbors] of adjacencyList) {
    for (const neighbor of neighbors) {
      inDegree.set(neighbor, (inDegree.get(neighbor) || 0) + 1);
    }
  }

  // Start with modules that have no incoming edges
  const queue = modules
    .filter((m) => (inDegree.get(m.filePath) || 0) === 0)
    .map((m) => m.filePath);

  while (queue.length > 0) {
    const filePath = queue.shift()!;
    const mod = moduleByPath.get(filePath);
    if (mod) result.push(mod);

    const neighbors = adjacencyList.get(filePath) || [];
    for (const neighbor of neighbors) {
      const degree = (inDegree.get(neighbor) || 0) - 1;
      inDegree.set(neighbor, degree);
      if (degree === 0) queue.push(neighbor);
    }
  }

  // If not all modules are in result, there are cycles - add remaining
  if (result.length < modules.length) {
    for (const mod of modules) {
      if (!result.includes(mod)) result.push(mod);
    }
  }

  return result;
}
