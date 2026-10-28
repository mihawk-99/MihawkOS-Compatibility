// SPDX-License-Identifier: GPL-3.0-or-later
// What both pages share: the theme (night by default, the visitor's choice remembered), the glass header with the
// Day/Night slider, and the footer.
import { useState } from 'react';
import './app.css';

try {
  if (localStorage.getItem('theme') === 'light') document.documentElement.dataset.theme = 'light';
} catch { /* storage blocked: keep night */ }

export const FORM_URL = /^https:\/\/docs\.google\.com\/forms\/d\/e\/[\w-]+\/viewform/.test(import.meta.env.VITE_FORM_URL ?? '')
  ? import.meta.env.VITE_FORM_URL : null;
export const SOURCE_URL = /^https:\/\/github\.com\//.test(import.meta.env.VITE_SOURCE_URL ?? '') ? import.meta.env.VITE_SOURCE_URL : null;

export function useNight() {
  const [night, setNight] = useState(document.documentElement.dataset.theme !== 'light');
  const change = (toNight) => {
    document.documentElement.dataset.theme = toNight ? 'dark' : 'light';
    try { localStorage.setItem('theme', toNight ? 'dark' : 'light'); } catch { /* not remembered */ }
    setNight(toNight);
  };
  return [night, change];
}

function ThemeToggle({ night, onChange }) {
  return (
    <button type="button" role="switch" aria-checked={night} aria-label="Night mode" className={`theme-toggle${night ? ' night' : ''}`}
      onClick={() => onChange(!night)}>
      <span className="label" aria-hidden="true">{night ? 'Night Mode' : 'Day Mode'}</span>
      <span className="knob" aria-hidden="true">
        {night
          ? <svg viewBox="0 0 24 24"><path d="M15.5 3.2a8.5 8.5 0 1 0 5.3 13.3A7 7 0 0 1 15.5 3.2Z" fill="#2c3e5c" /><path d="m17.5 6 .6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6Z" fill="#2c3e5c" /></svg>
          : <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.6" fill="#ffb020" /><g stroke="#ffb020" strokeWidth="2" strokeLinecap="round"><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.5 1.5M17.2 17.2l1.5 1.5M5.3 18.7l1.5-1.5M17.2 6.8l1.5-1.5" /></g></svg>}
      </span>
    </button>
  );
}

// root: the path back to the site's top ('./' on the list, '../' on the report page).
export function Bar({ root, night, onTheme, children, report = true }) {
  return (
    <header className="bar glass">
      <a className="brand" href={root}><img src={`${root}mark.svg`} alt="" width="36" height="36" /><span>MihawkOS <em>Compatibility</em></span></a>
      <nav aria-label="Sections">{children}</nav>
      {report && <a className="button primary report-button" href={`${root}report/`}>Report games</a>}
      <ThemeToggle night={night} onChange={onTheme} />
    </header>
  );
}

export function Footer({ root }) {
  return (
    <footer>
      <p>MihawkOS is a passion project, not a piracy project. Use only games you own. <a href="https://github.com/mihawk-99/PS5_MihawkOS">MihawkOS on GitHub</a></p>
      <p>No trackers, no analytics, no cookies. Game pictures come from Steam's public image server.</p>
      <p>{SOURCE_URL && <><a href={SOURCE_URL}>Source</a> (GPL-3.0-or-later) · </>}
        <a href={`${root}licenses/LGPL-2.1.txt`}>Art and mark: LGPL-2.1-or-later</a> · <a href={`${root}licenses/OFL-1.1-Inter.txt`}>Inter: OFL-1.1</a> · <a href={`${root}licenses/react-MIT.txt`}>React: MIT</a></p>
    </footer>
  );
}

// A game's Steam header picture: under its content hash when the build found one (data/reports.json "steam").
export function steamHeader(appid, steam) {
  const hash = steam?.[appid]?.header;
  const path = /^[0-9a-f]{40}$/.test(hash ?? '') ? `${appid}/${hash}` : appid;
  return `https://shared.steamstatic.com/store_item_assets/steam/apps/${path}/header.jpg`;
}
