import * as fs from 'fs';
import * as path from 'path';

/**
 * Watch a list of files for changes and trigger a rebuild callback.
 * Uses debouncing to avoid multiple rapid rebuilds.
 */
export function watchFiles(
  files: string[],
  onRebuild: () => void,
  debounceMs: number = 200
): void {
  let debounceTimer: NodeJS.Timeout | null = null;
  const watchers: fs.FSWatcher[] = [];

  console.log(`[micro-bundler] Watching ${files.length} files for changes...`);

  const triggerRebuild = (changedFile: string) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
      const timestamp = new Date().toLocaleTimeString();
      console.log(`[micro-bundler] [${timestamp}] File changed: ${path.basename(changedFile)}`);

      try {
        onRebuild();
      } catch (err: any) {
        console.error(`[micro-bundler] Rebuild failed: ${err.message}`);
      }
    }, debounceMs);
  };

  for (const file of files) {
    try {
      const watcher = fs.watch(file, (eventType) => {
        if (eventType === 'change') {
          triggerRebuild(file);
        }
      });

      watcher.on('error', (err) => {
        console.warn(`[micro-bundler] Watcher error for ${file}: ${err.message}`);
      });

      watchers.push(watcher);
    } catch (err: any) {
      console.warn(`[micro-bundler] Could not watch ${file}: ${err.message}`);
    }
  }

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n[micro-bundler] Stopping file watcher...');
    watchers.forEach((w) => w.close());
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    watchers.forEach((w) => w.close());
    process.exit(0);
  });
}
