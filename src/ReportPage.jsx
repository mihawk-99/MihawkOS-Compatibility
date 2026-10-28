// SPDX-License-Identifier: GPL-3.0-or-later
// The report page: the console's details once, then one card per game. Each game is posted to the Google Form as its
// own response (src/submit.js), so the sheet, its Approved box and the list's build stay as they are.
import { useMemo, useRef, useState } from 'react';
import data from '../data/reports.json';
import { RATINGS, CONSOLES, LAUNCHERS, VERSIONS, FIRMWARES } from './fields.js';
import { appidFrom, formBody, prefill, problems, responseUrl } from './submit.js';
import { Bar, Footer, FORM_URL, Launcher, steamHeader, useNight } from './shell.jsx';
import documentDay from './assets/orbs/document-day.svg';
import documentNight from './assets/orbs/document-night.svg';
import consoleDay from './assets/orbs/this-pc-day.svg';
import consoleNight from './assets/orbs/this-pc-night.svg';
import gamesDay from './assets/orbs/games-day.svg';
import gamesNight from './assets/orbs/games-night.svg';

const POST_URL = responseUrl(FORM_URL);
const SAVED = 'report-console'; // this device's console, firmware, version and nickname
const key = (name) => String(name ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const slug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
let nextId = 1;
const emptyRow = (fill = {}) => ({ id: nextId++, game: '', appid: '', launcher: '', rating: '', fps: '', settings: '', notes: '', ...fill });

// Small line icons for the buttons, drawn here (GPL-3.0-or-later like the page).
const ICONS = {
  plus: 'M12 5v14M5 12h14',
  send: 'M4 12 20 4l-5 16-3.5-6.5L4 12Zm7.5 1.5L20 4',
  trash: 'M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12M10 11v5M14 11v5',
  check: 'M5 12.5 10 17 19 7',
  list: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
};
const Icon = ({ name }) => (
  <svg className="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d={ICONS[name]} /></svg>
);

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

// A row of glossy choices that behave as radio buttons (arrow keys move between them).
function Chips({ legend, name, value, onChange, options, error, hint, render, wide }) {
  return (
    <fieldset className={`field chips${wide ? ' wide' : ''}${error ? ' bad' : ''}`}>
      <legend>{legend}</legend>
      <div className="chip-row">
        {options.map((o) => (
          <label key={o.value} className={`chip${value === o.value ? ' on' : ''}`}>
            <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} />
            {render ? render(o) : o.label}
          </label>
        ))}
      </div>
      {error ? <em className="error">{error}</em> : hint && <em className="hint">{hint}</em>}
    </fieldset>
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
    <div className={`steam-check${matches ? ' matches' : ''}`} aria-live="polite">
      {!failed && <img src={steamHeader(appid, data.steam)} alt="" referrerPolicy="no-referrer"
        onLoad={() => setState({ id: appid, ok: true })} onError={() => setState({ id: appid, ok: false })} />}
      <p>
        {name
          ? (matches ? <strong className="good"><Icon name="check" /> This is {name} on Steam.</strong>
            : <><strong>Steam AppID {appid} is {name}.</strong> Is that your game?</>)
          : failed ? <>No picture for {appid}. Check that it is your game:</> : <>Is this your game?</>}
        {' '}<a href={`https://store.steampowered.com/app/${appid}/`} target="_blank" rel="noopener noreferrer">Open its Steam page</a>
      </p>
    </div>
  );
}

function GameCard({ row, index, count, errors, known, onChange, onRemove }) {
  const set = (field) => (e) => onChange({ ...row, [field]: e.target.value });
  const setGame = (e) => {
    const game = e.target.value;
    const id = known.byName.get(key(game)); // a game the list knows fills its AppID in, unless one was typed
    onChange({ ...row, game, appid: row.appid || id || '' });
  };
  return (
    <li className="game-row glass">
      <div className="row-head">
        <h3><span className="row-number" aria-hidden="true">{index + 1}</span>{row.game.trim() || `Game ${index + 1}`}</h3>
        {count > 1 && <button type="button" className="button small quiet" onClick={onRemove} aria-label={`Remove game ${index + 1}`}><Icon name="trash" /> Remove</button>}
      </div>
      <div className="row-fields">
        <Field label="Game *" error={errors.game}>
          <input value={row.game} onChange={setGame} list="known-games" maxLength={100} autoComplete="off" placeholder="Start typing its name" />
        </Field>
        <Field label="Steam AppID" error={errors.appid} hint="Optional. Its number, or paste its Steam link.">
          <input value={row.appid} onChange={(e) => onChange({ ...row, appid: appidFrom(e.target.value) })} inputMode="numeric" autoComplete="off" placeholder="e.g. 620" />
        </Field>
      </div>
      <SteamCheck appid={row.appid} game={row.game} known={known} />
      <Chips legend="How did it run? *" name={`rating-${row.id}`} value={row.rating} onChange={(rating) => onChange({ ...row, rating })}
        error={errors.rating} wide hint={RATINGS.find((r) => r.name === row.rating)?.means ?? 'Choose the one that fits best.'}
        options={RATINGS.map((r) => ({ value: r.name }))}
        render={(o) => <span className={`badge rating-${slug(o.value)}`}>{o.value}</span>} />
      <Chips legend="Started from" name={`launcher-${row.id}`} value={row.launcher} onChange={(launcher) => onChange({ ...row, launcher })}
        error={errors.launcher} wide hint="Optional. None: you started the game's own program."
        options={[{ value: '' }, ...LAUNCHERS.map((l) => ({ value: l }))]}
        render={(o) => (o.value ? <Launcher name={o.value} /> : <span className="launcher">Not saying</span>)} />
      <div className="row-fields">
        <Field label="FPS" error={errors.fps} hint="Optional, about.">
          <input value={row.fps} onChange={set('fps')} inputMode="numeric" maxLength={3} placeholder="e.g. 60" />
        </Field>
        <Field label="Settings" error={errors.settings} hint="Optional: 120 Hz, Game Mode, controller…">
          <input value={row.settings} onChange={set('settings')} maxLength={300} />
        </Field>
        <Field label="Notes" error={errors.notes} hint="Optional: what worked and what did not." wide>
          <textarea value={row.notes} onChange={set('notes')} maxLength={1000} rows={2} />
        </Field>
      </div>
    </li>
  );
}

function Orb({ night, day, dark }) {
  return <img className="orb" src={night ? dark : day} alt="" width="44" height="44" />;
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
  // The firmware is a list; "Not in the list?" turns it into a field for a newer one.
  const [ownFirmware, setOwnFirmware] = useState(() => Boolean(shared.firmware) && !FIRMWARES.includes(shared.firmware));
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
  const setS = (field) => (value) => setShared({ ...shared, [field]: value });
  const pending = rows.filter((r) => Object.keys(problems(shared, r)).length).length;

  async function send(e) {
    e.preventDefault();
    setShowErrors(true);
    if (pending) {
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
        <a href="../"><Icon name="list" /> All games</a>
        <a href="../#ratings">Ratings</a>
      </Bar>
      <main id="top">
        <section className="glass card intro" ref={top}>
          <div className="titled">
            <Orb night={night} day={documentDay} dark={documentNight} />
            <div>
              <h1>Report games</h1>
              <p className="lead">Tell other players how your games ran on MihawkOS: as many as you like, in one go. No account, no
                e-mail. Every report is read before it appears on the list, usually within a day.</p>
            </div>
          </div>
          <ol className="how-steps" aria-label="How it works">
            <li><span>1</span>Your console, once</li>
            <li><span>2</span>One card per game</li>
            <li><span>3</span>Send them all</li>
          </ol>
          {status?.kind === 'done' && (
            <p className="notice good" role="status"><Icon name="check" /> Thank you! {status.sent} {status.sent === 1 ? 'report' : 'reports'} sent.
              They will appear on the list once read. Your console details are remembered on this device for next time.</p>
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
            <div className="titled">
              <Orb night={night} day={consoleDay} dark={consoleNight} />
              <div>
                <h2 id="console-title">Your console</h2>
                <p className="muted">Filled in once for all your games, and remembered on this device.</p>
              </div>
            </div>
            <Chips legend="Console *" name="console" value={shared.console} onChange={setS('console')} error={sharedErrors.console} wide
              hint="Digital Edition: any PS5 without a disc drive." options={CONSOLES.map((c) => ({ value: c, label: c }))} />
            <div className="row-fields">
              {ownFirmware ? (
                <Field label="Firmware *" error={sharedErrors.firmware}
                  hint={<>Like 13.80. <button type="button" className="link" onClick={() => { setOwnFirmware(false); setS('firmware')(''); }}>Choose from the list</button></>}>
                  <input value={shared.firmware} onChange={(e) => setS('firmware')(e.target.value)} inputMode="decimal" maxLength={5} placeholder="e.g. 13.80" autoFocus />
                </Field>
              ) : (
                <Field label="Firmware *" error={sharedErrors.firmware} hint="Settings > System > System Software > Console Information.">
                  <select value={shared.firmware} onChange={(e) => (e.target.value === 'other' ? (setOwnFirmware(true), setS('firmware')('')) : setS('firmware')(e.target.value))}>
                    <option value="">Choose…</option>
                    {FIRMWARES.map((f) => <option key={f}>{f}</option>)}
                    <option value="other">Not in the list?</option>
                  </select>
                </Field>
              )}
              <Field label="MihawkOS version *" error={sharedErrors.version} hint="On its wallpaper and the WebUI's Help page.">
                <select value={shared.version} onChange={(e) => setS('version')(e.target.value)}>
                  {VERSIONS.map((v) => <option key={v}>{v}</option>)}
                </select>
              </Field>
              <Field label="Nickname" error={sharedErrors.nickname} hint="Optional, shown with your reports. Not your e-mail.">
                <input value={shared.nickname} onChange={(e) => setS('nickname')(e.target.value)} maxLength={32} autoComplete="nickname" />
              </Field>
            </div>
          </section>

          <div className="titled section-title">
            <Orb night={night} day={gamesDay} dark={gamesNight} />
            <h2>Your games <span className="count">{rows.length}</span></h2>
          </div>
          <ul className="game-rows">
            {rows.map((row, i) => (
              <GameCard key={row.id} row={row} index={i} count={rows.length} errors={errorsOf(row)} known={known}
                onChange={(next) => setRows(rows.map((r) => (r.id === row.id ? next : r)))}
                onRemove={() => setRows(rows.filter((r) => r.id !== row.id))} />
            ))}
          </ul>
          <div className="form-actions glass">
            <button type="button" className="button" onClick={() => setRows([...rows, emptyRow()])}><Icon name="plus" /> Add another game</button>
            <button type="submit" className="button primary big" disabled={!POST_URL || status?.kind === 'sending'}>
              <Icon name="send" />
              {status?.kind === 'sending' ? `Sending ${status.sent + 1} of ${status.total}…` : `Send ${rows.length} ${rows.length === 1 ? 'report' : 'reports'}`}
            </button>
            {showErrors && pending > 0 && <span className="error" role="alert">Some fields need a look (in red above).</span>}
          </div>
          {FORM_URL && <p className="muted fallback">Prefer Google's own page? <a href={FORM_URL} target="_blank" rel="noopener noreferrer">Open the Google Form</a> (one game at a time).</p>}
        </form>
      </main>
      <Footer root="../" />
    </>
  );
}
