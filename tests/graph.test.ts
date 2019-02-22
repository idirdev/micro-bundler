import { describe, it, expect } from 'vitest';
import { buildGraph } from '../src/graph';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

function createTempFiles(files: Record<string, string>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'graph-test-'));
  for (const [name, content] of Object.entries(files)) {
    const filePath = path.join(dir, name);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf-8');
  }
  return dir;
}

describe('buildGraph', () => {
  it('builds a graph from an entry file', () => {
    const dir = createTempFiles({
      'index.js': 'export const x = 1;',
    });
    const graph = buildGraph(path.join(dir, 'index.js'));
    expect(graph.modules).toHaveLength(1);
    expect(graph.entryModule.filePath).toBe(path.join(dir, 'index.js'));
  });

  it('discovers dependencies', () => {
    const dir = createTempFiles({
      'index.js': "import { foo } from './lib.js';\nexport const x = foo;",
      'lib.js': 'export const foo = 42;',
    });
    const graph = buildGraph(path.join(dir, 'index.js'));
    expect(graph.modules).toHaveLength(2);
    const neighbors = graph.adjacencyList.get(path.join(dir, 'index.js'));
    expect(neighbors).toContain(path.join(dir, 'lib.js'));
  });

  it('returns sorted modules in dependency-first order', () => {
    const dir = createTempFiles({
      'index.js': "import { bar } from './a.js';\nexport const x = bar;",
      'a.js': "import { baz } from './b.js';\nexport const bar = baz;",
      'b.js': 'export const baz = 1;',
    });
    const graph = buildGraph(path.join(dir, 'index.js'));
    const sortedPaths = graph.sortedModules.map((m) => path.basename(m.filePath));
    expect(sortedPaths.indexOf('b.js')).toBeLessThan(sortedPaths.indexOf('a.js'));
  });

  it('detects circular dependencies', () => {
    const dir = createTempFiles({
      'a.js': "import { b } from './b.js';\nexport const a = 1;",
      'b.js': "import { a } from './a.js';\nexport const b = 2;",
    });
    const graph = buildGraph(path.join(dir, 'a.js'));
    expect(graph.circularDeps.length).toBeGreaterThan(0);
  });

  it('marks entry module', () => {
    const dir = createTempFiles({
      'main.js': 'export default 42;',
    });
    const graph = buildGraph(path.join(dir, 'main.js'));
    expect(graph.entryModule.isEntry).toBe(true);
  });
});
