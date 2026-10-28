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
