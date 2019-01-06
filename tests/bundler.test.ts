import { describe, it, expect } from 'vitest';
import { Bundler } from '../src/bundler';

describe('Bundler', () => {
  it('creates bundle instance', () => {
    const b = new Bundler({ entry: './src/index.js' });
    expect(b).toBeDefined();
  });
  it('resolves entry point', () => {
    const b = new Bundler({ entry: './examples/src/index.js' });
    expect(b.entryPoint).toContain('index');
  });
  it('accepts plugins', () => {
    const b = new Bundler({
      entry: './src/index.js',
      plugins: [{ name: 'test', load: () => null }],
    });
    expect(b.plugins).toHaveLength(1);
  });
  it('accepts output options', () => {
    const b = new Bundler({
      entry: './src/index.js',
      output: { file: 'dist/bundle.js', format: 'esm' },
    });
    expect(b.outputOptions.format).toBe('esm');
  });
});
