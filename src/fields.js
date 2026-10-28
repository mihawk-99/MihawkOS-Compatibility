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
