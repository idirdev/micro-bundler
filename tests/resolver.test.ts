import { describe, it, expect } from 'vitest';
import { resolveModule } from '../src/resolver';

describe('resolver', () => {
  it('resolves relative paths', () => {
    const result = resolveModule('./utils', '/project/src/index.js');
    expect(result).toContain('utils');
  });
  it('adds .js extension when missing', () => {
    const result = resolveModule('./math', '/project/src/index.js');
    expect(result).toMatch(/math\.(js|ts|mjs)$/);
  });
  it('resolves index files', () => {
    const result = resolveModule('./lib', '/project/src/index.js');
    expect(result).toContain('lib');
  });
  it('resolves node_modules', () => {
    const result = resolveModule('lodash', '/project/src/index.js');
    expect(result).toContain('node_modules');
  });
  it('throws for missing modules', () => {
    expect(() => resolveModule('nonexistent-pkg-xyz', '/project/src/index.js'))
      .toThrow();
  });
});
