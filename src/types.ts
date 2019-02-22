/**
 * Represents a single module in the dependency graph.
 */
export interface Module {
  id: number;
  filePath: string;
  source: string;
  dependencies: Dependency[];
  exports: ExportInfo[];
  isEntry: boolean;
  usedExports: Set<string>;
}

/**
 * Represents a dependency relationship between modules.
 */
export interface Dependency {
  specifier: string;
  resolvedPath: string;
  importedNames: string[];
  isDefault: boolean;
  isDynamic: boolean;
  isReExport: boolean;
}

/**
 * Information about a module's exports.
 */
export interface ExportInfo {
  name: string;
  isDefault: boolean;
  isReExport: boolean;
  originalModule?: string;
  originalName?: string;
}

/**
 * The complete dependency graph of all modules.
 */
export interface Graph {
  modules: Module[];
  adjacencyList: Map<string, string[]>;
  sortedModules: Module[];
  entryModule: Module;
  circularDeps: [string, string][];
}

/**
 * Configuration for the bundler.
 */
export interface BundlerConfig {
  entry: string;
  output: string;
  format: 'esm' | 'cjs' | 'iife';
  minify: boolean;
  sourcemap: boolean;
  globalName?: string;
}

/**
 * Represents a processed asset ready for bundling.
 */
export interface Asset {
  id: number;
  filePath: string;
  code: string;
  mapping: Record<string, number>;
}

/**
 * Source map data for a module.
 */
export interface SourceMap {
  version: number;
  file: string;
  sources: string[];
  sourcesContent: string[];
  names: string[];
  mappings: string;
}

/**
 * Result of parsing a source file.
 */
export interface ParseResult {
  dependencies: Dependency[];
  exports: ExportInfo[];
  source: string;
  hasCircularRisk: boolean;
}

/**
 * Plugin interface for extending the bundler.
 */
export interface Plugin {
  name: string;
  extensions?: string[];
  load?(id: string): string | null;
  transform?(code: string, id: string): string | null;
  buildEnd?(): { type: string; fileName: string; source: string } | null;
}
