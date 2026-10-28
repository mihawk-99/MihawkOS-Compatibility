// SPDX-License-Identifier: GPL-3.0-or-later
// The report page: the console's details once, then one card per game. Each game is posted to the Google Form as its
// own response (src/submit.js), so the sheet, its Approved box and the list's build stay as they are.
import { useEffect, useMemo, useRef, useState } from 'react';
import data from '../data/reports.json';
import { RATINGS, CONSOLES, LAUNCHERS, VERSIONS, FIRMWARES } from './fields.js';
import { appidFrom, cleanGame, cleanGames, formBody, lookupUrl, prefill, problems, responseUrl } from './submit.js';
import { Badge, Bar, Footer, FORM_URL, Launcher, steamHeader, useNight } from './shell.jsx';
import { useT } from './i18n.jsx';
import documentDay from './assets/orbs/document-day.svg';
import documentNight from './assets/orbs/document-night.svg';
import consoleDay from './assets/orbs/ps5-day.svg';
import consoleNight from './assets/orbs/ps5-night.svg';
import gamesDay from './assets/orbs/dualsense-day.svg';
import gamesNight from './assets/orbs/dualsense-night.svg';

const POST_URL = responseUrl(FORM_URL);
const LOOKUP = lookupUrl(import.meta.env.VITE_STEAM_LOOKUP); // tools/steam-lookup.gs, if deployed
const SAVED = 'report-console'; // this device's console, firmware, version and nickname
const key = (name) => String(name ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
let nextId = 1;
// steam: the Steam game the AppID stands for ({ id, name, img }), from the list or the Steam lookup; auto: the AppID came
// from choosing a suggestion, so editing the name takes it away again.
const emptyRow = (fill = {}) => ({ id: nextId++, game: '', appid: '', launcher: '', rating: '', fps: '', settings: '', notes: '', steam: null, auto: false, ...fill });

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
  const { t } = useT();
  return (
    <label className={`field${wide ? ' wide' : ''}${error ? ' bad' : ''}`}>
      <span>{label}</span>
      {children}
      {error ? <em className="error">{t(error)}</em> : hint && <em className="hint">{hint}</em>}
    </label>
  );
}

// A row of glossy choices that behave as radio buttons (arrow keys move between them).
function Chips({ legend, name, value, onChange, options, error, hint, render, wide }) {
  const { t } = useT();
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
      {error ? <em className="error">{t(error)}</em> : hint && <em className="hint">{hint}</em>}
    </fieldset>
  );
}

async function ask(query) {
  const res = await fetch(`${LOOKUP}?${query}`);
  return res.json();
}

// Suggestions for a name: the games the list knows first, then Steam's store search through the lookup.
function useSuggestions(text, known) {
  const [remote, setRemote] = useState({ q: '', games: [] });
  const q = text.trim();
  useEffect(() => {
    if (!LOOKUP || q.length < 2) return undefined;
    const timer = setTimeout(() => {
      ask(`q=${encodeURIComponent(q)}`).then((body) => setRemote({ q, games: cleanGames(body) })).catch(() => {});
    }, 250);
    return () => clearTimeout(timer);
  }, [q]);
  return useMemo(() => {
    if (q.length < 2) return [];
    const local = [...known.byId].filter(([, name]) => key(name).includes(key(q))).slice(0, 4)
      .map(([id, name]) => ({ id, name, img: steamHeader(id, data.steam) }));
    const fromSteam = remote.q === q ? remote.games.filter((g) => !local.some((l) => l.id === g.id)) : [];
    return [...local, ...fromSteam].slice(0, 8);
  }, [q, remote, known]);
}

// The game's name, with suggestions as you type (a combobox: arrow keys, Enter, Escape).
function GameName({ row, error, known, onChange }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const list = useSuggestions(row.game, known);
  const listId = `games-${row.id}`;
  const showing = open && list.length > 0;
  const choose = (g) => {
    onChange({ ...row, game: g.name, appid: g.id, steam: g, auto: true });
    setOpen(false);
  };
  const type = (e) => {
    const game = e.target.value;
    const id = known.byName.get(key(game));
    // A name typed in full that the list knows still fills its AppID; any other edit drops a chosen one.
    if (id) onChange({ ...row, game, appid: id, steam: { id, name: known.byId.get(id), img: steamHeader(id, data.steam) }, auto: true });
    else onChange({ ...row, game, ...(row.auto ? { appid: '', steam: null, auto: false } : {}) });
    setOpen(true);
    setActive(-1);
  };
  const keys = (e) => {
    if (!showing) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((active + 1) % list.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((active - 1 + list.length) % list.length); }
    else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); choose(list[active]); }
    else if (e.key === 'Escape') setOpen(false);
  };
  return (
    <Field label={`${t('Game')} *`} error={error} hint={LOOKUP ? t('Start typing, then choose it from the list.') : undefined}>
      <div className="combo">
        <input value={row.game} onChange={type} onKeyDown={keys} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 120)}
          role="combobox" aria-expanded={showing} aria-controls={listId} aria-autocomplete="list"
          aria-activedescendant={showing && active >= 0 ? `${listId}-${active}` : undefined}
          maxLength={100} autoComplete="off" placeholder={t('Start typing its name')} />
        {showing && (
          <ul className="suggestions glass" id={listId} role="listbox">
            {list.map((g, i) => (
              <li key={g.id} id={`${listId}-${i}`} role="option" aria-selected={i === active} className={i === active ? 'on' : ''}
                onMouseDown={(e) => { e.preventDefault(); choose(g); }} onMouseEnter={() => setActive(i)}>
                <img src={g.img} alt="" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
                <span>{g.name}</span>
                <small>{g.id}</small>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Field>
  );
}

// "Is it the right game?": the AppID's Steam picture and name, and a link to check on Steam.
function SteamCheck({ row, known }) {
  const { t } = useT();
  const [failed, setFailed] = useState(null);
  const { appid, game } = row;
  if (!/^\d{1,10}$/.test(appid)) return null;
  const steam = row.steam?.id === appid ? row.steam : null;
  const name = steam?.name ?? known.byId.get(appid);
  const img = steam?.img ?? steamHeader(appid, data.steam);
  const matches = name && key(name) === key(game);
  return (
    <div className={`steam-check${matches ? ' matches' : ''}`} aria-live="polite">
      {failed !== img && <img src={img} alt="" referrerPolicy="no-referrer" onError={() => setFailed(img)} />}
      <p>
        {name
          ? (matches ? <strong className="good"><Icon name="check" /> {t('This is {0} on Steam.', name)}</strong>
            : <><strong>{t('Steam AppID {0} is {1}.', appid, name)}</strong> {t('Is that your game?')}</>)
          : failed === img ? t('No picture for {0}. Check that it is your game:', appid) : t('Is this your game?')}
        {' '}<a href={`https://store.steampowered.com/app/${appid}/`} target="_blank" rel="noopener noreferrer">{t('Open its Steam page')}</a>
      </p>
    </div>
  );
}

function GameCard({ row, index, count, errors, known, onChange, onRemove }) {
  const { t } = useT();
  const set = (field) => (e) => onChange({ ...row, [field]: e.target.value });
  const latest = useRef(row);
  latest.current = row;
  // An AppID typed or pasted by hand: ask the lookup which game it is, unless the list already knows.
  useEffect(() => {
    const id = row.appid;
    if (!LOOKUP || !/^\d{1,10}$/.test(id) || known.byId.has(id) || row.steam?.id === id) return undefined;
    const timer = setTimeout(() => {
      ask(`id=${id}`).then((body) => {
        const game = cleanGame(body, id);
        // An empty name takes Steam's; a typed one stays, and the check asks whether it is the same game.
        if (game && latest.current.appid === id) onChange({ ...latest.current, steam: game, game: latest.current.game.trim() ? latest.current.game : game.name });
      }).catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [row.appid]);
  return (
    <li className="game-row glass">
      <div className="row-head">
        <h3><span className="row-number" aria-hidden="true">{index + 1}</span>{row.game.trim() || t('Game {0}', index + 1)}</h3>
        {count > 1 && <button type="button" className="button small quiet" onClick={onRemove} aria-label={t('Remove game {0}', index + 1)}><Icon name="trash" /> {t('Remove')}</button>}
      </div>
      <div className="row-fields">
        <GameName row={row} error={errors.game} known={known} onChange={onChange} />
        <Field label="Steam AppID" error={errors.appid}
          hint={t("Used to show the game's picture on the list, so it matters even if you did not play it through Steam. Filled in when you choose the game; or type its number, or paste its Steam link.")}>
          <input value={row.appid} onChange={(e) => onChange({ ...row, appid: appidFrom(e.target.value), auto: false })} inputMode="numeric" autoComplete="off" placeholder={t('e.g. {0}', 620)} />
        </Field>
      </div>
      <SteamCheck row={row} known={known} />
      <Chips legend={`${t('How did it run?')} *`} name={`rating-${row.id}`} value={row.rating} onChange={(rating) => onChange({ ...row, rating })}
        error={errors.rating} wide hint={t(RATINGS.find((r) => r.name === row.rating)?.means ?? 'Choose the one that fits best.')}
        options={RATINGS.map((r) => ({ value: r.name }))}
        render={(o) => <Badge rating={o.value} />} />
      <Chips legend={t('Started from')} name={`launcher-${row.id}`} value={row.launcher} onChange={(launcher) => onChange({ ...row, launcher })}
        error={errors.launcher} wide hint={t("Optional. No launcher: you started the game's own program.")}
        options={[{ value: '' }, ...LAUNCHERS.map((l) => ({ value: l }))]}
        render={(o) => (o.value ? <Launcher name={o.value} /> : <span className="launcher">{t('Not saying')}</span>)} />
      <div className="row-fields">
        <Field label="FPS" error={errors.fps} hint={t('Optional, about.')}>
          <input value={row.fps} onChange={set('fps')} inputMode="numeric" maxLength={3} placeholder={t('e.g. {0}', 60)} />
        </Field>
        <Field label={t('Settings')} error={errors.settings} hint={t('Optional: 120 Hz, Game Mode, controller…')}>
          <input value={row.settings} onChange={set('settings')} maxLength={300} />
        </Field>
        <Field label={t('Notes')} error={errors.notes} hint={t('Optional: what worked and what did not.')} wide>
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
  const { t } = useT();
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
    const id = !row.appid && known.byName.get(key(row.game ?? ''));
    if (id) Object.assign(row, { appid: id, steam: { id, name: known.byId.get(id), img: steamHeader(id, data.steam) }, auto: true });
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
      <a className="skip" href="#report-form">{t('Skip to the form')}</a>
      <Bar root="../" night={night} onTheme={changeTheme} report={false}>
        <a href="../"><Icon name="list" /> {t('All games')}</a>
        <a href="../#ratings">{t('Ratings')}</a>
      </Bar>
      <main id="top">
        <section className="glass card intro" ref={top}>
          <div className="titled">
            <Orb night={night} day={documentDay} dark={documentNight} />
            <div>
              <h1>{t('Report games')}</h1>
              <p className="lead">{t('Tell other players how your games ran on MihawkOS: as many as you like, in one go. No account, no e-mail. Every report is read before it appears on the list, usually within a day.')}</p>
            </div>
          </div>
          <ol className="how-steps" aria-label={t('How it works')}>
            <li><span>1</span>{t('Your console, once')}</li>
            <li><span>2</span>{t('One card per game')}</li>
            <li><span>3</span>{t('Send them all')}</li>
          </ol>
          {status?.kind === 'done' && (
            <p className="notice good" role="status"><Icon name="check" /> {t('Thank you! Reports sent: {0}. They will appear on the list once read. Your console details are remembered on this device for next time.', status.sent)}</p>
          )}
          {status?.kind === 'failed' && (
            <p className="notice bad" role="alert">{t('{0} of {1} sent. The rest could not leave this device (no internet?). They are still below: press Send again.', status.sent, status.total)}</p>
          )}
          {!POST_URL && <p className="notice bad" role="alert">{t('The report form is not set up yet.')}</p>}
        </section>

        <form id="report-form" onSubmit={send} noValidate>
          <section className="glass card console" aria-labelledby="console-title">
            <div className="titled">
              <Orb night={night} day={consoleDay} dark={consoleNight} />
              <div>
                <h2 id="console-title">{t('Your console')}</h2>
                <p className="muted">{t('Filled in once for all your games, and remembered on this device.')}</p>
              </div>
            </div>
            <Chips legend={`${t('Console')} *`} name="console" value={shared.console} onChange={setS('console')} error={sharedErrors.console} wide
              hint={t('Digital Edition: any PS5 without a disc drive.')} options={CONSOLES.map((c) => ({ value: c, label: c }))} />
            <div className="row-fields">
              {ownFirmware ? (
                <Field label={`${t('Firmware')} *`} error={sharedErrors.firmware}
                  hint={<>{t('Like {0}.', '13.80')} <button type="button" className="link" onClick={() => { setOwnFirmware(false); setS('firmware')(''); }}>{t('Choose from the list')}</button></>}>
                  <input value={shared.firmware} onChange={(e) => setS('firmware')(e.target.value)} inputMode="decimal" maxLength={5} placeholder={t('e.g. {0}', '13.80')} autoFocus />
                </Field>
              ) : (
                <Field label={`${t('Firmware')} *`} error={sharedErrors.firmware} hint={t('Settings > System > System Software > Console Information.')}>
                  <select value={shared.firmware} onChange={(e) => (e.target.value === 'other' ? (setOwnFirmware(true), setS('firmware')('')) : setS('firmware')(e.target.value))}>
                    <option value="">{t('Choose…')}</option>
                    {FIRMWARES.map((f) => <option key={f}>{f}</option>)}
                    <option value="other">{t('Not in the list?')}</option>
                  </select>
                </Field>
              )}
              <Field label={`${t('MihawkOS version')} *`} error={sharedErrors.version} hint={t("On its wallpaper and the WebUI's Help page.")}>
                <select value={shared.version} onChange={(e) => setS('version')(e.target.value)}>
                  {VERSIONS.map((v) => <option key={v}>{v}</option>)}
                </select>
              </Field>
              <Field label={t('Nickname')} error={sharedErrors.nickname} hint={t('Optional, shown with your reports. Not your e-mail.')}>
                <input value={shared.nickname} onChange={(e) => setS('nickname')(e.target.value)} maxLength={32} autoComplete="nickname" />
              </Field>
            </div>
          </section>

          <div className="titled section-title">
            <Orb night={night} day={gamesDay} dark={gamesNight} />
            <h2>{t('Your games')} <span className="count">{rows.length}</span></h2>
          </div>
          <ul className="game-rows">
            {rows.map((row, i) => (
              <GameCard key={row.id} row={row} index={i} count={rows.length} errors={errorsOf(row)} known={known}
                onChange={(next) => setRows((all) => all.map((r) => (r.id === next.id ? next : r)))}
                onRemove={() => setRows(rows.filter((r) => r.id !== row.id))} />
            ))}
          </ul>
          <div className="form-actions glass">
            <button type="button" className="button" onClick={() => setRows([...rows, emptyRow()])}><Icon name="plus" /> {t('Add another game')}</button>
            <button type="submit" className="button primary big" disabled={!POST_URL || status?.kind === 'sending'}>
              <Icon name="send" />
              {status?.kind === 'sending' ? t('Sending {0} of {1}…', status.sent + 1, status.total) : t(rows.length === 1 ? 'Send {0} report' : 'Send {0} reports', rows.length)}
            </button>
            {showErrors && pending > 0 && <span className="error" role="alert">{t('Some fields need a look (in red above).')}</span>}
          </div>
          {FORM_URL && <p className="muted fallback">{t("Prefer Google's own page?")} <a href={FORM_URL} target="_blank" rel="noopener noreferrer">{t('Open the Google Form')}</a> {t('(one game at a time)')}</p>}
        </form>
      </main>
      <Footer root="../" />
    </>
  );
}
