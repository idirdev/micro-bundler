import { describe, it, expect } from 'vitest';
import { parseImports, parseExports } from '../src/parser';

describe('parser', () => {
  describe('parseImports', () => {
    it('detects named imports', () => {
      const result = parseImports("import { foo, bar } from './utils';");
      expect(result).toHaveLength(1);
      expect(result[0].source).toBe('./utils');
      expect(result[0].specifiers).toContain('foo');
    });
    it('detects default imports', () => {
      const result = parseImports("import React from 'react';");
      expect(result[0].default).toBe('React');
    });
    it('detects namespace imports', () => {
      const result = parseImports("import * as utils from './utils';");
      expect(result[0].namespace).toBe('utils');
    });
    it('detects side-effect imports', () => {
      const result = parseImports("import './polyfill';");
      expect(result[0].source).toBe('./polyfill');
      expect(result[0].sideEffect).toBe(true);
    });
    it('handles multiple imports', () => {
      const code = "import { a } from './a';\nimport { b } from './b';";
      expect(parseImports(code)).toHaveLength(2);
    });
  });
  describe('parseExports', () => {
    it('detects named exports', () => {
      const result = parseExports('export const foo = 42;');
      expect(result).toContain('foo');
    });
    it('detects default export', () => {
      const result = parseExports('export default function main() {}');
      expect(result).toContain('default');
    });
    it('detects re-exports', () => {
      const result = parseExports("export { foo } from './utils';");
      expect(result).toContain('foo');
    });
  });
});
