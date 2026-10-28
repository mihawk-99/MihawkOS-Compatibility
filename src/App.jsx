// SPDX-License-Identifier: GPL-3.0-or-later
// The compatibility list: data/reports.json (built by scripts/build-reports.mjs) grouped into one row per game.
// Every value is rendered as text by React; nothing from a report becomes markup, a link or a style.
import { useMemo, useState } from 'react';
import data from '../data/reports.json';
import { RATINGS, CONSOLES } from './fields.js';
import { Badge, Bar, Footer, FORM_URL, Launcher, steamHeader, useNight } from './shell.jsx';
import { useT } from './i18n.jsx';
import bannerDay from './assets/banner-day.svg';
import bannerNight from './assets/banner-night.svg';

const RANK = Object.fromEntries(RATINGS.map((r, i) => [r.name, i]));
const ORDER = new Map(data.reports.map((r, i) => [r, i])); // 0 = the newest report
const byVersion = (a, b) => b.localeCompare(a, 'en', { numeric: true });
const day = (date, lang) => new Date(`${date}T00:00:00Z`).toLocaleDateString(lang, { timeZone: 'UTC', dateStyle: 'medium' });

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
    g.latest = g.reports[0]; // reports.json is newest first, the same day included (scripts/build-reports.mjs)
    g.best = g.reports.reduce((best, r) => (RANK[r.rating] < RANK[best.rating] ? r : best));
    g.name = g.latest.game;
    g.appid = g.reports.find((r) => r.appid)?.appid ?? null;
    return g;
  });
}

const SORTS = {
  latest: { label: 'Latest report', compare: (a, b) => ORDER.get(a.latest) - ORDER.get(b.latest) },
  best: { label: 'Best rating', compare: (a, b) => RANK[a.best.rating] - RANK[b.best.rating] },
  name: { label: 'Name', compare: (a, b) => a.name.localeCompare(b.name) },
  count: { label: 'Most reports', compare: (a, b) => b.reports.length - a.reports.length },
};

function Cover({ game }) {
  const [failed, setFailed] = useState(false);
  if (game.appid && /^\d+$/.test(game.appid) && !failed) {
    return (
      <img src={steamHeader(game.appid, data.steam)} alt=""
        loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
    );
  }
  return <span className="letter" aria-hidden="true">{[...game.name][0]?.toUpperCase()}</span>;
}

function Report({ r }) {
  const { t, lang } = useT();
  return (
    <li className="report">
      <div className="report-head">
        <Badge rating={r.rating} />
        {r.launcher && <Launcher name={r.launcher} />}
        <span>{r.console} · {t('firmware {0}', r.firmware)} · MihawkOS {r.version}{r.fps ? ` · ${t('{0} fps', r.fps)}` : ''}</span>
        <time dateTime={r.date}>{day(r.date, lang)}</time>
      </div>
      {r.settings && <p><strong>{t('Settings:')}</strong> {r.settings}</p>}
      {r.notes && <p className="notes">{r.notes}</p>}
      <p className="by">{r.nickname ?? t('Anonymous')}</p>
    </li>
  );
}

function Game({ game }) {
  const { t, lang } = useT();
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
          <div><dt>{t('Best')}</dt><dd><Badge rating={game.best.rating} /></dd></div>
          <div><dt>{t('Latest')}</dt><dd><Badge rating={game.latest.rating} /> <span className="muted">{game.latest.console}, {game.latest.version}, {day(game.latest.date, lang)}</span></dd></div>
          {launchers.length > 0 && <div><dt>{t('Started')}</dt><dd>{launchers.map((l) => <Launcher key={l} name={l} />)}</dd></div>}
        </dl>
        <button type="button" className="button small" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
          {open ? t('Hide reports ({0})', count) : t('Show reports ({0})', count)}
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
  const { t, lang } = useT();
  const reports = data.reports;
  const [query, setQuery] = useState('');
  const [rating, setRating] = useState('');
  const [model, setModel] = useState('');
  const [firmware, setFirmware] = useState('');
  const [version, setVersion] = useState('');
  const [sort, setSort] = useState('latest');
  const [night, changeTheme] = useNight();

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
      <a className="skip" href="#games">{t('Skip to the games')}</a>
      <Bar root="./" night={night} onTheme={changeTheme}>
        <a href="#games">{t('Games')}</a>
        <a href="#ratings">{t('Ratings')}</a>
        <a href="#report">{t('How to report')}</a>
      </Bar>

      <main id="top">
        <section className="hero glass">
          <img src={night ? bannerNight : bannerDay} alt="" width="1280" height="400" />
          <div className="hero-text">
            <h1>{t('Which Windows games run on MihawkOS?')}</h1>
            <p className="lead">{t('Reports from players who tried their own games on their own PS5. Every report is read before it appears here.')}</p>
            <ul className="stats" aria-label={t('Totals')}>
              <li>{t(allGames.length === 1 ? '{0} game' : '{0} games', allGames.length)}</li>
              <li>{t(reports.length === 1 ? '{0} report' : '{0} reports', reports.length)}</li>
              {reports[0] && <li>{t('latest {0}', day(reports[0].date, lang))}</li>}
            </ul>
          </div>
        </section>

        {data.examples && (
          <div className="banner glass" role="note">
            <strong>{t('These are made-up examples.')}</strong>
            <p className="muted">{t('They show how the list looks. The first real reports replace them.')}</p>
          </div>
        )}

        <section id="games" aria-labelledby="games-title">
          <h2 id="games-title" className="section-title">{t('Games')}</h2>
          <form className="filters glass" role="search" onSubmit={(e) => e.preventDefault()}>
            <label className="search">
              {t('Search')}
              <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("A game's name")} autoComplete="off" />
            </label>
            <Select label={t('Rating')} value={rating} onChange={setRating} options={RATINGS.map((r) => [r.name, t(r.name)])} all={t('Any rating')} />
            <Select label={t('Console')} value={model} onChange={setModel} options={CONSOLES} all={t('Any console')} />
            <Select label={t('Firmware')} value={firmware} onChange={setFirmware} options={firmwares} all={t('Any firmware')} />
            <Select label="MihawkOS" value={version} onChange={setVersion} options={versions} all={t('Any version')} />
            <Select label={t('Sort by')} value={sort} onChange={setSort} options={Object.entries(SORTS).map(([k, s]) => [k, t(s.label)])} />
          </form>
          <p className="result-line" aria-live="polite">
            {filtered ? t('{0} matching', games.length) : t(games.length === 1 ? '{0} game' : '{0} games', games.length)}
            {filtered && <button type="button" className="link" onClick={clear}>{t('Clear filters')}</button>}
          </p>
          {games.length ? (
            <ul className="games">{games.map((g) => <Game key={g.key} game={g} />)}</ul>
          ) : (
            <div className="glass card empty">
              <h3>{reports.length ? t('No game matches') : t('No reports yet')}</h3>
              <p className="muted">{reports.length ? t('Try fewer filters, or another name.') : t('Be the first: tell us how a game ran for you.')}</p>
            </div>
          )}
        </section>

        <section id="ratings" aria-labelledby="ratings-title">
          <h2 id="ratings-title" className="section-title">{t('What the ratings mean')}</h2>
          <ul className="ratings">
            {RATINGS.map((r) => <li key={r.name} className="glass card"><Badge rating={r.name} /><p>{t(r.means)}</p></li>)}
          </ul>
        </section>

        <section id="report" aria-labelledby="report-title" className="glass card how">
          <h2 id="report-title">{t('Report games')}</h2>
          <ol className="steps">
            <li>{t('Play games you own on MihawkOS.')}</li>
            <li>{t('Fill in the report page: your console, firmware and MihawkOS version once, then one card per game with how it ran. No account, no e-mail.')}</li>
            <li>{t('Your reports are read, then they appear here, usually within a day.')}</li>
          </ol>
          <p className="muted">{t('Please write only about the games: no links, no personal details. A nickname is optional and shown with your reports.')}</p>
          <div className="actions">
            <a className="button primary" href="./report/">{t('Report games')}</a>
            {FORM_URL && <a className="link" href={FORM_URL} target="_blank" rel="noopener noreferrer">{t('or use the Google Form')}</a>}
          </div>
        </section>
      </main>

      <Footer root="./" />
    </>
  );
}
