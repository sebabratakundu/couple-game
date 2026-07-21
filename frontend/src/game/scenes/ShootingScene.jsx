import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useGame } from '../store';

/**
 * ShootingScene — 3D shooting gallery. Aim with mouse (reticle), click to shoot.
 * Moving balloons + ducks. Higher targets = more points. 30 seconds.
 */
export default function ShootingScene({ onExit }) {
  const { camera, gl, raycaster, scene } = useThree();
  const [targets, setTargets] = useState(() => spawnInitial());
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(30);
  const [message, setMessage] = useState('Click to shoot. Move mouse to aim.');
  const [hits, setHits] = useState([]); // recent hit indicators
  const reticle = useRef(new THREE.Vector2(0, 0));
  const finalized = useRef(false);
  const addLove = useGame((s) => s.addLove);
  const addMemory = useGame((s) => s.addMemory);
  const registerMinigameWin = useGame((s) => s.registerMinigameWin);

  useEffect(() => {
    camera.position.set(0, 2, 4);
    camera.lookAt(0, 1.5, -6);
  }, [camera]);

  useEffect(() => {
    const dom = gl.domElement;
    const onMove = (e) => {
      const rect = dom.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      reticle.current.set(nx, ny);
    };
    const onDown = (e) => {
      if (e.button !== 0 || time <= 0) return;
      shoot();
    };
    const onKey = (e) => { if (e.key === 'Escape') onExit(); };
    dom.addEventListener('mousemove', onMove);
    dom.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      dom.removeEventListener('mousemove', onMove);
      dom.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [gl, time]);

  useEffect(() => {
    if (time <= 0) return;
    const iv = setInterval(() => setTime((s) => s - 1), 1000);
    return () => clearInterval(iv);
  }, [time]);

  useEffect(() => {
    if (time <= 0 && !finalized.current) {
      finalized.current = true;
      addLove(score, 'Shooting Gallery');
      if (score >= 80) {
        registerMinigameWin();
        addMemory({
          id: 'won_shooting', title: 'Sharpshooter Together',
          location: 'Shooting Gallery',
          description: 'She cheered at every hit. You never missed after that.',
          emoji: '🎯',
        });
      }
      setMessage(`Time's up! Score: ${score}. Earned ${score} ❤️ · Press ESC`);
    }
  }, [time, score, addLove, addMemory, registerMinigameWin]);

  function shoot() {
    raycaster.setFromCamera(reticle.current, camera);
    const now = performance.now() / 1000;
    let closestIdx = -1;
    let closestDist = Infinity;
    targets.forEach((t, i) => {
      // Compute current animated position
      const cx = t.baseX + Math.sin(now * t.speed + t.phase) * t.range;
      const cy = t.pos[1] + Math.sin(now * 3 + t.phase) * 0.15;
      const pos = new THREE.Vector3(cx, cy, t.pos[2]);
      const rayToTarget = pos.clone().sub(raycaster.ray.origin);
      const proj = rayToTarget.dot(raycaster.ray.direction);
      if (proj < 0) return;
      const closestPoint = raycaster.ray.origin.clone().add(raycaster.ray.direction.clone().multiplyScalar(proj));
      const dist = pos.distanceTo(closestPoint);
      if (dist < t.radius * 1.4 && proj < closestDist) {
        closestDist = proj;
        closestIdx = i;
      }
    });
    if (closestIdx >= 0) {
      const target = targets[closestIdx];
      const cx = target.baseX + Math.sin(now * target.speed + target.phase) * target.range;
      const cy = target.pos[1] + Math.sin(now * 3 + target.phase) * 0.15;
      setScore((s) => s + target.value);
      setMessage(`+${target.value} 🎯 ${target.value >= 20 ? 'GREAT SHOT!' : 'Nice!'}`);
      setTargets((ts) => ts.filter((_, i) => i !== closestIdx).concat(spawnOne()));
      setHits((h) => [...h.slice(-4), { pos: [cx, cy, target.pos[2]], ts: Date.now(), value: target.value }]);
    } else {
      setMessage('Missed…');
    }
  }

  useFrame(({ clock }) => {
    // No setState in useFrame — let each Target animate itself internally
  });

  return (
    <group>
      <ambientLight intensity={0.7} color="#fff2d0" />
      <directionalLight position={[10, 20, 5]} intensity={1.2} color="#fff5e0" />

      {/* Booth */}
      <mesh position={[0, 2, -8]} receiveShadow>
        <boxGeometry args={[14, 4, 0.4]} />
        <meshStandardMaterial color="#c94b6b" />
      </mesh>
      <mesh position={[0, 4.3, -8]}>
        <coneGeometry args={[9, 1.5, 4]} />
        <meshStandardMaterial color="#3a1c50" />
      </mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#d9c39b" />
      </mesh>
      <mesh position={[0, 1, -8]}>
        <planeGeometry args={[12, 2.5]} />
        <meshStandardMaterial color="#ffd166" />
      </mesh>

      {/* Targets */}
      {targets.map((t) => (
        <Target key={t.id} target={t} />
      ))}

      {/* Reticle - a small circle centered on cursor */}
      <Reticle reticle={reticle} />

      {/* Hit indicators */}
      {hits.map((h) => (
        <HitFloat key={h.ts} pos={h.pos} value={h.value} />
      ))}

      {/* HUD */}
      <Billboard position={[0, 5.5, -8]}>
        <Text fontSize={0.5} color="#ffffff" outlineColor="#3a1c50" outlineWidth={0.04}>Shooting Gallery 🎯</Text>
      </Billboard>
      <Billboard position={[0, 4.8, -8]}>
        <Text fontSize={0.3} color="#ffd166" outlineColor="#3a1c50" outlineWidth={0.02}>{`Time ${Math.max(0, time)}s   ·   Score ${score}`}</Text>
      </Billboard>
      <Billboard position={[0, 3.2, -1]}>
        <Text fontSize={0.22} color="#3a1c50" outlineColor="#ffffff" outlineWidth={0.02}>{message}</Text>
      </Billboard>
    </group>
  );
}

function Target({ target }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (ref.current) {
      const t = clock.elapsedTime;
      const x = target.baseX + Math.sin(t * target.speed + target.phase) * target.range;
      const y = target.pos[1] + Math.sin(t * 3 + target.phase) * 0.15;
      ref.current.position.set(x, y, target.pos[2]);
      ref.current.rotation.z = Math.sin(t * 2 + target.phase) * 0.05;
    }
  });
  if (target.kind === 'balloon') {
    return (
      <group ref={ref}>
        <mesh castShadow>
          <sphereGeometry args={[target.radius, 12, 12]} />
          <meshStandardMaterial color={target.color} emissive={target.color} emissiveIntensity={0.2} />
        </mesh>
        <mesh position={[0, -target.radius - 0.5, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 1, 4]} />
          <meshStandardMaterial color="#333" />
        </mesh>
      </group>
    );
  }
  return (
    <group ref={ref}>
      <mesh castShadow>
        <sphereGeometry args={[target.radius, 12, 12]} />
        <meshStandardMaterial color="#f5efe1" />
      </mesh>
      <mesh position={[target.radius * 0.5, target.radius * 0.6, 0]}>
        <sphereGeometry args={[target.radius * 0.55, 10, 10]} />
        <meshStandardMaterial color="#f5efe1" />
      </mesh>
      <mesh position={[target.radius, target.radius * 0.6, 0]}>
        <coneGeometry args={[target.radius * 0.3, target.radius * 0.7, 6]} rotation={[0, 0, -Math.PI / 2]} />
        <meshStandardMaterial color="#f79256" />
      </mesh>
    </group>
  );
}

function Reticle({ reticle }) {
  const ref = useRef();
  const { camera } = useThree();
  useFrame(() => {
    if (!ref.current) return;
    // Project reticle into world at distance 5 from camera
    const dist = 5;
    const worldPos = new THREE.Vector3(reticle.current.x, reticle.current.y, 0.9);
    worldPos.unproject(camera);
    const dir = worldPos.sub(camera.position).normalize();
    const target = camera.position.clone().add(dir.multiplyScalar(dist));
    ref.current.position.copy(target);
    ref.current.lookAt(camera.position);
  });
  return (
    <mesh ref={ref}>
      <ringGeometry args={[0.08, 0.11, 24]} />
      <meshBasicMaterial color="#ff5c8a" transparent opacity={0.9} />
    </mesh>
  );
}

function HitFloat({ pos, value }) {
  const ref = useRef();
  const start = useRef(Date.now());
  useFrame(() => {
    if (!ref.current) return;
    const age = (Date.now() - start.current) / 1000;
    ref.current.position.set(pos[0], pos[1] + age * 1.5, pos[2]);
    if (ref.current.material) ref.current.material.opacity = Math.max(0, 1 - age);
  });
  return (
    <Billboard ref={ref} position={pos}>
      <Text fontSize={0.4} color="#ffd166" outlineColor="#3a1c50" outlineWidth={0.03}>{`+${value}`}</Text>
    </Billboard>
  );
}

function spawnInitial() {
  return [
    ...spawnRow(3.2, 'balloon', 10, 0),
    ...spawnRow(2.4, 'duck', 15, 1),
    ...spawnRow(4.2, 'balloon', 20, 2),
  ];
}

function spawnRow(y, kind, value, layer) {
  const items = [];
  for (let i = 0; i < 5; i++) {
    const x = -4 + i * 2;
    items.push({
      id: `${layer}_${i}_${Math.random()}`,
      kind,
      value,
      color: ['#ef476f', '#ffd166', '#06d6a0', '#118ab2', '#c084fc'][i % 5],
      pos: [x, y, -6 - layer * 0.5],
      baseX: x,
      radius: kind === 'balloon' ? 0.28 : 0.24,
      speed: 0.6 + layer * 0.2,
      range: 0.9 + layer * 0.3,
      phase: Math.random() * 6,
    });
  }
  return items;
}

function spawnOne() {
  const layer = Math.floor(Math.random() * 3);
  const y = [3.2, 2.4, 4.2][layer];
  const value = [10, 15, 20][layer];
  const kind = layer === 1 ? 'duck' : 'balloon';
  const x = -4 + Math.random() * 8;
  return {
    id: Math.random().toString(),
    kind,
    value,
    color: ['#ef476f', '#ffd166', '#06d6a0', '#118ab2', '#c084fc'][Math.floor(Math.random() * 5)],
    pos: [x, y, -6 - layer * 0.5],
    baseX: x,
    radius: kind === 'balloon' ? 0.28 : 0.24,
    speed: 0.6 + layer * 0.2,
    range: 0.9 + layer * 0.3,
    phase: Math.random() * 6,
  };
}
