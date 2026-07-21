import React, { useEffect, useState, useMemo } from 'react';
import { useGame } from './store';

export function Ending() {
  const partnerName = useGame((s) => s.partnerName);
  const playerName = useGame((s) => s.playerName);
  const date = useGame((s) => s.anniversaryDate);
  const lovePoints = useGame((s) => s.lovePoints);
  const memories = useGame((s) => s.memories);
  const photos = useGame((s) => s.photos);
  const activities = useGame((s) => s.activitiesCompleted);
  const minigamesWon = useGame((s) => s.minigamesWon);
  const foodShared = useGame((s) => s.foodShared);
  const collected = useGame((s) => s.collectedIds);

  const [stage, setStage] = useState(0); // 0 cinematic, 1 message, 2 slideshow, 3 stats, 4 letter

  useEffect(() => {
    const timings = [5500, 5500, 6500, 5500];
    if (stage >= timings.length) return;
    const t = setTimeout(() => setStage(stage + 1), timings[stage]);
    return () => clearTimeout(t);
  }, [stage]);

  return (
    <div className="ending" data-testid="ending">
      <div className={`ending-sunset ${stage >= 0 ? 'ending-active' : ''}`} />
      {stage === 0 && <CinematicScene partnerName={partnerName} playerName={playerName} />}
      {stage === 1 && (
        <div className="ending-message">
          <div className="ending-fade-in ending-happy">Happy Anniversary,</div>
          <div className="ending-fade-in ending-name">My {partnerName} ❤️</div>
          <div className="ending-date">{date}</div>
        </div>
      )}
      {stage === 2 && (
        <SlideshowStage memories={memories} />
      )}
      {stage === 3 && (
        <div className="ending-stats">
          <h2 className="ending-h2">Our Day, In Numbers</h2>
          <div className="stats-grid">
            <Stat label="Activities" value={activities} icon="🎡" />
            <Stat label="Love Points" value={lovePoints} icon="❤️" />
            <Stat label="Mini-games Won" value={minigamesWon} icon="🏆" />
            <Stat label="Food Shared" value={foodShared} icon="🍦" />
            <Stat label="Photos Taken" value={photos} icon="📸" />
            <Stat label="Hidden Found" value={collected.size} icon="🎁" />
            <Stat label="Memories" value={memories.length} icon="📖" />
          </div>
        </div>
      )}
      {stage >= 4 && <LoveLetter partnerName={partnerName} playerName={playerName} date={date} />}
      {/* Fireflies */}
      <Fireflies />
      {/* Lanterns rising */}
      <Lanterns />
      {/* Fireworks */}
      {stage >= 1 && <Fireworks />}
    </div>
  );
}

function CinematicScene({ partnerName, playerName }) {
  return (
    <div className="cinematic">
      <div className="cinematic-mountain" />
      <div className="cinematic-sun" />
      <div className="cinematic-couple">
        <div className="cin-person cin-boy">
          <div className="cin-body" style={{ background: '#3b6dc4' }} />
          <div className="cin-head" style={{ background: '#f2c9a2' }}>
            <div className="cin-hair" style={{ background: '#2a1a10' }} />
          </div>
        </div>
        <div className="cin-heart">❤️</div>
        <div className="cin-person cin-girl">
          <div className="cin-body" style={{ background: '#e07aa4' }} />
          <div className="cin-head" style={{ background: '#f7d1b4' }}>
            <div className="cin-hair cin-hair-long" style={{ background: '#3a2015' }} />
          </div>
        </div>
      </div>
      <div className="cinematic-bench" />
      <div className="cinematic-text">
        <div>{playerName} sat closer.</div>
        <div>{partnerName} rested her head on his shoulder.</div>
        <div>The world held its breath.</div>
      </div>
    </div>
  );
}

function SlideshowStage({ memories }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => x + 1), 1600);
    return () => clearInterval(t);
  }, []);
  const shown = memories.slice(0, Math.min(memories.length, i + 1));
  return (
    <div className="slideshow">
      <h2 className="ending-h2">Everything we did today</h2>
      <div className="slideshow-track">
        {shown.map((m, idx) => (
          <div key={m.id} className={`slide ${idx === shown.length - 1 ? 'slide-latest' : ''}`}>
            <div className="slide-emoji">{m.emoji || '❤️'}</div>
            <div className="slide-title">{m.title}</div>
            <div className="slide-loc">{m.location}</div>
          </div>
        ))}
        {memories.length === 0 && <div className="slide-empty">Some memories were quiet. Those matter too.</div>}
      </div>
    </div>
  );
}

function Stat({ label, value, icon }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function LoveLetter({ partnerName, playerName, date }) {
  return (
    <div className="love-letter" data-testid="love-letter">
      <div className="letter-paper">
        <h2>My dearest {partnerName},</h2>
        <p>
          If I could keep any day, I would keep this one. The whole park in golden light,
          the little rides, the too-sweet cotton candy, your laugh next to mine at the top of the hill.
        </p>
        <p>
          Thank you for being the person I want to walk beside — through amusement parks
          and through everything else. Every heart we collected today was already yours.
        </p>
        <p>
          Happy anniversary, my love. Here's to every sunset after this one.
        </p>
        <p className="letter-sign">— {playerName}</p>
        <p className="letter-date">{date}</p>
      </div>
      <button className="mg-btn" onClick={() => window.location.reload()} data-testid="play-again-btn">
        Play our day again ❤️
      </button>
    </div>
  );
}

function Fireflies() {
  const flies = useMemo(() => Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: 30 + Math.random() * 60,
    d: Math.random() * 6,
  })), []);
  return (
    <div className="fireflies">
      {flies.map((f) => (
        <div key={f.id} className="firefly" style={{ left: `${f.x}%`, top: `${f.y}%`, animationDelay: `${f.d}s` }} />
      ))}
    </div>
  );
}

function Lanterns() {
  const lanterns = useMemo(() => Array.from({ length: 14 }, (_, i) => ({
    id: i,
    x: 5 + Math.random() * 90,
    d: Math.random() * 8,
    dur: 14 + Math.random() * 10,
  })), []);
  return (
    <div className="lanterns">
      {lanterns.map((l) => (
        <div key={l.id} className="lantern-item" style={{ left: `${l.x}%`, animationDelay: `${l.d}s`, animationDuration: `${l.dur}s` }} />
      ))}
    </div>
  );
}

function Fireworks() {
  const bursts = useMemo(() => Array.from({ length: 8 }, (_, i) => ({
    id: i,
    x: 10 + Math.random() * 80,
    y: 10 + Math.random() * 40,
    d: Math.random() * 6,
    color: ['#ffd166', '#ef476f', '#c084fc', '#7dcfb6', '#ff9ac1'][i % 5],
  })), []);
  return (
    <div className="fireworks">
      {bursts.map((b) => (
        <div key={b.id} className="firework" style={{
          left: `${b.x}%`, top: `${b.y}%`, animationDelay: `${b.d}s`, background: `radial-gradient(circle, ${b.color} 0%, transparent 60%)`
        }} />
      ))}
    </div>
  );
}
