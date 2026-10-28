// SPDX-License-Identifier: GPL-3.0-or-later
// The header's music button: MihawkOS's own three Frutiger Aero pieces (NOTICE.md), one after another, round and round;
// once one has started, the piece's name and a next-piece button sit beside it.
// Nothing is fetched until the visitor presses play: one piece at a time, about 1 MB each as Opus (AAC where a browser
// has no Opus). Left playing, the next page of the same tab carries on from the same piece and second, when the
// browser lets a page start sound by itself; otherwise one press resumes it there.
import { useEffect, useRef, useState } from 'react';
import { useT } from './i18n.jsx';
import bubbleGardenWebm from './assets/music/bubble-garden.webm';
import bubbleGardenM4a from './assets/music/bubble-garden.m4a';
import glassMeadowWebm from './assets/music/glass-meadow.webm';
import glassMeadowM4a from './assets/music/glass-meadow.m4a';
import skyLoungeWebm from './assets/music/sky-lounge.webm';
import skyLoungeM4a from './assets/music/sky-lounge.m4a';

const TRACKS = [
  { title: 'Bubble Garden', opus: bubbleGardenWebm, aac: bubbleGardenM4a },
  { title: 'Glass Meadow', opus: glassMeadowWebm, aac: glassMeadowM4a },
  { title: 'Sky Lounge', opus: skyLoungeWebm, aac: skyLoungeM4a },
];
const STORED = 'mihawk-music'; // { playing, track, time }, this tab only
const OPUS = typeof Audio !== 'undefined' && new Audio().canPlayType('audio/webm; codecs="opus"') !== '';

function saved() {
  try {
    const s = JSON.parse(sessionStorage.getItem(STORED)) ?? {};
    return { playing: s.playing === true, track: TRACKS[s.track] ? s.track : 0, time: Number.isFinite(s.time) ? s.time : 0 };
  } catch { return { playing: false, track: 0, time: 0 }; }
}

export function MusicButton() {
  const { t } = useT();
  const player = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [track, setTrack] = useState(null);

  const start = (i, at = 0) => {
    let a = player.current;
    if (!a) {
      a = player.current = new Audio();
      a.volume = 0.6;
      a.addEventListener('play', () => setPlaying(true));
      a.addEventListener('pause', () => setPlaying(false));
      a.addEventListener('ended', () => start((Number(a.dataset.track) + 1) % TRACKS.length).catch(() => {}));
    }
    a.dataset.track = i;
    a.src = `${OPUS ? TRACKS[i].opus : TRACKS[i].aac}${at > 0 ? `#t=${at.toFixed(1)}` : ''}`;
    setTrack(i);
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({ title: TRACKS[i].title, artist: 'MihawkOS' });
      navigator.mediaSession.setActionHandler('nexttrack', () => start((i + 1) % TRACKS.length).catch(() => {}));
    }
    return a.play();
  };

  const toggle = () => {
    const a = player.current;
    if (!a) { const s = saved(); start(s.track, s.time).catch(() => {}); }
    else if (a.paused) a.play().catch(() => {});
    else a.pause();
  };

  useEffect(() => {
    const s = saved();
    if (s.playing) start(s.track, s.time).catch(() => { /* the browser waits for a press */ });
    const leave = () => {
      const a = player.current;
      if (!a) return;
      try { sessionStorage.setItem(STORED, JSON.stringify({ playing: !a.paused, track: Number(a.dataset.track), time: a.currentTime })); } catch { /* not carried over */ }
    };
    addEventListener('pagehide', leave);
    return () => { removeEventListener('pagehide', leave); player.current?.pause(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- once per page

  const next = () => start(((track ?? -1) + 1) % TRACKS.length).catch(() => {});
  const label = playing ? t('Pause music') : t('Play music');
  return (
    <div className={`music${track === null ? '' : ' open'}`}>
      <button type="button" className={`music-button${playing ? ' playing' : ''}`} aria-pressed={playing} aria-label={label}
        title={label} onClick={toggle}>
        {playing
          ? <span className="eq" aria-hidden="true"><i /><i /><i /></span>
          : <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 17.5V6.2l10-2.2v11.3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><ellipse cx="6.6" cy="17.6" rx="2.6" ry="2.1" fill="currentColor" /><ellipse cx="16.6" cy="15.4" rx="2.6" ry="2.1" fill="currentColor" /></svg>}
      </button>
      {track !== null && <span className="music-title" aria-live="polite">{TRACKS[track].title}</span>}
      {track !== null && (
        <button type="button" className="music-next" aria-label={`${t('Next song')}: ${TRACKS[(track + 1) % TRACKS.length].title}`}
          title={`${t('Next song')}: ${TRACKS[(track + 1) % TRACKS.length].title}`} onClick={next}>
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 6.5v11l8.5-5.5Z" fill="currentColor" /><path d="M13 6.5v11l8.5-5.5Z" fill="currentColor" /></svg>
        </button>
      )}
    </div>
  );
}
