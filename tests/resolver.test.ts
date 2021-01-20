import { describe, it, expect } from 'vitest';
import { resolve } from '../src/resolver';

describe('resolver', () => {
  it('resolves relative paths', () => {
    const result = resolve('./utils', '/project/src/index.js');
    expect(result).toContain('utils');
  });
  it('adds .js extension when missing', () => {
    const result = resolve('./math', '/project/src/index.js');
    expect(result).toMatch(/math\.(js|ts|mjs)$/);
  });
  it('resolves index files', () => {
    const result = resolve('./lib', '/project/src/index.js');
    expect(result).toContain('lib');
  });
  it('resolves node_modules', () => {
    const result = resolve('lodash', '/project/src/index.js');
    expect(result).toContain('node_modules');
  });
  it('throws for missing modules', () => {
    expect(() => resolve('nonexistent-pkg-xyz', '/project/src/index.js'))
      .toThrow();
  });
});
