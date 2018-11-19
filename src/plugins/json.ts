import { readFileSync } from 'fs';
import type { Plugin } from '../types';

export function jsonPlugin(): Plugin {
  return {
    name: 'json',
    extensions: ['.json'],

    load(id: string): string | null {
      if (!id.endsWith('.json')) return null;
      try {
        const content = readFileSync(id, 'utf-8');
        const parsed = JSON.parse(content);
        return 'export default ' + JSON.stringify(parsed, null, 2) + ';';
      } catch (err) {
        throw new Error('Failed to parse JSON: ' + id);
      }
    },

    transform(code: string, id: string): string | null {
      if (!id.endsWith('.json')) return null;
      return code;
    },
  };
}
