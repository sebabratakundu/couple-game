import React, { useRef, useEffect, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Text, Billboard } from '@react-three/drei';
import Character from './Character';
import { CherryTree, Bench, Lantern, FlowerField, Butterfly, Tree } from './props';
import { useGame } from './store';

/**
 * RopewayRide — 45s cinematic cable-car journey through mountains,
 * waterfalls, forests, villages. Three camera modes rotate.
 * Player can also press R to toggle free-orbit inside cabin.
 */
export function RopewayRide() {
  const { camera } = useThree();
  const t = useRef(0);
  const cabinRef = useRef();
  const reachSummit = useGame((s) => s.reachSummit);
  const setTime = useGame((s) => s.setTime);
  const [message, setMessage] = useState('Boarding the cable car…');
  const [cabinPointing, setCabinPointing] = useState(false);
  const startedTime = useGame((s) => s.timeOfDay);
  const initialT = useRef(startedTime);
  const camMode = useRef(0);
  const freeOrbit = useRef(false);
  const orbitAngle = useRef(0);

  // Curve that goes UP the mountain
  const curve = useMemo(() => {
    const points = [
      new THREE.Vector3(0, 6, 0),        // start at station
      new THREE.Vector3(0, 8, -20),      // over trees
      new THREE.Vector3(3, 14, -40),     // by waterfall 1
      new THREE.Vector3(-2, 20, -65),    // over river
      new THREE.Vector3(0, 28, -90),     // over cliff
      new THREE.Vector3(3, 36, -115),    // near waterfall 2
      new THREE.Vector3(-2, 44, -140),   // approach summit
      new THREE.Vector3(0, 48, -165),    // summit station
    ];
    return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
  }, []);

  useEffect(() => {
    setMessage('Boarding the cable car…');
    const t1 = setTimeout(() => setMessage('Look at the waterfall! 💦'), 8000);
    const t2 = setTimeout(() => setMessage('Villages below the clouds…'), 18000);
    const t3 = setTimeout(() => { setMessage('The valley looks like a painting.'); setCabinPointing(true); }, 26000);
    const t4 = setTimeout(() => setMessage('Almost at the summit ✨'), 38000);
    const t5 = setTimeout(() => setMessage('Sunset is waiting for us ❤️'), 44000);
    const orbitHandler = (e) => { if (e.key.toLowerCase() === 'r') freeOrbit.current = !freeOrbit.current; };
    window.addEventListener('keydown', orbitHandler);
    return () => {
      [t1, t2, t3, t4, t5].forEach(clearTimeout);
      window.removeEventListener('keydown', orbitHandler);
    };
  }, []);

  useFrame((_, delta) => {
    t.current += delta;
    const duration = 50; // 50s ride
    const u = Math.min(1, t.current / duration);

    const p = curve.getPoint(u);
    const tangent = curve.getTangent(u);

    if (cabinRef.current) {
      cabinRef.current.position.copy(p);
      // Rotate to follow tangent, but keep upright
      cabinRef.current.rotation.y = Math.atan2(tangent.x, tangent.z) + Math.PI;
    }

    // Camera modes: rotate every ~7 sec, unless free orbit
    if (freeOrbit.current) {
      orbitAngle.current += delta * 0.6;
      const r = 6;
      const cx = p.x + Math.cos(orbitAngle.current) * r;
      const cz = p.z + Math.sin(orbitAngle.current) * r;
      const cy = p.y + 1.2;
      camera.position.lerp(new THREE.Vector3(cx, cy, cz), 0.08);
      camera.lookAt(p);
    } else {
      const cycle = Math.floor(t.current / 7) % 3;
      camMode.current = cycle;
      if (cycle === 0) {
        // Interior — inside cabin, looking forward
        const forward = tangent.clone().multiplyScalar(3);
        const inside = p.clone().add(new THREE.Vector3(-0.6, 0.4, 0));
        camera.position.lerp(inside, 0.06);
        camera.lookAt(p.clone().add(forward));
      } else if (cycle === 1) {
        // External orbit — beauty shot
        const orbit = t.current * 0.2;
        const desired = p.clone().add(new THREE.Vector3(Math.cos(orbit) * 12, 2, Math.sin(orbit) * 12));
        camera.position.lerp(desired, 0.045);
        camera.lookAt(p);
      } else {
        // Close-up on couple from side
        const desired = p.clone().add(new THREE.Vector3(3.5, 0.8, 3.5));
        camera.position.lerp(desired, 0.055);
        camera.lookAt(p);
      }
    }

    // Sky transitions from current time up to 0.83 during the ride
    const skyStart = Math.max(0.6, initialT.current);
    setTime(skyStart + u * (0.83 - skyStart));

    if (u >= 1) {
      reachSummit();
    }
  });

  return (
    <group>
      {/* Overall lighting */}
      <ambientLight intensity={0.4} color="#fff2d0" />
      <hemisphereLight args={['#cfe6ff', '#5cae5c', 0.55]} />
      <directionalLight position={[30, 60, 20]} intensity={1.7} color="#fff5e0" />

      {/* Cable line */}
      <CableLine curve={curve} />

      {/* Cabin */}
      <group ref={cabinRef}>
        <CableCar cabinPointing={cabinPointing} />
      </group>

      {/* Scenery */}
      <MountainWorld />
    </group>
  );
}

function CableLine({ curve }) {
  const geom = useMemo(() => new THREE.TubeGeometry(curve, 100, 0.04, 6, false), [curve]);
  // Support pylons at regular intervals
  const pylons = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 8; i++) {
      const u = i / 8;
      const p = curve.getPoint(u);
      arr.push([p.x, p.y, p.z]);
    }
    return arr;
  }, [curve]);
  return (
    <>
      <mesh geometry={geom}>
        <meshStandardMaterial color="#222" />
      </mesh>
      {pylons.map((p, i) => (
        <mesh key={i} position={[p[0], -20, p[2]]}>
          <cylinderGeometry args={[0.5, 0.8, p[1] + 20, 8]} />
          <meshStandardMaterial color="#5b3a24" />
        </mesh>
      ))}
    </>
  );
}

function CableCar({ cabinPointing }) {
  return (
    <group>
      {/* Attach arm */}
      <mesh position={[0, 1.2, 0]}>
        <boxGeometry args={[0.4, 0.1, 0.2]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.5, 8]} />
        <meshStandardMaterial color="#5a5a5a" />
      </mesh>
      {/* Cabin body */}
      <mesh castShadow>
        <boxGeometry args={[2.2, 1.5, 1.6]} />
        <meshStandardMaterial color="#e63946" metalness={0.4} roughness={0.35} />
      </mesh>
      {/* Windows */}
      <mesh position={[0, 0.15, 0.81]}>
        <planeGeometry args={[1.9, 0.9]} />
        <meshStandardMaterial color="#78c8ff" transparent opacity={0.35} metalness={0.6} roughness={0.05} />
      </mesh>
      <mesh position={[0, 0.15, -0.81]}>
        <planeGeometry args={[1.9, 0.9]} />
        <meshStandardMaterial color="#78c8ff" transparent opacity={0.35} metalness={0.6} roughness={0.05} />
      </mesh>
      {/* Roof accent */}
      <mesh position={[0, 0.85, 0]}>
        <boxGeometry args={[2.3, 0.15, 1.7]} />
        <meshStandardMaterial color="#3a1c50" />
      </mesh>
      {/* Little flag on top */}
      <mesh position={[0, 1.1, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.4, 6]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[0.1, 1.25, 0]}>
        <planeGeometry args={[0.2, 0.12]} />
        <meshStandardMaterial color="#ffd166" side={2} />
      </mesh>

      {/* Couple inside */}
      <group position={[-0.5, -0.45, 0]} scale={0.6}>
        <Character bodyColor="#3b6dc4" hairStyle="short" hairColor="#2a1a10" isSitting lookAt={new THREE.Vector3(0.8, 1.5, 0)} smileStrength={1.7} handsUp={false} />
      </group>
      <group position={[0.5, -0.45, 0]} scale={0.6}>
        <Character bodyColor="#e07aa4" hairStyle="long" hairColor="#3a2015" isSitting lookAt={new THREE.Vector3(-0.8, 1.5, 0)} smileStrength={1.8} handsUp={cabinPointing} />
      </group>
    </group>
  );
}

function MountainWorld() {
  // Mountains, waterfalls, forests, rivers
  return (
    <group>
      {/* Ground fog haze */}
      <fog attach="fog" args={['#e0e5f0', 40, 250]} />
      {/* Distant mountains — layered */}
      <MountainLayer y={-5} zOffset={-30} scale={1} color="#88a0b8" count={7} />
      <MountainLayer y={-5} zOffset={-80} scale={1.5} color="#6d879e" count={6} />
      <MountainLayer y={-5} zOffset={-140} scale={2.2} color="#516883" count={5} />
      <MountainLayer y={-5} zOffset={-190} scale={3} color="#3f5570" count={4} />

      {/* Forests below */}
      <Forest zOffset={-25} count={80} seed={5} />
      <Forest zOffset={-70} count={70} seed={17} />
      <Forest zOffset={-115} count={60} seed={31} />

      {/* Waterfalls */}
      <Waterfall position={[10, 12, -40]} height={20} />
      <Waterfall position={[-14, 16, -95]} height={25} />
      <Waterfall position={[8, 20, -130]} height={30} />

      {/* River */}
      <River zStart={-15} zEnd={-160} />

      {/* Village below */}
      <Village position={[-15, -4, -50]} />
      <Village position={[18, -4, -75]} />
      <Village position={[-8, -4, -110]} />

      {/* Birds */}
      <BirdFlock />
      {/* Cloud layer below */}
      <CloudLayer y={2} count={12} radius={80} />
    </group>
  );
}

function MountainLayer({ y, zOffset, scale, color, count }) {
  const mountains = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      const x = (i - count / 2) * 30 * scale;
      const size = (12 + Math.abs(Math.sin(i * 12)) * 10) * scale;
      arr.push({ x, size });
    }
    return arr;
  }, [count, scale]);
  return (
    <group position={[0, y, zOffset]}>
      {mountains.map((m, i) => (
        <mesh key={i} position={[m.x, m.size * 0.6, 0]}>
          <coneGeometry args={[m.size * 0.9, m.size * 1.4, 6]} />
          <meshStandardMaterial color={color} flatShading />
        </mesh>
      ))}
    </group>
  );
}

function Forest({ zOffset, count, seed }) {
  const trees = useMemo(() => {
    let s = seed;
    const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    const arr = [];
    for (let i = 0; i < count; i++) {
      const x = (rand() - 0.5) * 60;
      const z = zOffset + (rand() - 0.5) * 30;
      const y = -10 + rand() * 4;
      arr.push({ pos: [x, y, z], scale: 0.6 + rand() * 0.8 });
    }
    return arr;
  }, [zOffset, count, seed]);
  return (
    <group>
      {trees.map((t, i) => (
        <group key={i} position={t.pos} scale={t.scale}>
          <mesh castShadow position={[0, 1.5, 0]}>
            <coneGeometry args={[1.2, 3, 8]} />
            <meshStandardMaterial color="#2a7a3a" flatShading />
          </mesh>
          <mesh castShadow position={[0, 2.5, 0]}>
            <coneGeometry args={[0.9, 2, 8]} />
            <meshStandardMaterial color="#3f8f3d" flatShading />
          </mesh>
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.15, 0.25, 1, 6]} />
            <meshStandardMaterial color="#5b3a24" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Waterfall({ position, height }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (ref.current && ref.current.material) {
      ref.current.material.opacity = 0.75 + Math.sin(clock.elapsedTime * 4) * 0.05;
    }
  });
  return (
    <group position={position}>
      {/* Cliff */}
      <mesh position={[0, height / 2, -1]}>
        <boxGeometry args={[3.5, height, 2]} />
        <meshStandardMaterial color="#6a6560" flatShading />
      </mesh>
      {/* Water sheet */}
      <mesh ref={ref} position={[0, -height * 0.25, 0]}>
        <planeGeometry args={[3, height * 1.2]} />
        <meshStandardMaterial color="#a8dcff" transparent opacity={0.85} emissive="#a8dcff" emissiveIntensity={0.15} />
      </mesh>
      {/* Splash pool */}
      <mesh position={[0, -height * 0.85, 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3, 20]} />
        <meshStandardMaterial color="#78c8ff" />
      </mesh>
      {/* Mist */}
      {[...Array(4)].map((_, i) => (
        <mesh key={i} position={[Math.sin(i) * 1.5, -height * 0.75 + i * 0.5, 1 + i * 0.3]}>
          <sphereGeometry args={[1 + i * 0.3, 10, 10]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.25} />
        </mesh>
      ))}
    </group>
  );
}

function River({ zStart, zEnd }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -6, (zStart + zEnd) / 2]}>
      <planeGeometry args={[8, Math.abs(zEnd - zStart), 20, 40]} />
      <meshStandardMaterial color="#78c8ff" transparent opacity={0.85} metalness={0.4} roughness={0.15} />
    </mesh>
  );
}

function Village({ position }) {
  return (
    <group position={position}>
      {[...Array(6)].map((_, i) => {
        const x = (i % 3 - 1) * 2;
        const z = Math.floor(i / 3) * 2;
        return (
          <group key={i} position={[x, 0, z]}>
            <mesh position={[0, 0.6, 0]}>
              <boxGeometry args={[1.2, 1.2, 1.2]} />
              <meshStandardMaterial color={['#f79256', '#ffd166', '#7dcfb6', '#c084fc'][i % 4]} />
            </mesh>
            <mesh position={[0, 1.5, 0]}>
              <coneGeometry args={[0.9, 0.7, 4]} />
              <meshStandardMaterial color="#5b3a24" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function BirdFlock() {
  const birds = useRef([]);
  useEffect(() => {
    birds.current = [...Array(8)].map(() => ({
      x: Math.random() * 30 - 15,
      y: 15 + Math.random() * 10,
      z: -30 - Math.random() * 100,
      phase: Math.random() * 6,
      speed: 0.5 + Math.random() * 0.4,
    }));
  }, []);
  const refs = useRef([]);
  useFrame(({ clock }) => {
    birds.current.forEach((b, i) => {
      if (refs.current[i]) {
        const t = clock.elapsedTime * b.speed + b.phase;
        refs.current[i].position.x = b.x + Math.cos(t) * 5;
        refs.current[i].position.z = b.z + Math.sin(t) * 5;
        refs.current[i].rotation.y = t + Math.PI / 2;
        refs.current[i].rotation.z = Math.sin(clock.elapsedTime * 10) * 0.3;
      }
    });
  });
  return (
    <group>
      {[...Array(8)].map((_, i) => (
        <group key={i} ref={(el) => refs.current[i] = el}>
          <mesh>
            <coneGeometry args={[0.1, 0.5, 3]} rotation={[0, 0, Math.PI / 2]} />
            <meshBasicMaterial color="#222" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function CloudLayer({ y, count, radius }) {
  const clouds = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const r = radius + Math.random() * 20;
      arr.push({ pos: [Math.cos(a) * r, y + Math.random() * 4, Math.sin(a) * r - 80], size: 4 + Math.random() * 3 });
    }
    return arr;
  }, [y, count, radius]);
  return (
    <group>
      {clouds.map((c, i) => (
        <group key={i} position={c.pos}>
          <mesh>
            <sphereGeometry args={[c.size, 10, 10]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.75} flatShading />
          </mesh>
          <mesh position={[c.size * 0.5, 0, 0]}>
            <sphereGeometry args={[c.size * 0.7, 10, 10]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.75} flatShading />
          </mesh>
          <mesh position={[-c.size * 0.5, 0, 0]}>
            <sphereGeometry args={[c.size * 0.6, 10, 10]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.75} flatShading />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ---------- SUMMIT ---------- */
export function Summit() {
  const triggerEnding = useGame((s) => s.triggerEnding);
  const nearBench = useRef(false);
  const setNearby = useGame((s) => s.setNearby);
  const nearby = useGame((s) => s.nearbyInteraction);

  useEffect(() => {
    const handler = (e) => {
      if (e.key.toLowerCase() === 'e' && nearBench.current) triggerEnding();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [triggerEnding]);

  useFrame(({ camera }) => {
    const dist = Math.hypot(camera.position.x - 0, camera.position.z - (-5));
    nearBench.current = dist < 8;
    if (nearBench.current) {
      if (!nearby || nearby.id !== 'sunset_bench') {
        setNearby({ id: 'sunset_bench', label: 'Sit together and watch the sunset', pos: [0, 0, -5] });
      }
    } else if (nearby && nearby.id === 'sunset_bench') {
      setNearby(null);
    }
  });

  return (
    <group>
      {/* Summit island - expanded */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[22, 40]} />
        <meshStandardMaterial color="#a67b58" />
      </mesh>
      {/* Grass patches */}
      <mesh receiveShadow position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[20, 40]} />
        <meshStandardMaterial color="#8ab566" />
      </mesh>
      {/* Wooden deck */}
      <mesh position={[0, 0.15, -8]}>
        <boxGeometry args={[16, 0.3, 6]} />
        <meshStandardMaterial color="#8b5a2b" />
      </mesh>
      {/* Deck planks */}
      {[...Array(8)].map((_, i) => (
        <mesh key={i} position={[0, 0.22, -11 + i * 0.8]}>
          <boxGeometry args={[15.8, 0.05, 0.7]} />
          <meshStandardMaterial color="#5b3a24" />
        </mesh>
      ))}
      {/* Bench overlooking sunset */}
      <group position={[0, 0, -5]}>
        <Bench position={[0, 0.3, 0]} rotation={[0, Math.PI, 0]} />
        <mesh position={[0, 0.02, 1.5]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.5, 1.9, 24]} />
          <meshBasicMaterial color="#ff5c8a" transparent opacity={0.7} />
        </mesh>
        <Billboard position={[0, 1.8, 0]}>
          <Text fontSize={0.35} color="#ffffff" outlineColor="#c94b6b" outlineWidth={0.04}>Sit together — Press E</Text>
        </Billboard>
      </group>

      {/* Heart-shaped viewpoint */}
      <group position={[0, 0, -11]}>
        <mesh position={[-1.1, 1, 0]}>
          <sphereGeometry args={[0.75, 14, 14]} />
          <meshStandardMaterial color="#c94b6b" />
        </mesh>
        <mesh position={[1.1, 1, 0]}>
          <sphereGeometry args={[0.75, 14, 14]} />
          <meshStandardMaterial color="#c94b6b" />
        </mesh>
        <mesh position={[0, -0.1, 0]} rotation={[0, 0, Math.PI]}>
          <coneGeometry args={[1.5, 1.9, 12]} />
          <meshStandardMaterial color="#c94b6b" />
        </mesh>
      </group>

      {/* Cherry blossom trees */}
      {[...Array(10)].map((_, i) => {
        const a = (i / 10) * Math.PI * 2;
        const r = 14;
        return <CherryTree key={i} position={[Math.cos(a) * r, 0, Math.sin(a) * r]} scale={1 + (i % 3) * 0.15} />;
      })}
      {/* Regular trees behind */}
      {[...Array(12)].map((_, i) => {
        const a = (i / 12) * Math.PI * 2 + 0.2;
        const r = 19;
        return <Tree key={i} position={[Math.cos(a) * r, 0, Math.sin(a) * r]} scale={0.9 + (i % 3) * 0.2} />;
      })}
      {/* Lanterns lining a path */}
      {[...Array(6)].map((_, i) => (
        <React.Fragment key={i}>
          <Lantern position={[-4, 0, -2 + i * 1.5]} />
          <Lantern position={[4, 0, -2 + i * 1.5]} />
        </React.Fragment>
      ))}
      {/* Wildflowers */}
      <FlowerField center={[0, 0, 3]} radius={12} count={100} seed={99} />
      <FlowerField center={[8, 0, -5]} radius={5} count={40} seed={77} />
      <FlowerField center={[-8, 0, -5]} radius={5} count={40} seed={88} />

      {/* Distant mountains + waterfalls visible in valley */}
      <group position={[0, 0, -50]}>
        <mesh position={[-15, 8, 0]}>
          <coneGeometry args={[15, 20, 6]} />
          <meshStandardMaterial color="#5b4a7a" flatShading />
        </mesh>
        <mesh position={[15, 6, 0]}>
          <coneGeometry args={[12, 18, 6]} />
          <meshStandardMaterial color="#6b5a8a" flatShading />
        </mesh>
        <mesh position={[0, 12, -10]}>
          <coneGeometry args={[20, 28, 6]} />
          <meshStandardMaterial color="#4a3a6a" flatShading />
        </mesh>
        {/* Distant waterfall */}
        <mesh position={[-10, 10, -5]}>
          <planeGeometry args={[1.5, 12]} />
          <meshStandardMaterial color="#a8dcff" transparent opacity={0.8} emissive="#a8dcff" emissiveIntensity={0.3} />
        </mesh>
      </group>

      {/* Butterflies fluttering */}
      <Butterfly path={[[-2, 1.2, -3], [-1, 1.6, -4], [0, 1.2, -3], [-1, 1.6, -2]]} color="#fff2a1" speed={0.3} />
      <Butterfly path={[[2, 1.2, -3], [3, 1.8, -4], [4, 1.2, -3], [3, 1.8, -2]]} color="#fff2a1" speed={0.3} />
      <Butterfly path={[[0, 1.8, 5], [2, 2, 6], [4, 1.8, 5], [2, 2, 4]]} color="#ffb1c8" speed={0.35} />

      {/* Clouds below */}
      {[...Array(16)].map((_, i) => {
        const a = (i / 16) * Math.PI * 2;
        return (
          <group key={i} position={[Math.cos(a) * 30, -6, Math.sin(a) * 30]}>
            <mesh>
              <sphereGeometry args={[3.5 + (i % 3), 12, 12]} />
              <meshStandardMaterial color="#fff2e0" transparent opacity={0.75} flatShading />
            </mesh>
            <mesh position={[2, 0, 0]}>
              <sphereGeometry args={[2.5 + (i % 3) * 0.5, 12, 12]} />
              <meshStandardMaterial color="#fff2e0" transparent opacity={0.75} flatShading />
            </mesh>
          </group>
        );
      })}

      {/* Ambient hint about controls */}
      <Billboard position={[0, 12, 0]}>
        <Text fontSize={0.55} color="#ffffff" outlineColor="#c94b6b" outlineWidth={0.05}>Mountain Summit ✨</Text>
      </Billboard>
    </group>
  );
}
