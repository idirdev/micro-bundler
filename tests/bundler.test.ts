import { describe, it, expect } from 'vitest';
import { bundle } from '../src/bundler';
import { buildGraph } from '../src/graph';
import { BundlerConfig } from '../src/types';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

function createTempFiles(files: Record<string, string>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bundler-test-'));
  for (const [name, content] of Object.entries(files)) {
    const filePath = path.join(dir, name);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf-8');
  }
  return dir;
}

describe('bundle', () => {
  it('generates CJS bundle', () => {
    const dir = createTempFiles({
      'index.js': 'export const x = 1;',
    });
    const graph = buildGraph(path.join(dir, 'index.js'));
    const config: BundlerConfig = {
      entry: path.join(dir, 'index.js'),
      output: path.join(dir, 'out.js'),
      format: 'cjs',
      minify: false,
      sourcemap: false,
    };
    const result = bundle(graph, config);
    expect(result).toContain('use strict');
    expect(result).toContain('__require');
    expect(result).toContain('__modules');
  });

  it('generates ESM bundle', () => {
    const dir = createTempFiles({
      'index.js': 'export const x = 1;',
    });
    const graph = buildGraph(path.join(dir, 'index.js'));
    const config: BundlerConfig = {
      entry: path.join(dir, 'index.js'),
      output: path.join(dir, 'out.js'),
      format: 'esm',
      minify: false,
      sourcemap: false,
    };
    const result = bundle(graph, config);
    expect(result).toContain('export default');
  });

  it('generates IIFE bundle with global name', () => {
    const dir = createTempFiles({
      'index.js': 'export const x = 1;',
    });
    const graph = buildGraph(path.join(dir, 'index.js'));
    const config: BundlerConfig = {
      entry: path.join(dir, 'index.js'),
      output: path.join(dir, 'out.js'),
      format: 'iife',
      minify: false,
      sourcemap: false,
      globalName: 'MyLib',
    };
    const result = bundle(graph, config);
    expect(result).toContain('var MyLib');
    expect(result).toContain('(function()');
  });

  it('bundles multiple modules', () => {
    const dir = createTempFiles({
      'index.js': "import { foo } from './lib.js';\nexport const x = foo;",
      'lib.js': 'export const foo = 42;',
    });
    const graph = buildGraph(path.join(dir, 'index.js'));
    const config: BundlerConfig = {
      entry: path.join(dir, 'index.js'),
      output: path.join(dir, 'out.js'),
      format: 'cjs',
      minify: false,
      sourcemap: false,
    };
    const result = bundle(graph, config);
    expect(result).toContain('__modules[0]');
    expect(result).toContain('__modules[1]');
  });
});
