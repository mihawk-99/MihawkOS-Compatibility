// SPDX-License-Identifier: GPL-3.0-or-later
// The report's fields, shared by the page and scripts/build-reports.mjs. The Google Form's options must be spelled
// exactly as these (docs/FORM.md); a row with another value is dropped when the data is built.

// Best first: the page sorts and picks a game's best rating by this order.
export const RATINGS = [
  { name: 'Perfect', means: 'Plays from start to end as on a PC, with nothing to change.' },
  { name: 'Playable', means: 'Plays to the end. Small problems, or a setting to change, but nothing that stops you.' },
  { name: 'Runs with issues', means: 'You can play, but something gets in the way: slowdowns, missing sound or video, crashes now and then.' },
  { name: 'Boots only', means: 'Starts and reaches its menu or first scene, but you cannot really play it.' },
  { name: 'Broken', means: 'Does not start, or stops before you see anything.' },
];

export const CONSOLES = ['PS5', 'PS5 Slim', 'PS5 Digital Edition', 'PS5 Pro'];

// Optional. "None": the game's own program was started directly. A form's free "Other" answer is published as "Other".
export const LAUNCHERS = ['None', 'Steam', 'Epic Games Store', 'GOG Galaxy', 'EA app', 'Ubisoft Connect', 'Battle.net',
  'Rockstar Games Launcher', 'itch.io', 'Other'];

// The form's own question titles, which Google uses as the sheet's column headers.
export const COLUMNS = {
  timestamp: 'Timestamp',
  game: 'Game',
  appid: 'Steam AppID',
  launcher: 'Launcher',
  version: 'MihawkOS version',
  console: 'Console',
  firmware: 'Firmware',
  rating: 'Rating',
  fps: 'FPS',
  settings: 'Settings',
  notes: 'Notes',
  nickname: 'Nickname',
  approved: 'Approved',
};

export const LIMITS = { game: 100, settings: 300, notes: 1000, nickname: 32 };

// The form's MihawkOS version options, newest first. Add each new release here and in the Google Form.
export const VERSIONS = ['v4.0.0-alpha-4', 'v3.0.0-alpha-3', 'v2.0.0-alpha-2', 'v1.0.0-alpha-1'];

// The Google Form's field ids (its pre-fill link, docs/FORM.md). The report page posts each game to the form with these;
// a question deleted and made again gets a new id, which must be copied here.
export const FORM_ENTRIES = {
  game: 'entry.360954',
  appid: 'entry.1142179574',
  launcher: 'entry.346947463',
  version: 'entry.1455217213',
  console: 'entry.675106169',
  firmware: 'entry.412913000',
  rating: 'entry.1075560426',
  fps: 'entry.608722964',
  settings: 'entry.657180200',
  notes: 'entry.763652494',
  nickname: 'entry.1272920297',
};

// Every PS5 firmware the homebrew SDK MihawkOS builds on has a kernel table for, newest first: PS5_PayloadSDK
// crt/kernel.c at 3e31e0b (2026-10-24), its "case 0xMMmm0000" lines. The report page offers these, and "Not in the
// list?" for a newer one; the check stays NN.NN either way.
export const FIRMWARES = ['13.60', '13.42', '13.40', '13.20', '13.00', '12.70', '12.60', '12.40', '12.20', '12.02', '12.00',
  '11.60', '11.40', '11.20', '11.00', '10.60', '10.40', '10.20', '10.01', '10.00', '9.60', '9.40', '9.20', '9.05', '9.00',
  '8.60', '8.40', '8.20', '8.00', '7.61', '7.60', '7.40', '7.20', '7.01', '7.00', '6.50', '6.02', '6.00', '5.50', '5.10',
  '5.02', '5.00', '4.51', '4.50', '4.03', '4.02', '4.00', '3.21', '3.20', '3.10', '3.00', '2.70', '2.50', '2.30', '2.26',
  '2.25', '2.20', '2.00', '1.14', '1.13', '1.12', '1.11', '1.10', '1.05', '1.02', '1.01', '1.00'];
