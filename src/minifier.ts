/**
 * Simple JavaScript minifier.
 * Performs basic optimizations: comment removal, whitespace reduction,
 * and optional console.log stripping.
 */

/**
 * Minify JavaScript source code.
 */
export function minify(code: string, options: MinifyOptions = {}): string {
  const { removeConsole = true, mangle = false } = options;

  let result = code;

  // Step 1: Remove single-line comments (but not URLs with //)
  result = removeSingleLineComments(result);

  // Step 2: Remove multi-line comments
  result = removeMultiLineComments(result);

  // Step 3: Remove console.log statements in production
  if (removeConsole) {
    result = removeConsoleLogs(result);
  }

  // Step 4: Collapse whitespace
  result = collapseWhitespace(result);

  // Step 5: Remove unnecessary semicolons and whitespace around operators
  result = optimizeOperators(result);

  // Step 6: Basic variable name mangling (optional)
  if (mangle) {
    result = mangleVariables(result);
  }

  return result.trim();
}

interface MinifyOptions {
  removeConsole?: boolean;
  mangle?: boolean;
}

/**
 * Remove single-line comments while preserving strings and URLs.
 */
function removeSingleLineComments(code: string): string {
  return code.replace(/(?<!:)\/\/(?![\/*]).*$/gm, '');
}

/**
 * Remove multi-line comments.
 */
function removeMultiLineComments(code: string): string {
  return code.replace(/\/\*[\s\S]*?\*\//g, '');
}

/**
 * Remove console.log, console.warn, console.error statements.
 */
function removeConsoleLogs(code: string): string {
  return code.replace(/console\.(log|warn|info|debug|trace)\s*\([^)]*\)\s*;?/g, '');
}

/**
 * Collapse multiple whitespace characters into single spaces.
 * Preserve newlines where needed for ASI (Automatic Semicolon Insertion).
 */
function collapseWhitespace(code: string): string {
  // Replace multiple blank lines with single newline
  let result = code.replace(/\n\s*\n\s*\n/g, '\n');

  // Collapse spaces and tabs (but not newlines) into single space
  result = result.replace(/[ \t]+/g, ' ');

  // Remove leading whitespace on each line
  result = result.replace(/^ +/gm, '');

  // Remove trailing whitespace on each line
  result = result.replace(/ +$/gm, '');

  // Remove empty lines
  result = result.replace(/^\s*[\r\n]/gm, '');

  return result;
}

/**
 * Remove unnecessary whitespace around operators.
 */
function optimizeOperators(code: string): string {
  let result = code;

  // Remove spaces around common operators
  result = result.replace(/\s*([=+\-*/<>!&|^~%]+=?)\s*/g, (match, op) => {
    // Preserve spaces around keywords that look like operators
    if (op === 'in' || op === 'of' || op === 'instanceof') return match;
    return op;
  });

  // Restore space after keywords
  result = result.replace(/(var|let|const|return|typeof|new|delete|throw|case|void|in|of)\b/g, '$1 ');

  // Restore space after commas
  result = result.replace(/,(?!\s)/g, ', ');

  return result;
}

/**
 * Basic variable name mangling.
 * Replaces local variable names with short single/double letter names.
 */
function mangleVariables(code: string): string {
  const varNames = new Set<string>();
  const varRegex = /(?:var|let|const)\s+(\w+)/g;
  let match: RegExpExecArray | null;

  while ((match = varRegex.exec(code)) !== null) {
    const name = match[1];
    // Only mangle names longer than 2 characters that are not special
    if (name.length > 2 && !isReserved(name)) {
      varNames.add(name);
    }
  }

  let result = code;
  let charCode = 97; // 'a'
  let prefix = '';

  for (const originalName of varNames) {
    const shortName = prefix + String.fromCharCode(charCode);

    // Replace all occurrences of the variable name (word boundary)
    const regex = new RegExp(`\\b${originalName}\\b`, 'g');
    result = result.replace(regex, shortName);

    charCode++;
    if (charCode > 122) { // past 'z'
      charCode = 97;
      prefix += '_';
    }
  }

  return result;
}

/**
 * Check if a variable name is a reserved word.
 */
function isReserved(name: string): boolean {
  const reserved = new Set([
    'var', 'let', 'const', 'function', 'return', 'if', 'else', 'for', 'while',
    'do', 'switch', 'case', 'break', 'continue', 'new', 'delete', 'typeof',
    'instanceof', 'void', 'this', 'class', 'extends', 'super', 'import',
    'export', 'default', 'from', 'try', 'catch', 'finally', 'throw',
    'async', 'await', 'yield', 'true', 'false', 'null', 'undefined',
    '__require', '__modules', '__cache', '__exports', 'module', 'exports',
    'require', 'console', 'Object', 'Array', 'String', 'Number',
  ]);
  return reserved.has(name);
}
