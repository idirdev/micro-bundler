import { describe, it, expect } from 'vitest';
import { resolveModule } from '../src/resolver';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

function createTempDir(files: Record<string, string>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'resolver-test-'));
  for (const [name, content] of Object.entries(files)) {
    const filePath = path.join(dir, name);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf-8');
  }
  return dir;
}

describe('resolver', () => {
  it('resolves relative paths', () => {
    const dir = createTempDir({
      'src/index.js': 'import "./utils.js"',
      'src/utils.js': 'export const x = 1;',
    });
    const result = resolveModule('./utils', path.join(dir, 'src/index.js'));
    expect(result).toContain('utils');
  });

  it('adds .js extension when missing', () => {
    const dir = createTempDir({
      'src/index.js': 'import "./math.js"',
      'src/math.js': 'export const add = (a, b) => a + b;',
    });
    const result = resolveModule('./math', path.join(dir, 'src/index.js'));
    expect(result).toMatch(/math\.(js|ts|mjs)$/);
  });

  it('resolves index files', () => {
    const dir = createTempDir({
      'src/index.js': 'import "./lib/index.js"',
      'src/lib/index.js': 'export const lib = true;',
    });
    const result = resolveModule('./lib', path.join(dir, 'src/index.js'));
    expect(result).toContain('lib');
  });

  it('resolves node_modules', () => {
    const dir = createTempDir({
      'src/index.js': 'import "my-pkg"',
      'node_modules/my-pkg/index.js': 'module.exports = {};',
    });
    const result = resolveModule('my-pkg', path.join(dir, 'src/index.js'));
    expect(result).toContain('node_modules');
  });

  it('throws for missing modules', () => {
    const dir = createTempDir({
      'src/index.js': '',
    });
    expect(() => resolveModule('nonexistent-pkg-xyz', path.join(dir, 'src/index.js')))
      .toThrow();
  });
});
