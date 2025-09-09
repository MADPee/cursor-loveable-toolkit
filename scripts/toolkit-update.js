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
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = process.cwd();
const args = process.argv.slice(2);
const command = args[0] || 'check';
const force = args.includes('--force');
const RAW_BASE = process.env.TOOLKIT_REPO_RAW || 'https://raw.githubusercontent.com/MADPee/cursor-loveable-toolkit/main/';

function readInstalledVersion() {
  try {
    const infoPath = path.join(projectRoot, '.cursor', 'toolkit-version.json');
    if (!fs.existsSync(infoPath)) return null;
    return JSON.parse(fs.readFileSync(infoPath, 'utf8'));
  } catch {
    return null;
  }
}

function httpGet(url) {
  try {
    // curl (unix/mac)
    const out = execSync(`curl -sL ${url}`, { stdio: 'pipe' }).toString();
    return out;
  } catch {
    try {
      // powershell (windows)
      const out = execSync(`powershell -Command "(Invoke-WebRequest -UseBasicParsing -Uri '${url}').Content"`, { stdio: 'pipe' }).toString();
      return out;
    } catch {
      return null;
    }
  }
}

function getLatestVersion() {
  // 1) Försök GitHub raw package.json
  try {
    const content = httpGet(RAW_BASE + 'package.json');
    if (content) {
      const pkg = JSON.parse(content);
      return { version: pkg.version, source: 'github' };
    }
  } catch {}

  // 2) Fallback: lokal kopia (om script körs inne i toolkit repo)
  try {
    const toolkitRoot = path.resolve(__dirname, '..');
    const pkg = JSON.parse(fs.readFileSync(path.join(toolkitRoot, 'package.json'), 'utf8'));
    return { version: pkg.version, source: 'local' };
  } catch {}

  return { version: 'unknown', source: 'unknown' };
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

  const fileMap = [
    { rel: 'cursor-automation/jsx-repair-agent.js', dest: path.join(projectRoot, '.cursor', 'jsx-repair-agent.js') },
    { rel: 'cursor-automation/auto-startup.js', dest: path.join(projectRoot, '.cursor', 'auto-startup.js') },
    { rel: 'scripts/smart-jsx-validator.js', dest: path.join(projectRoot, 'scripts', 'smart-jsx-validator.js') },
    { rel: 'config-templates/cursor-config.json', dest: path.join(projectRoot, '.cursor', 'config.json') }
  ];

  for (const { rel, dest } of fileMap) {
    const localSrc = path.join(toolkitRoot, rel);
    if (fs.existsSync(localSrc)) {
      const result = copyOrUpdate(localSrc, dest);
      changes.push({ src: localSrc, dst: dest, ...result });
      continue;
    }

    // Remote fallback
    const remoteUrl = RAW_BASE + rel;
    const content = httpGet(remoteUrl);
    if (content) {
      const alreadyExists = fs.existsSync(dest);
      if (!alreadyExists || force) {
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, content);
        changes.push({ src: remoteUrl, dst: dest, copied: true, reason: alreadyExists ? 'updated (download)' : 'created (download)' });
      } else {
        changes.push({ src: remoteUrl, dst: dest, copied: false, reason: 'exists' });
      }
    } else {
      changes.push({ src: remoteUrl, dst: dest, copied: false, reason: 'download failed' });
    }
  }

  // Uppdatera version från remote om möjligt, annars lokal
  let newVersion = '0.0.0';
  try {
    const pkgRaw = httpGet(RAW_BASE + 'package.json');
    if (pkgRaw) newVersion = JSON.parse(pkgRaw).version;
  } catch {}
  if (newVersion === '0.0.0') {
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(toolkitRoot, 'package.json'), 'utf8'));
      newVersion = pkg.version || newVersion;
    } catch {}
  }

  try {
    const info = {
      name: 'cursor-loveable-toolkit',
      version: newVersion,
      repository: 'https://github.com/MADPee/cursor-loveable-toolkit',
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


