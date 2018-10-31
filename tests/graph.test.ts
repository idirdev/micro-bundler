import { describe, it, expect } from 'vitest';
import { DependencyGraph } from '../src/graph';

describe('DependencyGraph', () => {
  it('adds modules', () => {
    const g = new DependencyGraph();
    g.addModule('/a.js', ['/b.js']);
    g.addModule('/b.js', []);
    expect(g.size).toBe(2);
  });
  it('returns dependencies', () => {
    const g = new DependencyGraph();
    g.addModule('/a.js', ['/b.js', '/c.js']);
    expect(g.getDependencies('/a.js')).toEqual(['/b.js', '/c.js']);
  });
  it('detects cycles', () => {
    const g = new DependencyGraph();
    g.addModule('/a.js', ['/b.js']);
    g.addModule('/b.js', ['/a.js']);
    expect(g.hasCycle()).toBe(true);
  });
  it('returns topological order', () => {
    const g = new DependencyGraph();
    g.addModule('/a.js', ['/b.js']);
    g.addModule('/b.js', ['/c.js']);
    g.addModule('/c.js', []);
    const order = g.topologicalSort();
    expect(order.indexOf('/c.js')).toBeLessThan(order.indexOf('/b.js'));
  });
  it('finds entry points', () => {
    const g = new DependencyGraph();
    g.addModule('/entry.js', ['/lib.js']);
    g.addModule('/lib.js', []);
    expect(g.getEntryPoints()).toContain('/entry.js');
  });
});
