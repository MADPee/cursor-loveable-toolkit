#!/usr/bin/env node

/**
 * Toolkit Update Helper
 *
 * check: jämför installerad version i .cursor/toolkit-version.json
 *        med senaste på GitHub (remote HEAD tag) och rapportera.
 * apply: kopierar uppdaterade filer från toolkit-root in i projektet
 *        (skriver inte över om filen redan är moddad, om inte --force)
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const projectRoot = process.cwd();
const args = process.argv.slice(2);
const command = args[0] || 'check';
const force = args.includes('--force');

function readInstalledVersion() {
  try {
    const infoPath = path.join(projectRoot, '.cursor', 'toolkit-version.json');
    if (!fs.existsSync(infoPath)) return null;
    return JSON.parse(fs.readFileSync(infoPath, 'utf8'));
  } catch {
    return null;
  }
}

function getLatestVersion() {
  try {
    // Pröva att läsa version från toolkitens package.json (lokal kopia)
    const toolkitRoot = path.resolve(__dirname, '..');
    const pkg = JSON.parse(fs.readFileSync(path.join(toolkitRoot, 'package.json'), 'utf8'));
    return { version: pkg.version, source: 'local' };
  } catch {
    return { version: 'unknown', source: 'unknown' };
  }
}

function copyFileIfMissing(source, dest) {
  if (!fs.existsSync(source)) return false;
  if (fs.existsSync(dest)) return false;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(source, dest);
  return true;
}

function copyOrUpdate(source, dest) {
  if (!fs.existsSync(source)) return { copied: false, reason: 'missing source' };
  const alreadyExists = fs.existsSync(dest);
  if (alreadyExists && !force) return { copied: false, reason: 'exists' };
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(source, dest);
  return { copied: true, reason: alreadyExists ? 'updated' : 'created' };
}

function applyUpdate() {
  const toolkitRoot = path.resolve(__dirname, '..');
  const changes = [];

  const mappings = [
    // automation
    [path.join(toolkitRoot, 'cursor-automation', 'jsx-repair-agent.js'), path.join(projectRoot, '.cursor', 'jsx-repair-agent.js')],
    [path.join(toolkitRoot, 'cursor-automation', 'auto-startup.js'), path.join(projectRoot, '.cursor', 'auto-startup.js')],
    // scripts
    [path.join(toolkitRoot, 'scripts', 'smart-jsx-validator.js'), path.join(projectRoot, 'scripts', 'smart-jsx-validator.js')],
    [path.join(toolkitRoot, 'config-templates', 'cursor-config.json'), path.join(projectRoot, '.cursor', 'config.json')]
  ];

  for (const [src, dst] of mappings) {
    const result = copyOrUpdate(src, dst);
    changes.push({ src, dst, ...result });
  }

  // Uppdatera version
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(toolkitRoot, 'package.json'), 'utf8'));
    const info = {
      name: pkg.name || 'cursor-loveable-toolkit',
      version: pkg.version || '0.0.0',
      repository: (pkg.repository && pkg.repository.url) || '',
      updatedAt: new Date().toISOString()
    };
    fs.writeFileSync(path.join(projectRoot, '.cursor', 'toolkit-version.json'), JSON.stringify(info, null, 2));
  } catch {}

  console.log('📦 Toolkit update summary:');
  for (const c of changes) {
    console.log(`- ${path.relative(projectRoot, c.dst)}: ${c.copied ? c.reason : 'skipped (' + c.reason + ')'}`);
  }
}

function main() {
  if (command === 'check') {
    const installed = readInstalledVersion();
    const latest = getLatestVersion();
    console.log('🔍 Toolkit version check');
    console.log('   Installed:', installed?.version || 'unknown');
    console.log('   Latest:   ', latest.version, `(source: ${latest.source})`);
    if (installed && latest.version !== 'unknown' && installed.version !== latest.version) {
      console.log('⬆️  Update available. Run: npm run toolkit:update');
      process.exitCode = 1;
    } else {
      console.log('✅ Up to date');
    }
  } else if (command === 'apply') {
    applyUpdate();
  } else {
    console.log('Usage:');
    console.log('  node scripts/toolkit-update.js check');
    console.log('  node scripts/toolkit-update.js apply [--force]');
  }
}

main();


