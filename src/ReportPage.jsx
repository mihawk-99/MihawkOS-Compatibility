// SPDX-License-Identifier: GPL-3.0-or-later
// The report page: the console's details once, then one row per game. Each row is posted to the Google Form as its own
// response (src/submit.js), so the sheet, its Approved box and the list's build stay as they are.
import { useMemo, useRef, useState } from 'react';
import data from '../data/reports.json';
import { RATINGS, CONSOLES, LAUNCHERS, VERSIONS } from './fields.js';
import { appidFrom, formBody, prefill, problems, responseUrl } from './submit.js';
import { Bar, Footer, FORM_URL, steamHeader, useNight } from './shell.jsx';

const POST_URL = responseUrl(FORM_URL);
const SAVED = 'report-console'; // this device's console, firmware, version and nickname
const key = (name) => String(name ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
let nextId = 1;
const emptyRow = (fill = {}) => ({ id: nextId++, game: '', appid: '', launcher: '', rating: '', fps: '', settings: '', notes: '', ...fill });

function loadShared() {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(SAVED) ?? '{}') ?? {}; } catch { /* nothing saved */ }
  const start = { console: '', firmware: '', version: VERSIONS[0], nickname: '', ...saved };
  return Object.fromEntries(Object.entries(start).map(([k, v]) => [k, typeof v === 'string' ? v : '']));
}

// The games the list already knows, for the name suggestions and the AppID check.
function useKnownGames() {
  return useMemo(() => {
    const byId = new Map();
    for (const [id, s] of Object.entries(data.steam ?? {})) if (s?.name) byId.set(id, s.name);
    for (const r of data.reports) if (r.appid && !byId.has(r.appid)) byId.set(r.appid, r.game);
    const byName = new Map([...byId].map(([id, name]) => [key(name), id]));
    return { byId, byName, names: [...new Set(byId.values())].sort() };
  }, []);
}

function Field({ label, error, hint, children, wide }) {
  return (
    <label className={`field${wide ? ' wide' : ''}${error ? ' bad' : ''}`}>
      <span>{label}</span>
      {children}
      {error ? <em className="error">{error}</em> : hint && <em className="hint">{hint}</em>}
    </label>
  );
}

// "Is it the right game?": the AppID's Steam picture and name, and a link to check on Steam.
function SteamCheck({ appid, game, known }) {
  const [state, setState] = useState({ id: null, ok: true });
  if (!/^\d{1,10}$/.test(appid)) return null;
  const failed = state.id === appid && !state.ok;
  const name = known.byId.get(appid);
  const matches = name && key(name) === key(game);
  return (
    <div className="steam-check" aria-live="polite">
      {!failed && <img src={steamHeader(appid, data.steam)} alt="" referrerPolicy="no-referrer"
        onLoad={() => setState({ id: appid, ok: true })} onError={() => setState({ id: appid, ok: false })} />}
      <p>
        {name
          ? (matches ? <strong className="good">✓ Steam AppID {appid} is {name}.</strong>
            : <><strong>Steam AppID {appid} is {name}.</strong> Is that your game?</>)
          : failed ? <>No picture for {appid}. Check that it is your game:</> : <>Is this your game?</>}
        {' '}<a href={`https://store.steampowered.com/app/${appid}/`} target="_blank" rel="noopener noreferrer">Open its Steam page</a>
      </p>
    </div>
  );
}

function GameRow({ row, index, count, errors, known, onChange, onRemove }) {
  const set = (field) => (e) => onChange({ ...row, [field]: e.target.value });
  const setGame = (e) => {
    const game = e.target.value;
    // A game the list knows fills its AppID in, unless one was typed.
    const id = known.byName.get(key(game));
    onChange({ ...row, game, appid: row.appid || id || '' });
  };
  return (
    <li className="game-row glass">
      <div className="row-head">
        <h3>Game {index + 1}</h3>
        {count > 1 && <button type="button" className="link" onClick={onRemove}>Remove</button>}
      </div>
      <div className="row-fields">
        <Field label="Game *" error={errors.game} wide>
          <input value={row.game} onChange={setGame} list="known-games" maxLength={100} autoComplete="off" placeholder="As on its store page" />
        </Field>
        <Field label="Steam AppID" error={errors.appid} hint="Optional. The number in its Steam link, or paste the link.">
          <input value={row.appid} onChange={(e) => onChange({ ...row, appid: appidFrom(e.target.value) })} inputMode="numeric" autoComplete="off" placeholder="e.g. 620" />
        </Field>
        <Field label="Launcher" error={errors.launcher} hint="Optional. What you started it from.">
          <select value={row.launcher} onChange={set('launcher')}>
            <option value="">Not saying</option>
            {LAUNCHERS.map((l) => <option key={l} value={l}>{l === 'None' ? "None (the game's own program)" : l}</option>)}
          </select>
        </Field>
        <Field label="How it ran *" error={errors.rating}>
          <select value={row.rating} onChange={set('rating')}>
            <option value="">Choose…</option>
            {RATINGS.map((r) => <option key={r.name} value={r.name}>{r.name}</option>)}
          </select>
        </Field>
        <Field label="FPS" error={errors.fps} hint="Optional, about.">
          <input value={row.fps} onChange={set('fps')} inputMode="numeric" maxLength={3} placeholder="e.g. 60" />
        </Field>
        <Field label="Settings" error={errors.settings} hint="Optional: 120 Hz, Game Mode, controller…" wide>
          <input value={row.settings} onChange={set('settings')} maxLength={300} />
        </Field>
        <Field label="Notes" error={errors.notes} hint="Optional: what worked and what did not." wide>
          <textarea value={row.notes} onChange={set('notes')} maxLength={1000} rows={3} />
        </Field>
      </div>
      {row.rating && <p className="rating-means muted">{RATINGS.find((r) => r.name === row.rating)?.means}</p>}
      <SteamCheck appid={row.appid} game={row.game} known={known} />
    </li>
  );
}

export default function ReportPage() {
  const [night, changeTheme] = useNight();
  const known = useKnownGames();
  const start = useMemo(() => prefill(window.location.search), []);
  const [shared, setShared] = useState(() => {
    const s = loadShared();
    for (const [k, v] of Object.entries(start.shared)) if (v) s[k] = v;
    return s;
  });
  const [rows, setRows] = useState(() => {
    const row = Object.fromEntries(Object.entries(start.row).filter(([, v]) => v));
    if (row.game && !row.appid && known.byName.has(key(row.game))) row.appid = known.byName.get(key(row.game));
    return [emptyRow(row)];
  });
  const [showErrors, setShowErrors] = useState(false);
  const [status, setStatus] = useState(null); // { kind: 'sending' | 'done' | 'failed', sent, total }
  const top = useRef(null);

  const errorsOf = (row) => (showErrors ? problems(shared, row) : {});
  const sharedErrors = showErrors ? problems(shared, { game: 'x', rating: RATINGS[0].name }) : {};
  const setS = (field) => (e) => setShared({ ...shared, [field]: e.target.value });

  async function send(e) {
    e.preventDefault();
    setShowErrors(true);
    const bad = rows.some((r) => Object.keys(problems(shared, r)).length);
    if (bad) {
      setStatus(null);
      setTimeout(() => document.querySelector('.field.bad input, .field.bad select, .field.bad textarea')?.focus(), 0);
      return;
    }
    try { localStorage.setItem(SAVED, JSON.stringify(shared)); } catch { /* not remembered */ }
    const left = [];
    let sent = 0;
    setStatus({ kind: 'sending', sent, total: rows.length });
    for (const row of rows) {
      try {
        // Google answers another site's page without telling it the result ("no-cors"), so a request that leaves is
        // counted as sent; the checks above match the form's, so Google accepts it.
        await fetch(POST_URL, { method: 'POST', mode: 'no-cors', body: formBody(shared, row) });
        sent++;
        setStatus({ kind: 'sending', sent, total: rows.length });
      } catch {
        left.push(row);
      }
    }
    setShowErrors(false);
    setRows(left.length ? left : [emptyRow()]);
    setStatus({ kind: left.length ? 'failed' : 'done', sent, total: rows.length });
    top.current?.scrollIntoView();
  }

  return (
    <>
      <a className="skip" href="#report-form">Skip to the form</a>
      <Bar root="../" night={night} onTheme={changeTheme} report={false}>
        <a href="../">All games</a>
        <a href="../#ratings">Ratings</a>
      </Bar>
      <main id="top">
        <section className="glass card intro" ref={top}>
          <h1>Report games</h1>
          <p className="lead">Tell other players how your games ran on MihawkOS. No account, no e-mail. Every report is read before it
            appears on the list, usually within a day. Write only about the games: no links, no personal details.</p>
          {status?.kind === 'done' && (
            <p className="notice good" role="status">Thank you! {status.sent} {status.sent === 1 ? 'report' : 'reports'} sent. They will
              appear on the list once read. Your console details are remembered on this device for next time.</p>
          )}
          {status?.kind === 'failed' && (
            <p className="notice bad" role="alert">{status.sent} of {status.total} sent. The rest could not leave this device (no internet?).
              They are still below: press Send again.</p>
          )}
          {!POST_URL && <p className="notice bad" role="alert">The report form is not set up yet.</p>}
        </section>

        <form id="report-form" onSubmit={send} noValidate>
          <datalist id="known-games">{known.names.map((n) => <option key={n} value={n} />)}</datalist>
          <section className="glass card console" aria-labelledby="console-title">
            <h2 id="console-title">Your console</h2>
            <p className="muted">Filled in once for all the games below, and remembered on this device.</p>
            <div className="row-fields">
              <Field label="Console *" error={sharedErrors.console} hint="Digital Edition: any PS5 without a disc drive.">
                <select value={shared.console} onChange={setS('console')}>
                  <option value="">Choose…</option>
                  {CONSOLES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Firmware *" error={sharedErrors.firmware} hint="Settings > System > System Software > Console Information.">
                <input value={shared.firmware} onChange={setS('firmware')} inputMode="decimal" maxLength={5} placeholder="e.g. 10.01" />
              </Field>
              <Field label="MihawkOS version *" error={sharedErrors.version} hint="On its wallpaper and the WebUI's Help page.">
                <select value={shared.version} onChange={setS('version')}>
                  {VERSIONS.map((v) => <option key={v}>{v}</option>)}
                </select>
              </Field>
              <Field label="Nickname" error={sharedErrors.nickname} hint="Optional, shown with your reports. Not your e-mail.">
                <input value={shared.nickname} onChange={setS('nickname')} maxLength={32} autoComplete="nickname" />
              </Field>
            </div>
          </section>

          <h2 className="section-title">Your games</h2>
          <ul className="game-rows">
            {rows.map((row, i) => (
              <GameRow key={row.id} row={row} index={i} count={rows.length} errors={errorsOf(row)} known={known}
                onChange={(next) => setRows(rows.map((r) => (r.id === row.id ? next : r)))}
                onRemove={() => setRows(rows.filter((r) => r.id !== row.id))} />
            ))}
          </ul>
          <div className="actions form-actions">
            <button type="button" className="button" onClick={() => setRows([...rows, emptyRow()])}>+ Add another game</button>
            <button type="submit" className="button primary" disabled={!POST_URL || status?.kind === 'sending'}>
              {status?.kind === 'sending' ? `Sending ${status.sent + 1} of ${status.total}…` : `Send ${rows.length} ${rows.length === 1 ? 'report' : 'reports'}`}
            </button>
            {showErrors && rows.some((r) => Object.keys(problems(shared, r)).length) && (
              <span className="error" role="alert">Some fields need a look (in red above).</span>
            )}
          </div>
          {FORM_URL && <p className="muted fallback">Prefer Google's own page? <a href={FORM_URL} target="_blank" rel="noopener noreferrer">Open the Google Form</a> (one game at a time).</p>}
        </form>
      </main>
      <Footer root="../" />
    </>
  );
}
