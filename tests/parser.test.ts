import { describe, it, expect } from 'vitest';
import { parseSource } from '../src/parser';

describe('parser', () => {
  describe('parseSource - dependencies', () => {
    it('detects named imports', () => {
      const result = parseSource("import { foo, bar } from './utils';", '/project/src/index.js');
      expect(result.dependencies).toHaveLength(1);
      expect(result.dependencies[0].specifier).toBe('./utils');
      expect(result.dependencies[0].importedNames).toContain('foo');
    });
    it('detects default imports', () => {
      const result = parseSource("import React from 'react';", '/project/src/index.js');
      expect(result.dependencies[0].isDefault).toBe(true);
      expect(result.dependencies[0].importedNames).toContain('default');
    });
    it('detects dynamic imports', () => {
      const result = parseSource("import('./utils');", '/project/src/index.js');
      expect(result.dependencies[0].isDynamic).toBe(true);
      expect(result.dependencies[0].specifier).toBe('./utils');
    });
    it('detects CommonJS requires', () => {
      const result = parseSource("const utils = require('./utils');", '/project/src/index.js');
      expect(result.dependencies).toHaveLength(1);
      expect(result.dependencies[0].specifier).toBe('./utils');
    });
    it('handles multiple imports', () => {
      const code = "import { a } from './a';\nimport { b } from './b';";
      const result = parseSource(code, '/project/src/index.js');
      expect(result.dependencies).toHaveLength(2);
    });
  });
  describe('parseSource - exports', () => {
    it('detects named exports', () => {
      const result = parseSource('export const foo = 42;', '/project/src/index.js');
      const names = result.exports.map((e) => e.name);
      expect(names).toContain('foo');
    });
    it('detects default export', () => {
      const result = parseSource('export default function main() {}', '/project/src/index.js');
      const names = result.exports.map((e) => e.name);
      expect(names).toContain('default');
    });
    it('detects re-exports', () => {
      const result = parseSource("export { foo } from './utils';", '/project/src/index.js');
      const names = result.exports.map((e) => e.name);
      expect(names).toContain('foo');
    });
  });
});
