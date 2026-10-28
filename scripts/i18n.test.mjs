// SPDX-License-Identifier: GPL-3.0-or-later
// Every word the pages show has a translation in every language, and each keeps its {0}, {1} places
// (src/i18n-text.js). node scripts/i18n.test.mjs --list prints the English keys a translator is given.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import TEXT from '../src/i18n-text.js';
import { RATINGS } from '../src/fields.js';

const source = ['App.jsx', 'ReportPage.jsx', 'shell.jsx', 'i18n.jsx', 'music.jsx'].map((f) => readFileSync(new URL(`../src/${f}`, import.meta.url), 'utf8')).join('\n');
const literals = (re) => [...source.matchAll(re)].map((m) => m[2]);
export const KEYS = [...new Set([
  ...literals(/\bt\((['"])((?:(?!\1)[^\\]|\\.)*)\1/g), // t('...')
  ...[...source.matchAll(/\bt\([\w.]+ === 1 \? '([^']*)' : '([^']*)'/g)].flatMap((m) => [m[1], m[2]]), // t(n === 1 ? 'a' : 'b')
  ...[...source.matchAll(/\?\.means \?\? '([^']*)'\)/g)].map((m) => m[1]), // t(... ?? 'fallback')
  ...literals(/label: (['"])((?:(?!\1).)*)\1, compare/g), // the sort labels
  ...RATINGS.flatMap((r) => [r.name, r.means]),
  ...readFileSync(new URL('../src/submit.js', import.meta.url), 'utf8').match(/p\.\w+ = (['"`])[^'"`]*\1/g)
    .map((m) => m.replace(/^p\.\w+ = .|.$/g, '').replace('${LIMITS.nickname}', '32').replace('${LIMITS.game}', '100')
      .replace('${LIMITS.settings}', '300').replace('${LIMITS.notes}', '1000')),
].map((k) => k.replace(/\\'/g, "'")))].sort();

if (process.argv.includes('--list')) console.log(JSON.stringify(KEYS, null, 1));

test('every language has every key, with the same placeholders', () => {
  const places = (s) => (s.match(/\{\d\}/g) ?? []).sort().join();
  for (const [lang, words] of Object.entries(TEXT)) {
    const missing = KEYS.filter((k) => !(k in words));
    assert.deepEqual(missing, [], `${lang} misses ${missing.length}`);
    for (const k of KEYS) assert.equal(places(words[k]), places(k), `${lang}: ${k}`);
    const unused = Object.keys(words).filter((k) => !KEYS.includes(k));
    assert.deepEqual(unused, [], `${lang} has unused keys`);
  }
  assert.equal(Object.keys(TEXT).length, 9);
});
