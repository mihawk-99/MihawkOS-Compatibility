// SPDX-License-Identifier: GPL-3.0-or-later
// The compatibility list: data/reports.json (built by scripts/build-reports.mjs) grouped into one row per game.
// Every value is rendered as text by React; nothing from a report becomes markup, a link or a style.
import { useMemo, useState } from 'react';
import data from '../data/reports.json';
import { RATINGS, CONSOLES } from './fields.js';
import { LAUNCHER_ICONS } from './launchers.js';
import bannerDay from './assets/banner-day.svg';
import bannerNight from './assets/banner-night.svg';

const RANK = Object.fromEntries(RATINGS.map((r, i) => [r.name, i]));
const slug = (rating) => rating.toLowerCase().replace(/\s+/g, '-');
const FORM_URL = /^https:\/\/(docs\.google\.com\/forms\/|forms\.gle\/|tally\.so\/)/.test(import.meta.env.VITE_FORM_URL ?? '')
  ? import.meta.env.VITE_FORM_URL : null;
const SOURCE_URL = /^https:\/\/github\.com\//.test(import.meta.env.VITE_SOURCE_URL ?? '') ? import.meta.env.VITE_SOURCE_URL : null;
const byVersion = (a, b) => b.localeCompare(a, 'en', { numeric: true });
const day = (date) => new Date(`${date}T00:00:00Z`).toLocaleDateString(undefined, { timeZone: 'UTC', dateStyle: 'medium' });

// shortcut: a report without an AppID is grouped by its name alone, so it does not join the same game's AppID rows;
// merge by name too if that splits games in practice.
function groupGames(reports) {
  const games = new Map();
  for (const r of reports) {
    const key = r.appid ? `app:${r.appid}` : `name:${r.game.toLowerCase()}`;
    if (!games.has(key)) games.set(key, { key, reports: [] });
    games.get(key).reports.push(r);
  }
  return [...games.values()].map((g) => {
    g.reports.sort((a, b) => b.date.localeCompare(a.date));
    g.latest = g.reports[0];
    g.best = g.reports.reduce((best, r) => (RANK[r.rating] < RANK[best.rating] ? r : best));
    g.name = g.latest.game;
    g.appid = g.reports.find((r) => r.appid)?.appid ?? null;
    return g;
  });
}

const SORTS = {
  latest: { label: 'Latest report', compare: (a, b) => b.latest.date.localeCompare(a.latest.date) },
  best: { label: 'Best rating', compare: (a, b) => RANK[a.best.rating] - RANK[b.best.rating] },
  name: { label: 'Name', compare: (a, b) => a.name.localeCompare(b.name) },
  count: { label: 'Most reports', compare: (a, b) => b.reports.length - a.reports.length },
};

function Badge({ rating }) {
  return <span className={`badge rating-${slug(rating)}`}>{rating}</span>;
}

function Launcher({ name }) {
  const path = LAUNCHER_ICONS[name];
  return (
    <span className={`launcher launcher-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>
      {path && <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d={path} /></svg>}
      {name === 'None' ? 'No launcher' : name}
    </span>
  );
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

function Cover({ game }) {
  const [failed, setFailed] = useState(false);
  if (game.appid && /^\d+$/.test(game.appid) && !failed) {
    // Newer games' pictures sit under a content hash (data/headers.json, from scripts/build-reports.mjs).
    const hash = data.headers?.[game.appid];
    const path = /^[0-9a-f]{40}$/.test(hash ?? '') ? `${game.appid}/${hash}` : game.appid;
    return (
      <img src={`https://shared.steamstatic.com/store_item_assets/steam/apps/${path}/header.jpg`} alt=""
        loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
    );
  }
  return <span className="letter" aria-hidden="true">{[...game.name][0]?.toUpperCase()}</span>;
}

function Report({ r }) {
  return (
    <li className="report">
      <div className="report-head">
        <Badge rating={r.rating} />
        {r.launcher && <Launcher name={r.launcher} />}
        <span>{r.console} · firmware {r.firmware} · MihawkOS {r.version}{r.fps ? ` · ${r.fps} fps` : ''}</span>
        <time dateTime={r.date}>{day(r.date)}</time>
      </div>
      {r.settings && <p><strong>Settings:</strong> {r.settings}</p>}
      {r.notes && <p className="notes">{r.notes}</p>}
      <p className="by">{r.nickname ?? 'Anonymous'}</p>
    </li>
  );
}

function Game({ game }) {
  const [open, setOpen] = useState(false);
  const id = `reports-${game.key.replace(/[^\w-]/g, '_')}`;
  const count = game.reports.length;
  const launchers = [...new Set(game.reports.map((r) => r.launcher).filter(Boolean))];
  return (
    <li className="game glass">
      <div className="art"><Cover game={game} /></div>
      <div className="game-body">
        <h3 className="name">{game.name}</h3>
        <dl className="verdicts">
          <div><dt>Best</dt><dd><Badge rating={game.best.rating} /></dd></div>
          <div><dt>Latest</dt><dd><Badge rating={game.latest.rating} /> <span className="muted">{game.latest.console}, {game.latest.version}, {day(game.latest.date)}</span></dd></div>
          {launchers.length > 0 && <div><dt>Started</dt><dd>{launchers.map((l) => <Launcher key={l} name={l} />)}</dd></div>}
        </dl>
        <button type="button" className="button small" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
          {open ? 'Hide' : 'Show'} {count} {count === 1 ? 'report' : 'reports'}
        </button>
      </div>
      {open && <ul id={id} className="reports">{game.reports.map((r, i) => <Report key={i} r={r} />)}</ul>}
    </li>
  );
}

function Select({ label, value, onChange, options, all }) {
  return (
    <label>
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {all && <option value="">{all}</option>}
        {options.map((o) => (Array.isArray(o) ? <option key={o[0]} value={o[0]}>{o[1]}</option> : <option key={o}>{o}</option>))}
      </select>
    </label>
  );
}

export default function App() {
  const reports = data.reports;
  const [query, setQuery] = useState('');
  const [rating, setRating] = useState('');
  const [model, setModel] = useState('');
  const [firmware, setFirmware] = useState('');
  const [version, setVersion] = useState('');
  const [sort, setSort] = useState('latest');
  const [night, setNight] = useState(document.documentElement.dataset.theme !== 'light');
  const changeTheme = (toNight) => {
    document.documentElement.dataset.theme = toNight ? 'dark' : 'light';
    try { localStorage.setItem('theme', toNight ? 'dark' : 'light'); } catch { /* not remembered */ }
    setNight(toNight);
  };

  const firmwares = useMemo(() => [...new Set(reports.map((r) => r.firmware))].sort(byVersion), [reports]);
  const versions = useMemo(() => [...new Set(reports.map((r) => r.version))].sort(byVersion), [reports]);
  const allGames = useMemo(() => groupGames(reports), [reports]);

  // Filters pick reports first, so a game's best and latest rating are those of the reports that match.
  const games = useMemo(() => {
    const q = query.trim().toLowerCase();
    const picked = reports.filter((r) => (!q || r.game.toLowerCase().includes(q)) && (!rating || r.rating === rating)
      && (!model || r.console === model) && (!firmware || r.firmware === firmware) && (!version || r.version === version));
    return groupGames(picked).sort((a, b) => SORTS[sort].compare(a, b) || a.name.localeCompare(b.name));
  }, [reports, query, rating, model, firmware, version, sort]);
  const filtered = query || rating || model || firmware || version;
  const clear = () => { setQuery(''); setRating(''); setModel(''); setFirmware(''); setVersion(''); };

  return (
    <>
      <a className="skip" href="#games">Skip to the games</a>
      <header className="bar glass">
        <a className="brand" href="#top"><img src="./mark.svg" alt="" width="36" height="36" /><span>MihawkOS <em>Compatibility</em></span></a>
        <nav aria-label="Sections">
          <a href="#games">Games</a>
          <a href="#ratings">Ratings</a>
          <a href="#report">How to report</a>
        </nav>
        {FORM_URL && <a className="button primary report-button" href={FORM_URL} target="_blank" rel="noopener noreferrer">Report a game</a>}
        <ThemeToggle night={night} onChange={changeTheme} />
      </header>

      <main id="top">
        <section className="hero glass">
          <img src={night ? bannerNight : bannerDay} alt="" width="1280" height="400" />
          <div className="hero-text">
            <h1>Which Windows games run on MihawkOS?</h1>
            <p className="lead">Reports from players who tried their own games on their own PS5. Every report is read before it appears here.</p>
            <ul className="stats" aria-label="Totals">
              <li><strong>{allGames.length}</strong> {allGames.length === 1 ? 'game' : 'games'}</li>
              <li><strong>{reports.length}</strong> {reports.length === 1 ? 'report' : 'reports'}</li>
              {reports[0] && <li>latest <strong>{day(reports[0].date)}</strong></li>}
            </ul>
          </div>
        </section>

        {data.examples && (
          <div className="banner glass" role="note">
            <strong>These are made-up examples.</strong>
            <p className="muted">They show how the list looks. The first real reports replace them.</p>
          </div>
        )}

        <section id="games" aria-labelledby="games-title">
          <h2 id="games-title" className="section-title">Games</h2>
          <form className="filters glass" role="search" onSubmit={(e) => e.preventDefault()}>
            <label className="search">
              Search
              <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="A game's name" autoComplete="off" />
            </label>
            <Select label="Rating" value={rating} onChange={setRating} options={RATINGS.map((r) => r.name)} all="Any rating" />
            <Select label="Console" value={model} onChange={setModel} options={CONSOLES} all="Any console" />
            <Select label="Firmware" value={firmware} onChange={setFirmware} options={firmwares} all="Any firmware" />
            <Select label="MihawkOS" value={version} onChange={setVersion} options={versions} all="Any version" />
            <Select label="Sort by" value={sort} onChange={setSort} options={Object.entries(SORTS).map(([k, s]) => [k, s.label])} />
          </form>
          <p className="result-line" aria-live="polite">
            {games.length} {games.length === 1 ? 'game' : 'games'}{filtered ? ' match' : ''}
            {filtered && <button type="button" className="link" onClick={clear}>Clear filters</button>}
          </p>
          {games.length ? (
            <ul className="games">{games.map((g) => <Game key={g.key} game={g} />)}</ul>
          ) : (
            <div className="glass card empty">
              <h3>{reports.length ? 'No game matches' : 'No reports yet'}</h3>
              <p className="muted">{reports.length ? 'Try fewer filters, or another name.' : 'Be the first: tell us how a game ran for you.'}</p>
            </div>
          )}
        </section>

        <section id="ratings" aria-labelledby="ratings-title">
          <h2 id="ratings-title" className="section-title">What the ratings mean</h2>
          <ul className="ratings">
            {RATINGS.map((r) => <li key={r.name} className="glass card"><Badge rating={r.name} /><p>{r.means}</p></li>)}
          </ul>
        </section>

        <section id="report" aria-labelledby="report-title" className="glass card how">
          <h2 id="report-title">Report a game</h2>
          <ol className="steps">
            <li>Play a game you own on MihawkOS.</li>
            <li>Fill in the short form: the game, your console and firmware, MihawkOS's version and how it ran. No account, no e-mail.</li>
            <li>Your report is read, then it appears here, usually within a day.</li>
          </ol>
          <p className="muted">Please write only about the game: no links, no personal details. A nickname is optional and shown with your report.</p>
          {FORM_URL
            ? <div className="actions"><a className="button primary" href={FORM_URL} target="_blank" rel="noopener noreferrer">Open the form</a></div>
            : <p className="muted"><em>The form opens here once it is set up.</em></p>}
        </section>
      </main>

      <footer>
        <p>MihawkOS is a passion project, not a piracy project. Use only games you own. <a href="https://github.com/mihawk-99/PS5_MihawkOS">MihawkOS on GitHub</a></p>
        <p>No trackers, no analytics, no cookies. Game pictures come from Steam's public image server.</p>
        <p>{SOURCE_URL && <><a href={SOURCE_URL}>Source</a> (GPL-3.0-or-later) · </>}
          <a href="./licenses/LGPL-2.1.txt">Art and mark: LGPL-2.1-or-later</a> · <a href="./licenses/OFL-1.1-Inter.txt">Inter: OFL-1.1</a> · <a href="./licenses/react-MIT.txt">React: MIT</a></p>
      </footer>
    </>
  );
}
