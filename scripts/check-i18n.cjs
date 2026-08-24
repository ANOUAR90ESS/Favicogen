/**
 * Three checks, all of which have caught a real bug that reached the screen:
 *
 *  1. A `t('key')` call with no entry in the locale files. Forty-eight keys
 *     once referenced namespaces that no longer existed (`navbar.` vs
 *     `nav.`), so the UI rendered raw key strings in both languages.
 *  2. The two locales drifting apart.
 *  3. A key written as a bare string with the `t()` left off — the whole AI
 *     generator dialog shipped this way, printing `aiGeneratorModal.…` at the
 *     user. Check 1 could never see it: it only ever looked inside `t()`.
 *
 * Keys legitimately held as data (`nameKey: '…'`, a `…KEYS` list) are
 * resolved at render, so they are exempt — see `KEY_CARRIER` below.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

function loadLocale(lang) {
  const src = fs
    .readFileSync(`src/i18n/locales/${lang}.ts`, 'utf8')
    .replace(/^export const \w+ =/, 'module.exports =');
  const tmp = path.join(os.tmpdir(), `locale-${lang}-${Date.now()}.cjs`);
  fs.writeFileSync(tmp, src);
  const mod = require(tmp);
  fs.unlinkSync(tmp);
  return mod;
}

function flatten(obj, prefix = '', out = new Set()) {
  for (const [key, value] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object') flatten(value, full, out);
    else out.add(full);
  }
  return out;
}

const en = flatten(loadLocale('en'));
const ar = flatten(loadLocale('ar'));

const source = execSync(`grep -rhoE "t\\('[a-zA-Z0-9_.]+'" src/ || true`, { encoding: 'utf8' });
const used = new Set(
  [...source.matchAll(/t\('([a-zA-Z0-9_.]+)'/g)].map((m) => m[1]).filter((k) => k.includes('.'))
);

const undefinedKeys = [...used].filter((k) => !en.has(k)).sort();
const missingFromAr = [...en].filter((k) => !ar.has(k)).sort();
const missingFromEn = [...ar].filter((k) => !en.has(k)).sort();

/**
 * A line that stores a key rather than displaying one. Two shapes are in use:
 * a property whose name ends in `Key` (`nameKey`, `labelKey`, `badgeKey`) and
 * a declaration whose name ends in `KEYS`. Anything else holding a key string
 * outside `t()` is a string that will render as itself.
 */
const KEY_CARRIER = /\b[A-Za-z0-9_]*Keys?\s*[:=]/i;
const KEY_LIST_OPEN = /\b[A-Za-z0-9_]*Keys?\s*[:=]\s*\[/i;

function sourceFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'i18n' && entry.name !== '__tests__') sourceFiles(full, out);
    } else if (/\.tsx?$/.test(full)) {
      out.push(full);
    }
  }
  return out;
}

const unwrapped = [];
for (const file of sourceFiles('src')) {
  let inKeyList = false;
  fs.readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, index) => {
      if (inKeyList) {
        if (/^\s*\]/.test(line)) inKeyList = false;
      } else if (KEY_LIST_OPEN.test(line) && !/\]/.test(line)) {
        inKeyList = true;
      }
      if (inKeyList || KEY_CARRIER.test(line)) return;

      for (const match of line.matchAll(/(^|[^A-Za-z0-9_.])'([a-zA-Z0-9_]+\.[a-zA-Z0-9_.]+)'/g)) {
        if (!en.has(match[2])) continue;
        if (/\bt\($/.test(line.slice(0, match.index + match[1].length))) continue;
        unwrapped.push(`${file}:${index + 1}  '${match[2]}'`);
      }
    });
}

const problems = [];
if (unwrapped.length) {
  problems.push(
    `a translation key used as a bare string — wrap it in t():\n  ${unwrapped.join('\n  ')}`
  );
}
if (undefinedKeys.length) problems.push(`used but not defined:\n  ${undefinedKeys.join('\n  ')}`);
if (missingFromAr.length) problems.push(`in en but not ar:\n  ${missingFromAr.join('\n  ')}`);
if (missingFromEn.length) problems.push(`in ar but not en:\n  ${missingFromEn.join('\n  ')}`);

if (problems.length) {
  console.error('Translation key check failed.\n');
  problems.forEach((p) => console.error(p + '\n'));
  process.exit(1);
}

console.log(
  `Translations OK — ${en.size} keys, both locales in sync, ${used.size} referenced, ` +
    'no bare key strings.'
);
