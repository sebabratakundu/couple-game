import React, { useState, useEffect, useRef } from 'react';
import { useGame } from './store';

export function MinigameHost() {
  const active = useGame((s) => s.activeMinigame);
  const setActive = useGame((s) => s.setActiveMinigame);
  if (!active) return null;
  return (
    <div className="mg-backdrop">
      <div className="mg-panel">
        <button className="mg-close" onClick={() => setActive(null)} data-testid="minigame-close">✕</button>
        {active === 'ringtoss' && <RingToss onDone={() => setActive(null)} />}
        {active === 'shooting' && <ShootingGallery onDone={() => setActive(null)} />}
        {active === 'dance' && <DanceMachine onDone={() => setActive(null)} />}
        {active === 'bowling' && <Bowling onDone={() => setActive(null)} />}
      </div>
    </div>
  );
}

/* ---------- BOWLING ---------- */
function Bowling({ onDone }) {
  const [score, setScore] = useState(0);
  const [throwsLeft, setThrowsLeft] = useState(5);
  const [pins, setPins] = useState(() => makePins());
  const [ball, setBall] = useState(null); // {x, y, vx, vy}
  const [aim, setAim] = useState(240); // horizontal ball start x
  const [msg, setMsg] = useState('Move with A/D · Space to throw');
  const [rolling, setRolling] = useState(false);
  const finalized = useRef(false);
  const addLove = useGame((s) => s.addLove);
  const addMemory = useGame((s) => s.addMemory);
  const registerMinigameWin = useGame((s) => s.registerMinigameWin);

  function makePins() {
    const arr = [];
    // Triangular arrangement
    const rows = 4;
    let id = 0;
    for (let r = 0; r < rows; r++) {
      for (let i = 0; i <= r; i++) {
        arr.push({
          id: id++,
          x: 240 + (i - r / 2) * 28,
          y: 60 + r * 24,
          down: false,
        });
      }
    }
    return arr;
  }

  // Handle input
  useEffect(() => {
    function handler(e) {
      if (rolling || throwsLeft === 0) return;
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') setAim((x) => Math.max(80, x - 12));
      if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') setAim((x) => Math.min(400, x + 12));
      if (e.key === ' ') {
        e.preventDefault();
        throwBall();
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [aim, rolling, throwsLeft]);

  function throwBall() {
    if (rolling || throwsLeft === 0) return;
    setRolling(true);
    setBall({ x: aim, y: 280, vy: -6, vx: 0 });
    setThrowsLeft((t) => t - 1);
  }

  // Ball animation
  useEffect(() => {
    if (!ball) return;
    let raf;
    let b = { ...ball };
    function step() {
      b = { ...b, x: b.x + b.vx, y: b.y + b.vy };
      // Collide with pins
      setPins((prev) => {
        return prev.map((p) => {
          if (p.down) return p;
          const dx = p.x - b.x;
          const dy = p.y - b.y;
          if (Math.hypot(dx, dy) < 18) {
            b.vx += -dx * 0.08;
            b.vy += -dy * 0.03;
            setScore((s) => s + 10);
            return { ...p, down: true };
          }
          return p;
        });
      });
      setBall({ ...b });
      if (b.y < -20 || b.x < 40 || b.x > 460) {
        setRolling(false);
        setBall(null);
        return;
      }
      raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [ball && ball.y === 280 ? ball.x : null]); // start only

  // Reset pins if all down and rolls left
  useEffect(() => {
    if (pins.every((p) => p.down) && throwsLeft > 0 && !rolling) {
      setMsg('STRIKE! ✨ Fresh rack incoming...');
      const t = setTimeout(() => {
        setPins(makePins());
        setMsg('Move with A/D · Space to throw');
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [pins, throwsLeft, rolling]);

  useEffect(() => {
    if (throwsLeft === 0 && !rolling && !finalized.current) {
      finalized.current = true;
      addLove(score, 'Bowling');
      if (score >= 60) {
        registerMinigameWin();
        addMemory({
          id: 'won_bowling', title: 'Won Bowling', location: 'Bowling Alley',
          description: 'You told her it was luck. She knew better.', emoji: '🎳',
        });
      }
    }
  }, [throwsLeft, rolling, score, addLove, addMemory, registerMinigameWin]);

  return (
    <div className="mg-content">
      <h2 className="mg-title">Bowling 🎳</h2>
      <div className="mg-sub">Throws: {throwsLeft} · Score: {score} ❤️</div>
      <div className="mg-message">{msg}</div>
      <div className="mg-board" style={{ background: 'linear-gradient(180deg, #f5e2c0 0%, #d9c39b 100%)', overflow: 'hidden' }}>
        {/* Lane */}
        <div style={{ position: 'absolute', left: 100, top: 40, width: 280, height: 260, background: 'linear-gradient(180deg, #e2c48a, #b58a4d)', borderRadius: 12 }} />
        {/* Pins */}
        {pins.map((p) => (
          <div key={p.id} className={`bowling-pin ${p.down ? 'bowling-pin-down' : ''}`} style={{ left: p.x, top: p.y }} />
        ))}
        {/* Ball */}
        {ball && (
          <div className="bowling-ball" style={{ left: ball.x, top: ball.y }} />
        )}
        {/* Aim indicator */}
        {!rolling && throwsLeft > 0 && (
          <div className="bowling-aim" style={{ left: aim }} />
        )}
      </div>
      {throwsLeft === 0 && !rolling && (
        <button className="mg-btn" onClick={onDone} data-testid="bowling-finish">Finish · Earned {score} ❤️</button>
      )}
    </div>
  );
}

/* ---------- RING TOSS ---------- */
function RingToss({ onDone }) {
  const [score, setScore] = useState(0);
  const [rings, setRings] = useState(5);
  const [pegs, setPegs] = useState(() => makePegs());
  const [msg, setMsg] = useState('Click a peg to toss your ring!');
  const addLove = useGame((s) => s.addLove);
  const addMemory = useGame((s) => s.addMemory);
  const registerMinigameWin = useGame((s) => s.registerMinigameWin);
  const finalized = useRef(false);

  function makePegs() {
    return Array.from({ length: 6 }).map((_, i) => ({
      id: i,
      x: 60 + Math.random() * 380,
      y: 90 + Math.random() * 180,
      hit: false,
      value: 10 + Math.floor(Math.random() * 3) * 10,
    }));
  }

  function toss(pegId) {
    if (rings <= 0) return;
    const success = Math.random() < 0.55;
    setRings((r) => r - 1);
    if (success) {
      setPegs((ps) => ps.map((p) => (p.id === pegId ? { ...p, hit: true } : p)));
      const peg = pegs.find((p) => p.id === pegId);
      setScore((s) => s + peg.value);
      setMsg(`+${peg.value} ❤️ Bullseye!`);
    } else {
      setMsg('So close! Try again 💫');
    }
  }

  useEffect(() => {
    if (rings === 0 && !finalized.current) {
      finalized.current = true;
      addLove(score, 'Ring Toss winnings');
      if (score >= 30) {
        registerMinigameWin();
        addMemory({
          id: 'won_ringtoss', title: 'Won Ring Toss', location: 'Carnival',
          description: 'You aimed with your heart. It landed perfectly.', emoji: '🎯',
        });
      }
    }
  }, [rings, score, addLove, addMemory, registerMinigameWin]);

  return (
    <div className="mg-content">
      <h2 className="mg-title">Ring Toss 🎯</h2>
      <div className="mg-sub">Rings: {rings} · Score: {score} ❤️</div>
      <div className="mg-message">{msg}</div>
      <div className="mg-board" style={{ background: 'radial-gradient(ellipse at center, #ffe1e9 0%, #ffd4b5 100%)' }}>
        {pegs.map((p) => (
          <button
            key={p.id}
            className={`ring-peg ${p.hit ? 'ring-peg-hit' : ''}`}
            style={{ left: p.x, top: p.y }}
            disabled={rings === 0 || p.hit}
            onClick={() => toss(p.id)}
            data-testid={`ringtoss-peg-${p.id}`}
          >
            {p.hit ? '💍' : p.value}
          </button>
        ))}
      </div>
      {rings === 0 && (
        <button className="mg-btn" onClick={onDone} data-testid="ringtoss-finish">Finish · Earned {score} ❤️</button>
      )}
    </div>
  );
}

/* ---------- SHOOTING GALLERY ---------- */
function ShootingGallery({ onDone }) {
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(20);
  const [targets, setTargets] = useState(() => spawn(6));
  const addLove = useGame((s) => s.addLove);
  const addMemory = useGame((s) => s.addMemory);
  const registerMinigameWin = useGame((s) => s.registerMinigameWin);
  const finalized = useRef(false);

  function spawn(n) {
    return Array.from({ length: n }).map((_, i) => ({
      id: `${Date.now()}-${i}-${Math.random()}`,
      x: 30 + Math.random() * 380,
      y: 60 + Math.random() * 200,
      color: ['#ef476f', '#ffd166', '#06d6a0', '#118ab2', '#c084fc'][i % 5],
      value: 10,
      born: Date.now(),
    }));
  }

  useEffect(() => {
    if (time <= 0) return;
    const t = setInterval(() => setTime((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [time]);

  useEffect(() => {
    if (time <= 0) return;
    const t = setInterval(() => setTargets((ts) => {
      const cleaned = ts.filter((x) => Date.now() - x.born < 2500);
      return [...cleaned, ...spawn(1)].slice(-8);
    }), 900);
    return () => clearInterval(t);
  }, [time]);

  function hit(id) {
    setTargets((ts) => ts.filter((t) => t.id !== id));
    setScore((s) => s + 10);
  }

  useEffect(() => {
    if (time <= 0 && !finalized.current) {
      finalized.current = true;
      addLove(score, 'Shooting Gallery');
      if (score >= 60) {
        registerMinigameWin();
        addMemory({
          id: 'won_shooting', title: 'Sharpshooter Together', location: 'Carnival',
          description: 'She cheered at every hit. You never missed after that.', emoji: '🎈',
        });
      }
    }
  }, [time, score, addLove, addMemory, registerMinigameWin]);

  return (
    <div className="mg-content">
      <h2 className="mg-title">Shooting Gallery 🎈</h2>
      <div className="mg-sub">Time: {Math.max(0, time)}s · Score: {score} ❤️</div>
      <div className="mg-message">Pop the balloons before they float away!</div>
      <div className="mg-board" style={{ background: 'linear-gradient(180deg, #cfe7f5 0%, #f1e6d0 100%)' }}>
        {targets.map((t) => (
          <button
            key={t.id}
            className="shoot-balloon"
            style={{ left: t.x, top: t.y, background: t.color }}
            disabled={time <= 0}
            onClick={() => hit(t.id)}
            data-testid="shooting-target"
          >
            🎈
          </button>
        ))}
      </div>
      {time <= 0 && (
        <button className="mg-btn" onClick={onDone} data-testid="shooting-finish">Finish · Earned {score} ❤️</button>
      )}
    </div>
  );
}

/* ---------- DANCE MACHINE ---------- */
function DanceMachine({ onDone }) {
  const arrows = ['↑', '↓', '←', '→'];
  const [seq, setSeq] = useState(() => Array.from({ length: 12 }, () => arrows[Math.floor(Math.random() * 4)]));
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [done, setDone] = useState(false);
  const addLove = useGame((s) => s.addLove);
  const addMemory = useGame((s) => s.addMemory);
  const registerMinigameWin = useGame((s) => s.registerMinigameWin);
  const finalized = useRef(false);

  useEffect(() => {
    function handler(e) {
      if (done) return;
      const key = e.key;
      const map = { ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→' };
      const arrow = map[key];
      if (!arrow) return;
      if (arrow === seq[idx]) {
        setScore((s) => s + 10 + combo * 2);
        setCombo((c) => c + 1);
      } else {
        setCombo(0);
      }
      const nxt = idx + 1;
      if (nxt >= seq.length) setDone(true);
      setIdx(nxt);
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [idx, seq, combo, done]);

  useEffect(() => {
    if (done && !finalized.current) {
      finalized.current = true;
      addLove(score, 'Dance Machine');
      if (score >= 80) {
        registerMinigameWin();
        addMemory({
          id: 'won_dance', title: 'Danced Together', location: 'Dance Machine',
          description: 'You looked ridiculous. She loved every second.', emoji: '💃',
        });
      }
    }
  }, [done, score, addLove, addMemory, registerMinigameWin]);

  return (
    <div className="mg-content">
      <h2 className="mg-title">Dance Machine 💃</h2>
      <div className="mg-sub">Score: {score} ❤️ · Combo: x{combo}</div>
      <div className="mg-message">Use Arrow Keys to hit the beats!</div>
      <div className="dance-strip">
        {seq.map((a, i) => (
          <div key={i} className={`dance-arrow ${i === idx ? 'dance-current' : ''} ${i < idx ? 'dance-past' : ''}`}>
            {a}
          </div>
        ))}
      </div>
      {done && (
        <button className="mg-btn" onClick={onDone} data-testid="dance-finish">Finish · Earned {score} ❤️</button>
      )}
    </div>
  );
}
