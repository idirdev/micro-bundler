import type { Plugin } from '../types';

interface EnvPluginOptions {
  prefix?: string;
  define?: Record<string, string>;
}

export function envPlugin(opts: EnvPluginOptions = {}): Plugin {
  const prefix = opts.prefix ?? 'process.env.';
  const defines: Record<string, string> = { ...opts.define };

  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined) {
      defines[prefix + key] = JSON.stringify(value);
    }
  }

  return {
    name: 'env',

    transform(code: string, id: string): string | null {
      let result = code;
      let changed = false;

      for (const [key, replacement] of Object.entries(defines)) {
        if (result.includes(key)) {
          result = result.split(key).join(replacement);
          changed = true;
        }
      }

      return changed ? result : null;
    },
  };
}
