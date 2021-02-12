import { describe, it, expect } from 'vitest';
import { SourceMapGenerator } from '../src/sourcemap';

describe('SourceMapGenerator', () => {
  it('creates valid source map', () => {
    const gen = new SourceMapGenerator('bundle.js');
    gen.addSource('src/index.js');
    gen.addMapping({
      generatedLine: 0, generatedColumn: 0,
      originalLine: 0, originalColumn: 0,
      source: 'src/index.js',
    });
    const map = gen.toJSON() as any;
    expect(map.version).toBe(3);
    expect(map.sources).toContain('src/index.js');
  });
  it('generates inline comment', () => {
    const gen = new SourceMapGenerator('bundle.js');
    const comment = gen.toComment();
    expect(comment).toContain('sourceMappingURL=data:application/json;base64,');
  });
  it('tracks multiple sources', () => {
    const gen = new SourceMapGenerator('bundle.js');
    gen.addSource('a.js');
    gen.addSource('b.js');
    const map = gen.toJSON() as any;
    expect(map.sources).toHaveLength(2);
  });
});
