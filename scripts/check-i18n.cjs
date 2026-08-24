/**
 * Fails when a `t('key')` call has no entry in the locale files, or when the
 * two locales have drifted apart.
 *
 * This started as a one-off script: 48 keys referenced namespaces that no
 * longer existed (`navbar.` vs `nav.`), so the UI rendered raw key strings to
 * users in both languages and nothing caught it.
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

const problems = [];
if (undefinedKeys.length) problems.push(`used but not defined:\n  ${undefinedKeys.join('\n  ')}`);
if (missingFromAr.length) problems.push(`in en but not ar:\n  ${missingFromAr.join('\n  ')}`);
if (missingFromEn.length) problems.push(`in ar but not en:\n  ${missingFromEn.join('\n  ')}`);

if (problems.length) {
  console.error('Translation key check failed.\n');
  problems.forEach((p) => console.error(p + '\n'));
  process.exit(1);
}

console.log(`Translations OK — ${en.size} keys, both locales in sync, ${used.size} referenced.`);
