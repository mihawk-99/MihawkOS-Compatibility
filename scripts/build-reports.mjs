// SPDX-License-Identifier: GPL-3.0-or-later
// Turn the moderated sheet's published CSV into data/reports.json, the only data the page reads.
//
//   SHEET_CSV_URL=https://docs.google.com/... node scripts/build-reports.mjs
//   node scripts/build-reports.mjs --csv scripts/fixtures/sample.csv [--out file] [--appids file] [--steam file] [--offline]
//
// Submissions are untrusted text from anyone. Nothing here evaluates them: each cell is parsed as text, cleaned
// (HTML, links, e-mail addresses and invisible characters removed, lengths capped), checked against the known
// values, and written as JSON strings that React renders as text. Only rows whose Approved cell is ticked are kept.
// The log prints counts only, never a submission's words, since a public repository's Action logs are public.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { RATINGS, CONSOLES, LAUNCHERS, COLUMNS, LIMITS } from '../src/fields.js';

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_ROWS = 20000;
const MAX_LOOKUPS = 50; // Steam store searches per run; names not found are tried again on later runs

// RFC 4180: quoted cells, doubled quotes, commas and newlines inside quotes, CRLF or LF, a leading BOM.
export function parseCsv(text) {
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let i = text.charCodeAt(0) === 0xfeff ? 1 : 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
      if (rows.length > MAX_ROWS) throw new Error(`more than ${MAX_ROWS} rows`);
    } else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

const INVISIBLE = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f­​-‏‪-‮⁠-⁯﻿￹-￻]/g;
const LINK = /\b(?:https?|ftp|file|javascript|data|vbscript):\S*|\bwww\.\S+|\b[\w-]{1,63}(?:\.[\w-]{1,63}){0,4}\.(?:com|net|org|io|gg|me|co|xyz|ru|cn|info|link|ly|to|tk|top|site|online|app|dev|shop|club|biz|us|uk|de|fr)\b(?:[/?#]\S*)?/gi;
const EMAIL = /[^\s@]{0,64}@[^\s@]{0,255}/g;

// Plain text only: one line, or several (notes) with at most one blank line between paragraphs.
export function cleanText(value, limit, { multiline = false } = {}) {
  // Cut first: cleaning only removes characters, and then no pattern below scans more than a few thousand.
  let s = String(value ?? '').slice(0, limit * 4).normalize('NFC');
  s = s.replace(/<(script|style)\b[\s\S]*?(?:<\/\1\s*>|$)/gi, ' ')
    .replace(/<[^>]*>?/g, ' ')
    .replace(/[<>]/g, ' ')
    .replace(INVISIBLE, '')
    .replace(EMAIL, ' ')
    .replace(LINK, ' ');
  s = multiline
    ? s.split(/\r\n?|\n/).map((line) => line.replace(/[^\S\n]+/g, ' ').trim()).join('\n').replace(/\n{3,}/g, '\n\n').trim()
    : s.replace(/\s+/g, ' ').trim();
  const chars = [...s];
  return chars.length > limit ? chars.slice(0, limit - 1).join('').trimEnd() + '…' : s;
}

// A choice is matched as written (spaces collapsed, any case), not cleaned: cleaning would strip "Battle.net" as a link.
const answer = (value) => String(value ?? '').slice(0, 100).replace(/\s+/g, ' ').trim().toLowerCase();
const pick = (value, allowed) => allowed.find((a) => a.toLowerCase() === answer(value)) ?? null;

// A store link works as well as the number: https://store.steampowered.com/app/620/... gives 620.
export function cleanAppId(value) {
  const s = String(value ?? '').trim();
  const id = /\/app\/(\d{1,10})\b/.exec(s)?.[1] ?? (/^\d{1,10}$/.test(s) ? s : null);
  return id && Number(id) > 0 ? String(Number(id)) : null;
}

// A sheet may store 10.10 as the number 10.1; PS5 firmware always has two digits after the point.
export function cleanFirmware(value) {
  const m = /^(\d{1,2})\.(\d{1,2})$/.exec(String(value ?? '').trim());
  return m ? `${Number(m[1])}.${m[2].padEnd(2, '0')}` : null;
}

export function cleanVersion(value) {
  const m = /^v?(\d{1,3}\.\d{1,3}\.\d{1,3}(?:-[a-z]{1,12}(?:[-.]\d{1,3})?)?)$/i.exec(String(value ?? '').trim());
  return m ? `v${m[1].toLowerCase()}` : null;
}

export function cleanLauncher(value) {
  if (!answer(value)) return null;
  return pick(value, LAUNCHERS) ?? 'Other';
}

export function cleanFps(value) {
  const s = String(value ?? '').trim();
  if (!/^\d{1,3}(?:[.,]\d{1,2})?$/.test(s)) return null;
  const n = Math.round(Number(s.replace(',', '.')));
  return n >= 1 && n <= 500 ? n : null;
}

// Google writes the timestamp in the sheet's locale; ISO (yyyy-mm-dd, docs/FORM.md) or US m/d/yyyy are read.
// Only the day is published.
export function cleanDate(value) {
  const s = String(value ?? '').trim();
  let y, mo, d;
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})(?!\d)/.exec(s);
  if (m) [, y, mo, d] = m;
  else if ((m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?!\d)/.exec(s))) [, mo, d, y] = m;
  else return null;
  const date = new Date(Date.UTC(+y, +mo - 1, +d));
  if (date.getUTCMonth() !== +mo - 1 || +y < 2026 || +y > 2100) return null;
  return date.toISOString().slice(0, 10);
}

const APPROVED = new Set(['true', 'yes', 'y', 'x', '1', '✓', '✔', 'approved']);
export const isApproved = (value) => APPROVED.has(String(value ?? '').trim().toLowerCase());

// One sheet row (an object keyed by field) to one report, or the reason it is left out.
export function normalizeRow(raw) {
  if (!isApproved(raw.approved)) return { drop: 'not approved' };
  const report = {
    date: cleanDate(raw.timestamp),
    game: cleanText(raw.game, LIMITS.game),
    appid: cleanAppId(raw.appid),
    launcher: cleanLauncher(raw.launcher),
    version: cleanVersion(raw.version),
    console: pick(raw.console, CONSOLES),
    firmware: cleanFirmware(raw.firmware),
    rating: pick(raw.rating, RATINGS.map((r) => r.name)),
    fps: cleanFps(raw.fps),
    settings: cleanText(raw.settings, LIMITS.settings) || null,
    notes: cleanText(raw.notes, LIMITS.notes, { multiline: true }) || null,
    nickname: cleanText(raw.nickname, LIMITS.nickname) || null,
  };
  for (const field of ['date', 'game', 'version', 'console', 'firmware', 'rating']) {
    if (!report[field]) return { drop: `bad ${field}` };
  }
  return { report };
}

export function buildReports(csvText) {
  const [header = [], ...rows] = parseCsv(csvText);
  const index = {};
  const names = header.map((h) => h.trim().toLowerCase());
  for (const [field, title] of Object.entries(COLUMNS)) {
    index[field] = names.indexOf(title.toLowerCase());
    if (index[field] < 0) throw new Error(`the sheet has no "${title}" column (columns must be named as in docs/FORM.md)`);
  }
  const reports = [];
  const dropped = {};
  const row = new Map();
  rows.forEach((cells, i) => {
    if (cells.every((c) => c.trim() === '')) return;
    const raw = Object.fromEntries(Object.entries(index).map(([field, i]) => [field, cells[i] ?? '']));
    const { report, drop } = normalizeRow(raw);
    if (report) { reports.push(report); row.set(report, i); } else dropped[drop] = (dropped[drop] ?? 0) + 1;
  });
  // Newest first. Only the day is published, so within a day the sheet's own order decides: the form adds each answer
  // below the last, so a lower row is a later report. The file's order is the page's "latest" order.
  reports.sort((a, b) => b.date.localeCompare(a.date) || row.get(b) - row.get(a));
  return { reports, dropped, rows: rows.length };
}

// A game's picture needs its Steam AppID. A report without one gets it from Steam's store search, but only when a
// result has exactly the game's name (case, accents, ™ and punctuation aside), so a near match never shows the wrong art.
export const gameKey = (name) => name.replace(/[™®©℠]/g, '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ').trim();

export async function findAppIds(reports, cache, search) {
  const names = new Map();
  for (const r of reports) if (!r.appid && !(gameKey(r.game) in cache) && gameKey(r.game)) names.set(gameKey(r.game), r.game);
  let found = 0;
  for (const [key, name] of [...names].slice(0, MAX_LOOKUPS)) {
    const items = await search(name).catch(() => []);
    const match = items.find((i) => /^\d{1,10}$/.test(String(i.id)) && gameKey(String(i.name ?? '')) === key);
    if (match) { cache[key] = String(match.id); found++; }
  }
  for (const r of reports) if (!r.appid && cache[gameKey(r.game)]) r.appid = cache[gameKey(r.game)];
  return { searched: Math.min(names.size, MAX_LOOKUPS), found };
}

async function steamSearch(term) {
  const url = new URL('https://store.steampowered.com/api/storesearch/');
  url.search = new URLSearchParams({ term, l: 'english', cc: 'US' });
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = await res.json();
  return Array.isArray(body?.items) ? body.items : [];
}

// For each AppID, Steam's appdetails gives the game's name (the report page's "is it the right game?") and its header
// picture. Newer games keep that picture under a content hash (.../apps/<id>/<hash>/header.jpg) and answer 404 at the
// plain .../apps/<id>/header.jpg. Both are kept per AppID in data/steam.json ({ name, header }, header "" when the plain
// path is the picture), so each AppID is asked once.
export async function findSteam(reports, cache, details) {
  const ids = [...new Set(reports.map((r) => r.appid).filter((id) => id && !(id in cache)))];
  for (const id of ids.slice(0, MAX_LOOKUPS)) {
    const info = await details(id).catch(() => null);
    if (info === null) continue; // not answered: asked again on the next run
    cache[id] = {
      name: cleanText(info.name, LIMITS.game),
      header: new RegExp(`/apps/${id}/([0-9a-f]{40})/header\\.jpg`).exec(String(info.header_image ?? ''))?.[1] ?? '',
    };
  }
  return Object.fromEntries(Object.entries(cache).filter(([id]) => reports.some((r) => r.appid === id)));
}

async function steamDetails(id) {
  const url = new URL('https://store.steampowered.com/api/appdetails');
  url.search = new URLSearchParams({ appids: id, filters: 'basic' });
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json())?.[id]?.data ?? {};
}

async function fetchCsv(url) {
  const u = new URL(url);
  if (u.protocol !== 'https:' || u.hostname !== 'docs.google.com') throw new Error('SHEET_CSV_URL must be a https://docs.google.com/ published CSV link');
  const res = await fetch(u, { redirect: 'follow', signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`the sheet answered HTTP ${res.status}`);
  if (Number(res.headers.get('content-length')) > MAX_BYTES) throw new Error('the sheet is larger than 5 MiB');
  const body = await res.text();
  if (body.length > MAX_BYTES) throw new Error('the sheet is larger than 5 MiB');
  if (/^\s*<(!doctype|html)/i.test(body)) throw new Error('the link gave a web page, not CSV: publish the sheet as CSV (OWNER_SETUP.md)');
  return body;
}

async function main(argv) {
  const arg = (name) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : undefined; };
  const out = arg('--out') ?? fileURLToPath(new URL('../data/reports.json', import.meta.url));
  const file = arg('--csv');
  const url = process.env.SHEET_CSV_URL?.trim();
  if (!file && !url) {
    console.log('SHEET_CSV_URL is not set: data/reports.json is left as it is.');
    return;
  }
  const csv = file ? await readFile(file, 'utf8') : await fetchCsv(url);
  if (Buffer.byteLength(csv) > MAX_BYTES) throw new Error('the CSV is larger than 5 MiB');
  const { reports, dropped, rows } = buildReports(csv);
  // data/appids.json remembers the AppIDs found by name, so a day Steam does not answer changes nothing.
  const cacheFile = arg('--appids') ?? fileURLToPath(new URL('../data/appids.json', import.meta.url));
  const cache = JSON.parse(await readFile(cacheFile, 'utf8').catch(() => '{}'));
  const offline = argv.includes('--offline');
  const lookups = await findAppIds(reports, cache, offline ? async () => [] : steamSearch);
  const steamFile = arg('--steam') ?? fileURLToPath(new URL('../data/steam.json', import.meta.url));
  const steamCache = JSON.parse(await readFile(steamFile, 'utf8').catch(() => '{}'));
  const steam = await findSteam(reports, steamCache, offline ? async () => null : steamDetails);
  const sorted = (o) => JSON.stringify(Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b))), null, 1) + '\n';
  if (!offline) {
    await writeFile(cacheFile, sorted(cache));
    await writeFile(steamFile, sorted(steamCache));
  }
  await writeFile(out, JSON.stringify({ examples: false, steam: JSON.parse(sorted(steam)), reports }, null, 1) + '\n');
  console.log(`rows ${rows}, published ${reports.length}, left out ${JSON.stringify(dropped)}, Steam searches ${lookups.searched}, AppIDs found ${lookups.found}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((e) => { console.error(`build-reports: ${e.message}`); process.exit(1); });
}
