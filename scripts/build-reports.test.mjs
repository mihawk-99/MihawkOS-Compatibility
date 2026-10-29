// SPDX-License-Identifier: GPL-3.0-or-later
// npm test  (node --test "scripts/*.test.mjs": a pattern, as Node 22 reads a bare folder as a file)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildReports, findAppIds, findSteam, gameKey, parseCsv, cleanText, cleanLauncher, cleanAppId, cleanFirmware, cleanFps, cleanVersion, cleanDate } from './build-reports.mjs';

const fixture = (name) => readFileSync(new URL(`fixtures/${name}`, import.meta.url), 'utf8');
const HEADER = 'Timestamp,Game,Steam AppID,Launcher,MihawkOS version,Console,Firmware,Rating,FPS,Settings,Notes,Nickname,Approved';
const csvCell = (s) => `"${String(s).replace(/"/g, '""')}"`;

test('the sample sheet keeps only approved, valid rows, newest first', () => {
  const { reports, dropped, rows } = buildReports(fixture('sample.csv'));
  assert.equal(rows, 7);
  assert.equal(reports.length, 5);
  assert.deepEqual(dropped, { 'not approved': 2 });
  assert.deepEqual(reports.map((r) => r.date), ['2026-10-24', '2026-10-24', '2026-10-23', '2026-10-22', '2026-10-21']);
  const pro = reports.find((r) => r.rating === 'Boots only');
  assert.equal(pro.firmware, '10.10'); // the sheet's number 10.1
  assert.equal(pro.version, 'v3.0.0-alpha-3');
  const multi = reports.find((r) => r.date === '2026-10-22');
  assert.equal(multi.notes, 'Example row.\nThe first load takes a minute.');
  assert.equal(multi.nickname, null);
  assert.equal(multi.fps, 60);
  assert.equal(multi.launcher, 'None');
  assert.deepEqual(reports.map((r) => r.launcher), ['Steam', 'Epic Games Store', null, 'None', 'Steam']); // same day: the lower row first
});

test('within one day, a lower sheet row is a later report and comes first', () => {
  const row = (time, game) => `10/28/2026 ${time},${game},,,v4.0.0-alpha-4,PS5 Pro,10.01,Perfect,,,,,TRUE`;
  const { reports } = buildReports([HEADER, row('0:23:45', 'Zeta'), row('10:31:09', 'Alpha'), row('9:50:16', 'Mid'),
    '10/27/2026 23:59:00,Older,,,v4.0.0-alpha-4,PS5,10.01,Perfect,,,,,TRUE'].join('\n'));
  assert.deepEqual(reports.map((r) => r.game), ['Mid', 'Alpha', 'Zeta', 'Older']);
});

test('hostile rows: no markup, links, e-mail or invisible characters survive; fields are capped', () => {
  const { reports, dropped } = buildReports(fixture('hostile.csv'));
  assert.deepEqual(dropped, {
    'bad console': 1, 'bad rating': 1, 'bad firmware': 1, 'bad version': 1, 'bad game': 1, 'bad date': 1, 'not approved': 2,
  });
  // "Short row" has no Approved cell, so it counts as not approved: 11 rows, 3 kept.
  assert.equal(reports.length, 3);
  const text = JSON.stringify(reports);
  for (const bad of ['<', '>', 'script', 'onerror', 'http', 'www.', 'evil.com', 'bad.ru', 'spam.net', 'javascript:', '@', '‮', '​']) {
    assert.ok(!text.includes(bad), `"${bad}" survived`);
  }
  const evil = reports.find((r) => r.game.startsWith('Evil'));
  assert.equal(evil.game, 'Evil Game');
  assert.equal(evil.appid, '620');
  assert.equal(evil.settings, 'high');
  assert.equal(evil.nickname, 'nick');
  assert.equal(evil.launcher, 'Other'); // "<b>Steam</b>" is not an option as written
  assert.equal(reports.find((r) => r.game.startsWith('AAA')).launcher, 'Other'); // free text never published
  const odd = reports.find((r) => r.rating === 'Broken');
  assert.equal(odd.console, 'PS5 Pro');
  assert.equal(odd.version, 'v4.0.0-alpha-4');
  assert.equal(odd.firmware, '9.60');
  assert.equal(odd.appid, '440');
  assert.equal(odd.fps, 60);
  assert.equal(odd.launcher, 'Battle.net');
  assert.equal(odd.notes, 'line1\n\nline2');
  assert.equal(odd.game, '=HYPERLINK("'); // plain text: React shows it as written, nothing runs it
});

test('huge cells are cut to their limits', () => {
  const huge = 'A'.repeat(200000);
  const row = ['2026-10-26 10:01:00', huge, '123abc', huge, 'v4.0.0-alpha-4', 'PS5', '13.40', 'Playable', '999999', huge, huge, huge, 'TRUE'];
  const { reports } = buildReports(`${HEADER}\n${row.map(csvCell).join(',')}\n`);
  const [r] = reports;
  assert.equal([...r.game].length, 100);
  assert.ok(r.game.endsWith('…'));
  assert.equal([...r.settings].length, 300);
  assert.equal([...r.notes].length, 1000);
  assert.equal([...r.nickname].length, 32);
  assert.equal(r.appid, null);
  assert.equal(r.fps, null);
  assert.equal(r.launcher, 'Other');
});

test('a sheet without the expected columns is refused, not guessed', () => {
  assert.throws(() => buildReports('Game,Rating\nX,Perfect\n'), /no "Timestamp" column/);
});

test('CSV parsing follows RFC 4180', () => {
  assert.deepEqual(parseCsv('﻿a,"b,""c""",d\r\n"multi\nline",,\n'), [['a', 'b,"c"', 'd'], ['multi\nline', '', '']]);
});

test('field cleaners', () => {
  assert.equal(cleanText('  a\u0000b <i>c</i>  ', 10), 'ab c');
  assert.equal(cleanText('<scr<script>ipt>alert(1)</script>', 50), '');
  assert.equal(cleanAppId('0'), null);
  assert.equal(cleanAppId('12345678901'), null);
  assert.equal(cleanFirmware('13.4'), '13.40');
  assert.equal(cleanFirmware('13.400'), null);
  assert.equal(cleanLauncher(' itch.IO '), 'itch.io');
  assert.equal(cleanLauncher('<b>Steam</b>'), 'Other');
  assert.equal(cleanFps('0'), null);
  assert.equal(cleanFps('29,97'), 30);
  assert.equal(cleanVersion('4.0.0-alpha-4'), 'v4.0.0-alpha-4');
  assert.equal(cleanVersion('latest'), null);
  assert.equal(cleanDate('2/30/2026 10:00:00'), null);
  assert.equal(cleanDate('2026-10-27T10:00:00Z'), '2026-10-27');
});

test('a report without an AppID takes one from Steam only for the exact name', async () => {
  const reports = [{ game: 'Hollow Knight™' }, { game: 'Celest' }, { game: 'Portal 2', appid: '620' }, { game: 'Known' }];
  const asked = [];
  const search = async (term) => {
    asked.push(term);
    if (term === 'Celest') return [{ id: 504230, name: 'Celeste' }]; // a near match is not taken
    return [{ id: 'x1', name: 'Hollow Knight' }, { id: 367520, name: 'Hollow Knight' }];
  };
  const cache = { known: '1234' };
  const result = await findAppIds(reports, cache, search);
  assert.deepEqual(asked, ['Hollow Knight™', 'Celest']); // never for a report with an AppID or a cached name
  assert.deepEqual(result, { searched: 2, found: 1 });
  assert.deepEqual(reports.map((r) => r.appid ?? null), ['367520', null, '620', '1234']);
  assert.deepEqual(cache, { known: '1234', 'hollow knight': '367520' });
  assert.equal(gameKey('Pokémon: Édition'), 'pokemon edition');
  // Steam not answering changes nothing.
  const quiet = [{ game: 'Other' }];
  await findAppIds(quiet, {}, async () => { throw new Error('down'); });
  assert.equal(quiet[0].appid, undefined);
});

test('Steam names and hashed header pictures are found once per AppID', async () => {
  const hash = 'ea0c655407c078a8994b7e91256c79d90169133a';
  const asked = [];
  const details = async (id) => {
    asked.push(id);
    if (id === '2499860') return { name: 'DRAGON QUEST VII <b>Reimagined</b>', header_image: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2499860/${hash}/header.jpg?t=1` };
    if (id === '9') throw new Error('down');
    return { name: 'Portal 2', header_image: 'https://cdn.example/apps/620/header.jpg' }; // the plain path: no hash
  };
  const cache = { 1030300: { name: 'Hollow Knight: Silksong', header: '7983574d464e6559ac7e24275727f73a8bcca1f3' }, 77: { name: 'Gone', header: '' } };
  const reports = [{ appid: '2499860' }, { appid: '2499860' }, { appid: '620' }, { appid: '1030300' }, { appid: '9' }, { appid: null }];
  const steam = await findSteam(reports, cache, details);
  assert.deepEqual(asked, ['2499860', '620', '9']); // each once, never a cached one
  assert.deepEqual(steam, {
    2499860: { name: 'DRAGON QUEST VII Reimagined', header: hash }, // the name is cleaned like a report's text
    620: { name: 'Portal 2', header: '' },
    1030300: { name: 'Hollow Knight: Silksong', header: '7983574d464e6559ac7e24275727f73a8bcca1f3' },
  }); // only AppIDs of published reports
  assert.ok(!('9' in cache)); // Steam not answering is asked again next run
  const odd = {};
  await findSteam([{ appid: '5' }], odd, async () => ({ header_image: `https://x/apps/6/${hash}/header.jpg` }));
  assert.deepEqual(odd['5'], { name: '', header: '' }); // another AppID's hash is not taken
});

test('the version list is the releases, newest first, without drafts or odd tags', async () => {
  const { releaseVersions } = await import('./fetch-versions.mjs');
  assert.deepEqual(releaseVersions([
    { tag_name: 'v5.0.1-alpha-5' }, { tag_name: 'v6.0.0-alpha-6', draft: true }, { tag_name: 'v5.0.0-alpha-5' },
    { tag_name: 'nightly' }, { tag_name: 'v5.0.0-alpha-5' }, {},
  ]), ['v5.0.1-alpha-5', 'v5.0.0-alpha-5']);
  assert.deepEqual(releaseVersions({ message: 'rate limited' }), []);
});
