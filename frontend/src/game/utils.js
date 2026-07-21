import * as THREE from 'three';

// Convert timeOfDay (0..1) to sun position and colors
export function sunFromTime(t) {
  // 0 morning (east low), 0.5 noon (top), 0.85 sunset (west low), 1 night
  const angle = t * Math.PI; // 0..PI arc across sky
  const x = Math.cos(angle) * 60;
  const y = Math.sin(angle) * 55 + 3;
  const z = Math.sin(angle * 0.5) * 20 - 10;
  return new THREE.Vector3(x, y, z);
}

export function skyColorsFromTime(t) {
  // Palette gradients
  // morning: soft pink/peach + blue
  // noon: bright blue
  // sunset: orange/pink/purple
  // night: dark blue/purple
  const stops = [
    { t: 0.0, top: '#FFC9A8', bot: '#FFE9CD' }, // dawn
    { t: 0.2, top: '#B8DDF6', bot: '#FFF3E0' }, // morning
    { t: 0.5, top: '#7CC1F4', bot: '#DFF3FF' }, // noon
    { t: 0.75, top: '#F7A96B', bot: '#FFD79A' }, // golden
    { t: 0.85, top: '#E86A6A', bot: '#F9B77A' }, // sunset
    { t: 0.95, top: '#5B3A87', bot: '#E86A6A' }, // twilight
    { t: 1.0, top: '#0E1A3B', bot: '#3A2E63' }, // night
  ];
  for (let i = 0; i < stops.length - 1; i++) {
    if (t <= stops[i + 1].t) {
      const a = stops[i];
      const b = stops[i + 1];
      const k = (t - a.t) / (b.t - a.t);
      return {
        top: lerpColor(a.top, b.top, k),
        bot: lerpColor(a.bot, b.bot, k),
      };
    }
  }
  return { top: stops[stops.length - 1].top, bot: stops[stops.length - 1].bot };
}

export function sunIntensity(t) {
  // Softer at edges, strongest around noon and slight warm boost at golden hour
  const base = Math.max(0.05, Math.sin(t * Math.PI));
  const golden = Math.exp(-Math.pow((t - 0.8) / 0.08, 2)) * 0.4;
  return base * 1.1 + golden;
}

export function ambientColor(t) {
  const c = skyColorsFromTime(t);
  return c.bot;
}

function lerpColor(a, b, k) {
  const ca = new THREE.Color(a);
  const cb = new THREE.Color(b);
  return '#' + ca.lerp(cb, Math.max(0, Math.min(1, k))).getHexString();
}

export function timeLabel(t) {
  if (t < 0.15) return 'Morning · 10:00 AM';
  if (t < 0.35) return 'Late Morning';
  if (t < 0.55) return 'Noon';
  if (t < 0.72) return 'Afternoon';
  if (t < 0.82) return 'Golden Hour';
  if (t < 0.92) return 'Sunset';
  return 'Evening';
}

// Random seeded helpers
export function seedRand(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}
