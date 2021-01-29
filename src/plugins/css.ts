import { readFileSync } from 'fs';
import type { Plugin } from '../types';

interface CSSPluginOptions {
  extract?: boolean;
  minify?: boolean;
}

const collectedCSS: Map<string, string> = new Map();

export function cssPlugin(opts: CSSPluginOptions = {}): Plugin {
  return {
    name: 'css',
    extensions: ['.css'],

    load(id: string): string | null {
      if (!id.endsWith('.css')) return null;
      const content = readFileSync(id, 'utf-8');
      const processed = opts.minify ? minifyCSS(content) : content;

      if (opts.extract) {
        collectedCSS.set(id, processed);
        return 'export default ' + JSON.stringify(id) + ';';
      }

      return 'const style = ' + JSON.stringify(processed) + ';\n'
        + 'if (typeof document !== "undefined") {\n'
        + '  const el = document.createElement("style");\n'
        + '  el.textContent = style;\n'
        + '  document.head.appendChild(el);\n'
        + '}\n'
        + 'export default style;';
    },

    buildEnd() {
      if (opts.extract && collectedCSS.size > 0) {
        const combined = Array.from(collectedCSS.values()).join('\n');
        return { type: 'asset', fileName: 'styles.css', source: combined };
      }
      return null;
    },
  };
}

function minifyCSS(css: string): string {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,])\s*/g, '$1')
    .trim();
}
