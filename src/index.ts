#!/usr/bin/env node

import { Command } from 'commander';
import { BundlerConfig } from './types';
import { buildGraph } from './graph';
import { bundle } from './bundler';
import { minify } from './minifier';
import { watchFiles } from './watcher';
import * as fs from 'fs';
import * as path from 'path';

// Library re-exports
export { parseSource } from './parser';
export { resolveModule } from './resolver';
export { buildGraph } from './graph';
export { bundle } from './bundler';
export { minify } from './minifier';
export { transformModule } from './transformer';
export { SourceMapGenerator } from './sourcemap';
export { watchFiles } from './watcher';

const program = new Command();

program
  .name('micro-bundler')
  .description('A JavaScript module bundler built from scratch')
  .version('1.0.0');

program
  .command('bundle')
  .description('Bundle JavaScript modules into a single file')
  .requiredOption('-e, --entry <path>', 'Entry point file path')
  .requiredOption('-o, --output <path>', 'Output bundle file path')
  .option('-f, --format <format>', 'Output format: esm, cjs, or iife', 'cjs')
  .option('-m, --minify', 'Minify the output bundle', false)
  .option('-s, --sourcemap', 'Generate source map', false)
  .option('-w, --watch', 'Watch files for changes and rebuild', false)
  .option('-g, --global-name <name>', 'Global variable name for IIFE format', 'Bundle')
  .action((options) => {
    const config: BundlerConfig = {
      entry: path.resolve(options.entry),
      output: path.resolve(options.output),
      format: options.format as 'esm' | 'cjs' | 'iife',
      minify: options.minify,
      sourcemap: options.sourcemap,
      globalName: options.globalName,
    };

    console.log(`[micro-bundler] Bundling ${config.entry}...`);

    const runBuild = () => {
      const graph = buildGraph(config.entry);
      let code = bundle(graph, config);

      if (config.minify) {
        code = minify(code);
      }

      const outputDir = path.dirname(config.output);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      fs.writeFileSync(config.output, code, 'utf-8');
      console.log(`[micro-bundler] Bundle written to ${config.output} (${code.length} bytes)`);
    };

    runBuild();

    if (options.watch) {
      const graph = buildGraph(config.entry);
      const files = graph.modules.map((m) => m.filePath);
      watchFiles(files, () => {
        console.log('[micro-bundler] Rebuilding...');
        runBuild();
      });
    }
  });

program.parse(process.argv);
