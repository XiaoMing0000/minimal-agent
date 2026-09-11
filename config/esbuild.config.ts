import { rm } from 'fs/promises';
import { spawn, type ChildProcess } from 'node:child_process';
import * as esbuild from 'esbuild';

await rm('./dist', { recursive: true, force: true });

// 运行产物路径
const runIndex = './dist/index.js';

// 构建入口
let commonOptions: esbuild.BuildOptions = {
  entryPoints: { index: 'src/entry/index.ts' },
  outdir: './dist/',
  entryNames: '[name]',
  assetNames: '[name]',
  bundle: true,
  platform: 'node',
  format: 'esm',
  sourcemap: false,
  minify: true,
  external: ['dotenv'],
};

/** 构建成功后运行产物；再次构建时先杀掉旧进程 */
function createRestartOnRebuildPlugin(entries: string[]): esbuild.Plugin {
  let child: ChildProcess | undefined;

  const stop = () => {
    child?.kill();
    child = undefined;
  };

  // node --watch 重启配置进程时，顺带清掉业务子进程
  process.once('SIGTERM', stop);
  process.once('SIGINT', stop);
  process.once('exit', stop);

  return {
    name: 'run-after-build',
    setup(build) {
      build.onEnd((result) => {
        if (result.errors.length) return;
        stop();
        child = spawn(process.execPath, entries, { stdio: 'inherit', env: process.env });
      });
    },
  };
}

if (process.argv.includes('--dev')) {
  commonOptions = {
    ...commonOptions,
    sourcemap: true,
    minify: false,
    // ESM 下没有全局 require；依赖（如 ws）被打进包后会走 esbuild 的 __require shim，
    // 需注入 createRequire，否则运行时报 Dynamic require of "net" is not supported
    banner: {
      js: `import { createRequire } from 'module';const require = createRequire(import.meta.url);`,
    },
    plugins: [createRestartOnRebuildPlugin([runIndex])],
  };
  const ctx = await esbuild.context(commonOptions);
  await ctx.watch({ delay: 500 });
  console.log('Watching for changes...');
} else {
  await esbuild.build(commonOptions);
}
