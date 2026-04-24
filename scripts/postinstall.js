#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const cleanupPath = path.join(__dirname, 'cleanup.js');

// If cleanup.js is gone, self-clean: remove this file and restore dev script
if (!fs.existsSync(cleanupPath)) {
  try {
    const pkgPath = path.join(__dirname, '..', 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    if (pkg.scripts?.dev?.includes('postinstall.js')) {
      pkg.scripts.dev = 'next dev';
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
    }
    fs.unlinkSync(__filename);
  } catch (_) {}
  process.exit(0);
}

// ── ANSI colors ─────────────────────────────────────────────────────

const c = {
  r: '\x1b[0m', // reset
  d: '\x1b[2m', // dim
  b: '\x1b[1m', // bold
  cyan: '\x1b[36m',
  mag: '\x1b[35m',
  yel: '\x1b[33m',
  grn: '\x1b[32m',
  wht: '\x1b[37m',
  blue: '\x1b[34m'
};

// ── Box drawing (ANSI-safe padding) ─────────────────────────────────

const W = 66;
const strip = (s) => s.replace(/\x1b\[[0-9;]*m/g, '');
const pad = (s, w) => s + ' '.repeat(Math.max(0, w - strip(s).length));
const row = (text = '') => `${c.d}│${c.r} ${pad(text, W - 4)} ${c.d}│${c.r}`;
const top = `${c.d}┌${'─'.repeat(W - 2)}┐${c.r}`;
const bot = `${c.d}└${'─'.repeat(W - 2)}┘${c.r}`;
const div = `${c.d}├${'─'.repeat(W - 2)}┤${c.r}`;

// ── Message ─────────────────────────────────────────────────────────

const msg = [
  '',
  top,
  row(),
  row(`${c.b}${c.mag}  🧩  Modular Dashboard Starter${c.r}`),
  row(`${c.d}     Domain modules: enabled · disabled · removed${c.r}`),
  row(),
  div,
  row(),
  row(`${c.wht}Manage optional modules:${c.r}`),
  row(),
  row(`  ${c.yel}$${c.r} ${c.b}node scripts/cleanup.js --list${c.r}              ${c.d}# see all modules${c.r}`),
  row(`  ${c.yel}$${c.r} ${c.b}node scripts/cleanup.js --interactive${c.r}        ${c.d}# guided setup${c.r}`),
  row(`  ${c.yel}$${c.r} ${c.b}node scripts/cleanup.js --disable kanban${c.r}     ${c.d}# hide from nav${c.r}`),
  row(`  ${c.yel}$${c.r} ${c.b}node scripts/cleanup.js kanban${c.r}               ${c.d}# remove code${c.r}`),
  row(),
  row(`${c.d}Module states:${c.r}`),
  row(
    `  ${c.grn}enabled${c.d}   visible in nav, code active${c.r}`
  ),
  row(
    `  ${c.yel}disabled${c.d}  hidden from nav, files preserved${c.r}`
  ),
  row(
    `  ${c.d}removed   permanently deleted from codebase${c.r}`
  ),
  row(),
  div,
  row(),
  row(`${c.grn}--dry-run${c.r}  ${c.d}Preview changes without modifying files${c.r}`),
  row(`${c.grn}--list${c.r}     ${c.d}Show all modules + states${c.r}`),
  row(`${c.grn}--help${c.r}     ${c.d}See all options${c.r}`),
  row(),
  row(`${c.d}Delete ${c.wht}scripts/cleanup.js${c.d} to remove this message.${c.r}`),
  row(),
  bot,
  ''
];

console.log(msg.join('\n'));
