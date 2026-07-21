import React, { useState } from 'react';
import { useGame } from './store';
import { timeLabel } from './utils';
import { setMuted } from './audio';
export function StartScreen() {
  const start = useGame((s) => s.start);
  const partnerName = useGame((s) => s.partnerName);
  const playerName = useGame((s) => s.playerName);
  return (
    <div className="start-screen" data-testid="start-screen">
      <div className="start-vignette" />
      <div className="start-content">
        <div className="start-badge">A little world made with love</div>
        <h1 className="start-title">
          <span className="start-line">Our</span>
          <span className="start-line start-title-accent">Anniversary Day</span>
        </h1>
        <p className="start-sub">
          For <b>{partnerName}</b>, from <b>{playerName}</b> · 26/07/26
        </p>
        <p className="start-blurb">
          A tiny amusement park somewhere between memory and daydream.
          Wander together, play little games, share food, collect love,
          and unlock the ropeway to watch the sunset from the top of the mountain.
        </p>
        <div className="start-controls">
          <div><kbd>W A S D</kbd> Move</div>
          <div><kbd>Shift</kbd> Run</div>
          <div><kbd>E</kbd> Interact</div>
          <div><kbd>J</kbd> Journal</div>
          <div><kbd>Space</kbd> Selfie</div>
        </div>
        <button className="start-btn" onClick={start} data-testid="start-btn">
          Enter the Park ❤️
        </button>
        <p className="start-hint">Tip: earn 500 ❤️ to unlock the ropeway to the summit.</p>
      </div>
    </div>
  );
}

export function HUD() {
  const lovePoints = useGame((s) => s.lovePoints);
  const timeOfDay = useGame((s) => s.timeOfDay);
  const toggleScrapbook = useGame((s) => s.toggleScrapbook);
  const memories = useGame((s) => s.memories);
  const photos = useGame((s) => s.photos);
  const ropewayUnlocked = useGame((s) => s.ropewayUnlocked);
  const registerPhoto = useGame((s) => s.registerPhoto);
  const addLove = useGame((s) => s.addLove);
  const [flashOn, setFlashOn] = useState(false);

  React.useEffect(() => {
    const h = (e) => {
      if (e.key.toLowerCase() === 'j') toggleScrapbook();
      if (e.key === ' ') {
        // selfie
        setFlashOn(true);
        setTimeout(() => setFlashOn(false), 250);
        registerPhoto();
        addLove(5, 'Selfie ✨');
      }
      // Debug: '=' to add love, ']' to jump to summit, "'" to trigger ending
      if (e.key === '=') addLove(100, 'Bonus love');
      if (e.key === ']') {
        useGame.setState({ ropewayUnlocked: true, atSummit: true, onRopeway: false, timeOfDay: 0.82 });
      }
      if (e.key === "'") useGame.getState().triggerEnding();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [toggleScrapbook, registerPhoto, addLove]);

  const progress = Math.min(1, lovePoints / 500);

  return (
    <>
      {flashOn && <div className="camera-flash" />}
      <div className="hud-top">
        <div className="hud-love" data-testid="hud-love">
          <span className="hud-love-heart">❤️</span>
          <span className="hud-love-value">{lovePoints}</span>
          <span className="hud-love-label">Love Points</span>
        </div>
        <div className="hud-center">
          <div className="hud-time">{timeLabel(timeOfDay)}</div>
          <div className="hud-progress">
            <div className="hud-progress-fill" style={{ width: `${progress * 100}%` }} />
            <div className="hud-progress-label">
              {ropewayUnlocked ? '🎫 Ropeway Unlocked' : `${lovePoints}/500 to unlock ropeway`}
            </div>
          </div>
        </div>
        <div className="hud-right">
          <button className="hud-btn" onClick={toggleScrapbook} data-testid="hud-journal-btn">
            📖 Journal <span className="hud-badge">{memories.length}</span>
          </button>
          <div className="hud-photos">📸 {photos}</div>
          <MuteButton />
        </div>
      </div>
    </>
  );
}

export function InteractPrompt() {
  const nearby = useGame((s) => s.nearbyInteraction);
  const toast = useGame((s) => s.toast);
  return (
    <>
      {nearby && (
        <div className="interact-prompt" data-testid="interact-prompt">
          <kbd>E</kbd> {nearby.label}
        </div>
      )}
      {toast && (
        <div className="game-toast" key={toast.ts} data-testid="game-toast">{toast.msg}</div>
      )}
    </>
  );
}

export function Scrapbook() {
  const show = useGame((s) => s.showScrapbook);
  const toggleScrapbook = useGame((s) => s.toggleScrapbook);
  const memories = useGame((s) => s.memories);
  if (!show) return null;
  return (
    <div className="scrapbook-backdrop" onClick={toggleScrapbook}>
      <div className="scrapbook" onClick={(e) => e.stopPropagation()} data-testid="scrapbook">
        <div className="scrapbook-head">
          <h2>Our Memory Journal</h2>
          <button className="mg-close" onClick={toggleScrapbook} data-testid="scrapbook-close">✕</button>
        </div>
        {memories.length === 0 ? (
          <p className="scrapbook-empty">The pages are still blank — go make memories together ❤️</p>
        ) : (
          <div className="scrapbook-grid">
            {memories.map((m) => (
              <div className="memory-card" key={m.id}>
                <div className="memory-emoji">{m.emoji || '❤️'}</div>
                <div className="memory-title">{m.title}</div>
                <div className="memory-loc">{m.location}</div>
                <div className="memory-desc">{m.description}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MuteButton() {
  const [muted, setLocalMuted] = React.useState(false);
  return (
    <button
      className="hud-btn"
      data-testid="hud-mute-btn"
      onClick={() => { const n = !muted; setLocalMuted(n); setMuted(n); }}
      title={muted ? 'Unmute music' : 'Mute music'}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  );
}
