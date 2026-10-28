// SPDX-License-Identifier: GPL-3.0-or-later
// The pages' words in MihawkOS's WebUI languages, keyed by the English (src/i18n-text.js), as the WebUI does: t('Games'),
// t('{0} games', 6). The choice is remembered on the device (the WebUI's own key); a first visit follows the browser.
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import TEXT from './i18n-text.js';

export const LANGUAGES = [
  { tag: 'en-US', name: 'English (US)', flag: 'us' },
  { tag: 'fr-FR', name: 'Français', flag: 'fr' },
  { tag: 'es-ES', name: 'Español', flag: 'es' },
  { tag: 'de-DE', name: 'Deutsch', flag: 'de' },
  { tag: 'it-IT', name: 'Italiano', flag: 'it' },
  { tag: 'ru-RU', name: 'Русский', flag: 'ru' },
  { tag: 'zh-CN', name: '简体中文', flag: 'cn' },
  { tag: 'ja-JP', name: '日本語', flag: 'jp' },
  { tag: 'pt-BR', name: 'Português (Brasil)', flag: 'br' },
  { tag: 'pl-PL', name: 'Polski', flag: 'pl' },
];
const STORED = 'mihawk-language';

export function pickLanguage(stored, browser) {
  if (LANGUAGES.some((l) => l.tag === stored)) return stored;
  for (const want of browser ?? []) {
    const exact = LANGUAGES.find((l) => l.tag.toLowerCase() === String(want).toLowerCase());
    const same = LANGUAGES.find((l) => l.tag.split('-')[0] === String(want).split('-')[0].toLowerCase());
    if (exact || same) return (exact ?? same).tag;
  }
  return 'en-US';
}

export const translate = (lang) => (text, ...values) =>
  String(TEXT[lang]?.[text] ?? text).replace(/\{(\d)\}/g, (_, i) => values[i]);

const Language = createContext({ lang: 'en-US', t: translate('en-US'), setLang: () => {} });

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    let stored = '';
    try { stored = localStorage.getItem(STORED) ?? ''; } catch { /* storage blocked */ }
    return pickLanguage(stored, navigator.languages);
  });
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  const value = useMemo(() => ({
    lang,
    t: translate(lang),
    setLang: (tag) => {
      try { localStorage.setItem(STORED, tag); } catch { /* this visit only */ }
      setLangState(tag);
    },
  }), [lang]);
  return <Language.Provider value={value}>{children}</Language.Provider>;
}

export const useT = () => useContext(Language);

// The WebUI's picker: the current language's flag in the header, every language in its own words under it.
export function LanguagePicker({ root }) {
  const { lang, setLang, t } = useT();
  const [open, setOpen] = useState(false);
  const current = LANGUAGES.find((l) => l.tag === lang) ?? LANGUAGES[0];
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (e.type === 'keydown' ? e.key === 'Escape' : !e.target.closest('.language')) setOpen(false); };
    document.addEventListener('click', close);
    document.addEventListener('keydown', close);
    return () => { document.removeEventListener('click', close); document.removeEventListener('keydown', close); };
  }, [open]);
  return (
    <div className="language">
      <button type="button" className="language-button" aria-haspopup="true" aria-expanded={open} aria-label={t('Language')}
        onClick={() => setOpen(!open)}>
        <img src={`${root}flags/${current.flag}.svg`} alt="" width="28" height="21" /><span className="chevron" aria-hidden="true" />
      </button>
      {open && (
        <div className="language-list glass">
          {LANGUAGES.map((l) => (
            <button key={l.tag} type="button" lang={l.tag} className={l.tag === lang ? 'on' : ''} autoFocus={l.tag === lang}
              onClick={() => { setLang(l.tag); setOpen(false); }}>
              <img src={`${root}flags/${l.flag}.svg`} alt="" width="28" height="21" /><span>{l.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
