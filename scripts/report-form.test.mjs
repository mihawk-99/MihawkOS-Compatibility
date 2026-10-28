// SPDX-License-Identifier: GPL-3.0-or-later
// The report page's rules (src/submit.js): what it lets through matches the Google Form's checks, and what it sends is
// one response per game with the form's own field ids.
import test from 'node:test';
import assert from 'node:assert/strict';
import { appidFrom, formBody, prefill, problems, responseUrl } from '../src/submit.js';
import { FORM_ENTRIES } from '../src/fields.js';

const shared = { console: 'PS5 Pro', firmware: '10.01', version: 'v4.0.0-alpha-4', nickname: '' };
const row = { game: 'Hades', appid: '1145360', launcher: 'Steam', rating: 'Perfect', fps: '120', settings: '', notes: '' };

test('a complete row passes; each missing or wrong field is named', () => {
  assert.deepEqual(problems(shared, row), {});
  assert.deepEqual(Object.keys(problems({ ...shared, console: 'PS6', firmware: '10.1', version: 'latest' }, row)).sort(), ['console', 'firmware', 'version']);
  assert.deepEqual(Object.keys(problems(shared, { ...row, game: '  ', appid: '12ab', rating: 'Gold', fps: '0', launcher: 'Origin' })).sort(),
    ['appid', 'fps', 'game', 'launcher', 'rating']);
  assert.ok(problems(shared, { ...row, fps: '501' }).fps);
  assert.ok(problems(shared, { ...row, fps: '59.9' }).fps); // whole numbers only
  assert.deepEqual(problems(shared, { ...row, appid: '', launcher: '', fps: '' }), {}); // optional fields may stay empty
  assert.ok(problems(shared, { ...row, notes: 'x'.repeat(1001) }).notes);
  assert.ok(problems({ ...shared, nickname: 'n'.repeat(33) }, row).nickname);
});

test("the body is the form's own answer: field ids, trimmed values, nothing empty", () => {
  const body = formBody({ ...shared, nickname: ' tester ' }, { ...row, settings: ' 120 Hz ', notes: '' });
  assert.equal(body.get(FORM_ENTRIES.game), 'Hades');
  assert.equal(body.get(FORM_ENTRIES.console), 'PS5 Pro');
  assert.equal(body.get(FORM_ENTRIES.firmware), '10.01');
  assert.equal(body.get(FORM_ENTRIES.settings), '120 Hz');
  assert.equal(body.get(FORM_ENTRIES.nickname), 'tester');
  assert.equal(body.has(FORM_ENTRIES.notes), false);
  assert.equal([...body.keys()].every((k) => /^entry\.\d+$/.test(k)), true);
});

test('only a Google Form link gives a place to post to', () => {
  assert.equal(responseUrl('https://docs.google.com/forms/d/e/1FAIpQLSe-x_Y/viewform?usp=pp_url'), 'https://docs.google.com/forms/d/e/1FAIpQLSe-x_Y/formResponse');
  assert.equal(responseUrl('https://evil.example/forms/d/e/x/viewform'), null);
  assert.equal(responseUrl(undefined), null);
});

test('a link fills the page in; unknown choices are ignored', () => {
  const p = prefill('?game=Hades&appid=https://store.steampowered.com/app/1145360/Hades/&model=ps5%20pro&fw=10.01&version=v9&launcher=steam&rating=Perfect');
  assert.deepEqual(p.shared, { console: 'PS5 Pro', firmware: '10.01', version: '' });
  assert.deepEqual(p.row, { game: 'Hades', appid: '1145360', launcher: 'Steam', rating: 'Perfect', fps: '', settings: '' });
  assert.equal(appidFrom(' 620 '), '620');
});

test('the Steam lookup: only its own address, and only clean answers', async () => {
  const { lookupUrl, cleanGames, cleanGame } = await import('../src/submit.js');
  assert.equal(lookupUrl('https://script.google.com/macros/s/AKfy-cb_1/exec'), 'https://script.google.com/macros/s/AKfy-cb_1/exec');
  assert.equal(lookupUrl('https://evil.example/macros/s/x/exec'), null);
  const hash = '9d1e5917fb47c7af55a5134a6f7eb302fea2fb16';
  const games = cleanGames({ games: [
    { id: '2499860', name: 'DRAGON QUEST VII Reimagined', capsule: hash },
    { id: '413150', name: 'Stardew <b>Valley</b>', capsule: '' },
    { id: '12ab', name: 'bad id' }, { id: '1', name: '' }, { id: '2', name: 42 },
    { id: '3', name: 'bad hash', capsule: 'https://evil.example/x' },
  ] });
  assert.deepEqual(games.map((g) => g.id), ['2499860', '413150', '3']);
  assert.equal(games[0].img, `https://shared.steamstatic.com/store_item_assets/steam/apps/2499860/${hash}/capsule_231x87.jpg`);
  assert.equal(games[1].name, 'Stardew bValley/b');
  assert.equal(games[2].img, 'https://shared.steamstatic.com/store_item_assets/steam/apps/3/capsule_231x87.jpg');
  assert.deepEqual(cleanGames({ error: 'x' }), []);
  assert.equal(cleanGame({ game: { id: '9', name: 'Other' } }, '8'), null); // an answer for another AppID is ignored
  assert.equal(cleanGame({ game: { id: '8', name: 'Eight', header: hash } }, '8').img, `https://shared.steamstatic.com/store_item_assets/steam/apps/8/${hash}/header.jpg`);
});
