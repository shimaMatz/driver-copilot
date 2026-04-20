#!/usr/bin/env node
/**
 * README 用スクリーンショットを生成する。
 * Expo Web へ export → 静的配信 → Playwright でキャプチャ（iPhone 系に近いビューポート）。
 *
 * 前提: `cd expo && npm install` 済み。初回のみ `npx playwright install chromium`（リポジトリルート）。
 */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const expoDir = path.join(root, 'expo');
const outDir = path.join(root, 'docs', 'readme');
const webBuildDir = path.join(outDir, '.web-build');
const port = 19876;

function run(cmd, args, cwd) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { cwd, stdio: 'inherit', shell: false });
    p.on('close', code => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
    p.on('error', reject);
  });
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  fs.rmSync(webBuildDir, { recursive: true, force: true });

  await run('npx', ['expo', 'export', '--platform', 'web', '--output-dir', webBuildDir], expoDir);

  const server = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], {
    cwd: webBuildDir,
    stdio: 'ignore',
  });

  let browser;
  try {
    await delay(800);

    browser = await chromium.launch();
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
    });

    const url = `http://127.0.0.1:${port}/`;
    await page.goto(url, { waitUntil: 'load', timeout: 60_000 });
    await delay(2000);

    const shot1 = path.join(outDir, 'screenshot-app-main.png');
    await page.screenshot({ path: shot1, type: 'png' });

    console.log('Wrote', shot1);
  } finally {
    if (browser) await browser.close();
    server.kill('SIGTERM');
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
