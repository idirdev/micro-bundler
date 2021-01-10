import { Dependency, ExportInfo, ParseResult } from './types';
import * as path from 'path';

const IMPORT_REGEX = /import\s+(?:(\w+)\s*,?\s*)?(?:\{([^}]*)\})?\s*from\s*['"]([^'"]+)['"]/g;
const REQUIRE_REGEX = /(?:const|let|var)\s+(?:(\w+)|\{([^}]*)\})\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
const EXPORT_DEFAULT_REGEX = /export\s+default\s+(?:function|class|)\s*(\w*)/g;
const EXPORT_NAMED_REGEX = /export\s+(?:const|let|var|function|class)\s+(\w+)/g;
const EXPORT_LIST_REGEX = /export\s*\{([^}]*)\}/g;
const RE_EXPORT_REGEX = /export\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g;
const DYNAMIC_IMPORT_REGEX = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

/**
 * Parse a source file and extract its imports, exports, and dependencies.
 */
export function parseSource(source: string, filePath: string): ParseResult {
  const dependencies: Dependency[] = [];
  const exports: ExportInfo[] = [];
  let hasCircularRisk = false;

  // Extract ES module imports
  let match: RegExpExecArray | null;
  const importRegex = new RegExp(IMPORT_REGEX.source, 'g');
  while ((match = importRegex.exec(source)) !== null) {
    const defaultImport = match[1];
    const namedImports = match[2];
    const specifier = match[3];

    const importedNames: string[] = [];
    if (defaultImport) importedNames.push('default');
    if (namedImports) {
      namedImports.split(',').forEach((n) => {
        const name = n.trim().split(/\s+as\s+/)[0].trim();
        if (name) importedNames.push(name);
      });
    }

    dependencies.push({
      specifier,
      resolvedPath: '',
      importedNames,
      isDefault: !!defaultImport && !namedImports,
      isDynamic: false,
      isReExport: false,
    });
  }

  // Extract CommonJS requires
  const requireRegex = new RegExp(REQUIRE_REGEX.source, 'g');
  while ((match = requireRegex.exec(source)) !== null) {
    const defaultName = match[1];
    const destructured = match[2];
    const specifier = match[3];

    const importedNames: string[] = [];
    if (defaultName) importedNames.push('default');
    if (destructured) {
      destructured.split(',').forEach((n) => {
        const name = n.trim().split(/\s*:\s*/)[0].trim();
        if (name) importedNames.push(name);
      });
    }

    dependencies.push({
      specifier,
      resolvedPath: '',
      importedNames,
      isDefault: !!defaultName,
      isDynamic: false,
      isReExport: false,
    });
  }

  // Extract dynamic imports
  const dynamicRegex = new RegExp(DYNAMIC_IMPORT_REGEX.source, 'g');
  while ((match = dynamicRegex.exec(source)) !== null) {
    dependencies.push({
      specifier: match[1],
      resolvedPath: '',
      importedNames: ['*'],
      isDefault: false,
      isDynamic: true,
      isReExport: false,
    });
  }

  // Extract re-exports (must come before general export extraction)
  const reExportRegex = new RegExp(RE_EXPORT_REGEX.source, 'g');
  while ((match = reExportRegex.exec(source)) !== null) {
    const names = match[1];
    const fromModule = match[2];

    names.split(',').forEach((n) => {
      const parts = n.trim().split(/\s+as\s+/);
      const originalName = parts[0].trim();
      const exportedName = (parts[1] || parts[0]).trim();

      exports.push({
        name: exportedName,
        isDefault: exportedName === 'default',
        isReExport: true,
        originalModule: fromModule,
        originalName,
      });
    });

    dependencies.push({
      specifier: fromModule,
      resolvedPath: '',
      importedNames: names.split(',').map((n) => n.trim().split(/\s+as\s+/)[0].trim()),
      isDefault: false,
      isDynamic: false,
      isReExport: true,
    });
  }

  // Extract default exports
  const defaultExportRegex = new RegExp(EXPORT_DEFAULT_REGEX.source, 'g');
  while ((match = defaultExportRegex.exec(source)) !== null) {
    exports.push({ name: 'default', isDefault: true, isReExport: false });
  }

  // Extract named exports
  const namedExportRegex = new RegExp(EXPORT_NAMED_REGEX.source, 'g');
  while ((match = namedExportRegex.exec(source)) !== null) {
    exports.push({ name: match[1], isDefault: false, isReExport: false });
  }

  // Extract export lists: export { a, b, c }
  const exportListRegex = new RegExp(EXPORT_LIST_REGEX.source, 'g');
  while ((match = exportListRegex.exec(source)) !== null) {
    // Skip re-exports (already handled above)
    const fullMatch = source.slice(match.index, match.index + match[0].length + 30);
    if (/from\s+['"]/.test(fullMatch)) continue;

    match[1].split(',').forEach((n) => {
      const parts = n.trim().split(/\s+as\s+/);
      const name = (parts[1] || parts[0]).trim();
      if (name) {
        exports.push({ name, isDefault: name === 'default', isReExport: false });
      }
    });
  }

  // Detect potential circular dependency risk (self-referencing patterns)
  const selfRef = path.basename(filePath, path.extname(filePath));
  if (dependencies.some((d) => d.specifier.includes(selfRef))) {
    hasCircularRisk = true;
  }

  return { dependencies, exports, source, hasCircularRisk };
}
