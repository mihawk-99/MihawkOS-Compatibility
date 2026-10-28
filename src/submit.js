// SPDX-License-Identifier: GPL-3.0-or-later
// The report page's rules, kept apart from React so scripts/report-form.test.mjs can check them. Each game becomes one
// Google Form response; the checks match the form's own (docs/FORM.md), because Google gives no answer the page can read
// when it refuses one.
import { RATINGS, CONSOLES, LAUNCHERS, VERSIONS, LIMITS, FORM_ENTRIES } from './fields.js';

export const SHARED = ['console', 'firmware', 'version', 'nickname'];
export const PER_GAME = ['game', 'appid', 'launcher', 'rating', 'fps', 'settings', 'notes'];

// A Steam store link works as well as the number.
export const appidFrom = (text) => {
  const s = String(text ?? '').trim();
  return /\/app\/(\d{1,10})/.exec(s)?.[1] ?? s.replace(/\s+/g, '');
};

const tooLong = (value, limit) => [...String(value ?? '')].length > limit;

// The problems of one game row, by field, in plain words; empty when it can be sent.
export function problems(shared, row) {
  const p = {};
  if (!CONSOLES.includes(shared.console)) p.console = 'Choose your console.';
  if (!/^\d{1,2}\.\d{2}$/.test(String(shared.firmware ?? '').trim())) p.firmware = 'Like 10.01 or 13.40.';
  if (!VERSIONS.includes(shared.version)) p.version = 'Choose the MihawkOS version.';
  if (tooLong(shared.nickname, LIMITS.nickname)) p.nickname = `At most ${LIMITS.nickname} characters.`;
  if (!String(row.game ?? '').trim()) p.game = "The game's name.";
  else if (tooLong(row.game.trim(), LIMITS.game)) p.game = `At most ${LIMITS.game} characters.`;
  if (row.appid && !/^\d{1,10}$/.test(row.appid)) p.appid = 'Only the number, like 620.';
  if (row.launcher && !LAUNCHERS.includes(row.launcher)) p.launcher = 'Choose a launcher.';
  if (!RATINGS.some((r) => r.name === row.rating)) p.rating = 'Choose how it ran.';
  if (row.fps !== '' && row.fps != null && !(/^\d{1,3}$/.test(String(row.fps)) && +row.fps >= 1 && +row.fps <= 500)) p.fps = 'A whole number from 1 to 500.';
  if (tooLong(row.settings, LIMITS.settings)) p.settings = `At most ${LIMITS.settings} characters.`;
  if (tooLong(row.notes, LIMITS.notes)) p.notes = `At most ${LIMITS.notes} characters.`;
  return p;
}

// The form's answer for one game, as the browser would send the Google Form itself.
export function formBody(shared, row) {
  const body = new URLSearchParams();
  for (const field of [...SHARED, ...PER_GAME]) {
    const value = String((SHARED.includes(field) ? shared : row)[field] ?? '').trim();
    if (value) body.set(FORM_ENTRIES[field], value);
  }
  return body;
}

// https://docs.google.com/forms/d/e/<id>/viewform -> .../formResponse, or null for anything else.
export function responseUrl(formUrl) {
  const m = /^https:\/\/docs\.google\.com\/forms\/d\/e\/([\w-]+)\/viewform/.exec(formUrl ?? '');
  return m ? `https://docs.google.com/forms/d/e/${m[1]}/formResponse` : null;
}

// A link may fill the page in: ?game=&appid=&launcher=&rating=&fps=&settings=&console=&model=&fw=&firmware=&version=
// Unknown choices are ignored rather than shown as wrong.
export function prefill(search) {
  const q = new URLSearchParams(search);
  const get = (...names) => names.map((n) => q.get(n)).find((v) => v != null)?.trim().slice(0, 1000) ?? '';
  const pick = (value, allowed) => allowed.find((a) => a.toLowerCase() === value.toLowerCase()) ?? '';
  return {
    shared: {
      console: pick(get('console', 'model'), CONSOLES),
      firmware: get('firmware', 'fw'),
      version: pick(get('version'), VERSIONS),
    },
    row: {
      game: get('game'),
      appid: appidFrom(get('appid')),
      launcher: pick(get('launcher'), LAUNCHERS),
      rating: pick(get('rating'), RATINGS.map((r) => r.name)),
      fps: get('fps'),
      settings: get('settings'),
    },
  };
}

// The Steam lookup (tools/steam-lookup.gs) is a Google Apps Script web app; only its own address is used.
export function lookupUrl(url) {
  return /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(url ?? '') ? url : null;
}

const STEAM_IMG = 'https://shared.steamstatic.com/store_item_assets/steam/apps';
const hex40 = (h) => (/^[0-9a-f]{40}$/.test(h ?? '') ? h : '');

// Its answers are untrusted input too: only digits, plain names and 40-hex picture hashes are kept.
export function cleanGames(body) {
  const games = Array.isArray(body?.games) ? body.games : [];
  return games.filter((g) => /^\d{1,10}$/.test(String(g?.id)) && typeof g?.name === 'string' && g.name.trim()).slice(0, 8)
    .map((g) => {
      const id = String(g.id);
      const hash = hex40(g.capsule);
      return { id, name: g.name.replace(/[<>]/g, '').trim().slice(0, 100), img: `${STEAM_IMG}/${id}${hash ? `/${hash}` : ''}/capsule_231x87.jpg` };
    });
}

export function cleanGame(body, id) {
  const g = body?.game;
  if (!g || String(g.id) !== id || typeof g.name !== 'string' || !g.name.trim()) return null;
  const hash = hex40(g.header);
  return { id, name: g.name.replace(/[<>]/g, '').trim().slice(0, 100), img: `${STEAM_IMG}/${id}${hash ? `/${hash}` : ''}/header.jpg` };
}
