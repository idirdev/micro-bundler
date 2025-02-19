import { describe, it, expect } from 'vitest';
import { minify } from '../src/minifier';

describe('minifier', () => {
  it('removes whitespace', () => {
    const code = 'const  x  =  1 ;';
    const result = minify(code);
    expect(result.length).toBeLessThan(code.length);
  });
  it('removes comments', () => {
    const code = '// comment\nconst x = 1; /* block */';
    const result = minify(code);
    expect(result).not.toContain('comment');
    expect(result).not.toContain('block');
  });
  it('preserves string literals', () => {
    const code = 'const s = "hello  world";';
    const result = minify(code);
    expect(result).toContain('hello world');
  });
  it('shortens variable names when mangling', () => {
    const code = 'const longVariableName = 42; console.log(longVariableName);';
    const result = minify(code, { mangle: true });
    expect(result.length).toBeLessThan(code.length);
  });
  it('handles empty input', () => {
    expect(minify('')).toBe('');
  });
});
