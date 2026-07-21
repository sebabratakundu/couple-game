import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { Person } from './props';
import { useGame } from './store';

/**
 * FerrisRide — cinematic ride from inside a ferris wheel cabin.
 * ~28 seconds. Camera stays in cabin.
 */
export function FerrisRide() {
  const cabin = useRef();
  const wheel = useRef();
  const { camera } = useThree();
  const t = useRef(0);
  const endRide = useGame((s) => s.endRide);

  useEffect(() => {
    return () => { t.current = 0; };
  }, []);

  useFrame((_, delta) => {
    t.current += delta;
    const angle = -Math.PI / 2 + t.current * 0.28; // ride slowly
    const R = 5;
    if (cabin.current) {
      cabin.current.position.set(Math.cos(angle) * R, 6 + Math.sin(angle) * R, 0);
    }
    if (wheel.current) wheel.current.rotation.z = -t.current * 0.28;

    // Camera inside cabin — slight sway
    if (cabin.current) {
      const cp = cabin.current.position;
      camera.position.lerp(new THREE.Vector3(cp.x + 0.6, cp.y + 0.3, cp.z + 1.8), 0.15);
      camera.lookAt(cp.x, cp.y + 0.2, cp.z - 0.5);
    }

    if (t.current > 28) {
      endRide('Ferris Wheel Ride', 60, {
        id: 'first_ride', title: 'First Ride Together', location: 'Ferris Wheel',
        description: 'The world felt small from up there — everything except us two.',
        emoji: '🎡',
      });
    }
  });

  return (
    <group position={[-25, 0, -18]}>
      {/* Simple park backdrop visible from wheel */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[220, 220]} />
        <meshStandardMaterial color="#5fae5c" />
      </mesh>
      {/* Wheel base */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[6, 1, 3]} />
        <meshStandardMaterial color="#775544" />
      </mesh>
      <mesh position={[0, 6, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 12, 8]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#455" />
      </mesh>
      <group ref={wheel} position={[0, 6, 0]}>
        <mesh>
          <torusGeometry args={[5, 0.15, 8, 32]} />
          <meshStandardMaterial color="#f79256" />
        </mesh>
        {[...Array(8)].map((_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <mesh key={i} rotation={[0, 0, a]}>
              <boxGeometry args={[10, 0.06, 0.06]} />
              <meshStandardMaterial color="#f79256" />
            </mesh>
          );
        })}
      </group>
      {/* Our cabin (independent from wheel rotation for stable interior) */}
      <group ref={cabin}>
        <mesh castShadow>
          <boxGeometry args={[1.3, 1.0, 1.3]} />
          <meshStandardMaterial color="#ff5c8a" transparent opacity={0.9} />
        </mesh>
        <mesh position={[0, 0.6, 0]}>
          <boxGeometry args={[1.5, 0.15, 1.5]} />
          <meshStandardMaterial color="#c94b6b" />
        </mesh>
        {/* Couple inside */}
        <group position={[-0.28, -0.4, 0]} scale={0.5}>
          <Person bodyColor="#3b6dc4" hairStyle="short" hairColor="#2a1a10" />
        </group>
        <group position={[0.28, -0.4, 0]} scale={0.5}>
          <Person bodyColor="#e07aa4" hairStyle="long" hairColor="#3a2015" />
        </group>
      </group>
      {/* Park landmarks visible from wheel */}
      <ParkBackdrop />
      <Overlay text="🎡 Enjoy the view together..." />
    </group>
  );
}

/**
 * CoasterRide — a POV-style coaster around a loop
 */
export function CoasterRide() {
  const { camera } = useThree();
  const t = useRef(0);
  const endRide = useGame((s) => s.endRide);
  const car = useRef();

  useFrame((_, delta) => {
    t.current += delta * 0.7; // ~ 40s to finish
    const p = t.current;

    // Path: helix + dip + climb
    const x = Math.cos(p) * 12 + Math.sin(p * 2.1) * 3;
    const y = 4 + Math.sin(p * 1.3) * 3 + Math.max(0, Math.sin(p * 0.5)) * 4;
    const z = -25 + Math.sin(p) * 10;
    const nx = Math.cos(p + 0.05) * 12 + Math.sin((p + 0.05) * 2.1) * 3;
    const ny = 4 + Math.sin((p + 0.05) * 1.3) * 3 + Math.max(0, Math.sin((p + 0.05) * 0.5)) * 4;
    const nz = -25 + Math.sin(p + 0.05) * 10;

    if (car.current) {
      car.current.position.set(x, y, z);
      car.current.lookAt(nx, ny, nz);
    }

    // Camera slightly behind coaster car
    const dir = new THREE.Vector3(nx - x, ny - y, nz - z).normalize();
    const behind = new THREE.Vector3().copy(dir).multiplyScalar(-2.4);
    behind.y += 0.9;
    camera.position.lerp(new THREE.Vector3(x + behind.x, y + behind.y, z + behind.z), 0.25);
    camera.lookAt(x + dir.x * 3, y + 0.4, z + dir.z * 3);

    if (t.current > 28) {
      endRide('Roller Coaster', 90, {
        id: 'coaster', title: 'Screams & Laughs', location: 'Roller Coaster',
        description: 'Neither of us stopped smiling for hours.', emoji: '🎢',
      });
    }
  });

  return (
    <group>
      <ParkBackdrop />
      {/* Coaster track visualization */}
      <CoasterTrack />
      {/* Car with couple */}
      <group ref={car}>
        <mesh castShadow>
          <boxGeometry args={[1.6, 0.6, 1.6]} />
          <meshStandardMaterial color="#e63946" />
        </mesh>
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[1.4, 0.15, 1.4]} />
          <meshStandardMaterial color="#c1121f" />
        </mesh>
        <group position={[-0.3, 0.1, 0]} scale={0.42}>
          <Person bodyColor="#3b6dc4" hairStyle="short" hairColor="#2a1a10" />
        </group>
        <group position={[0.3, 0.1, 0]} scale={0.42}>
          <Person bodyColor="#e07aa4" hairStyle="long" hairColor="#3a2015" />
        </group>
      </group>
      <Overlay text="🎢 Hold on tight!" />
    </group>
  );
}

function CoasterTrack() {
  const segs = 120;
  const points = [];
  for (let i = 0; i <= segs; i++) {
    const p = (i / segs) * Math.PI * 4;
    points.push(new THREE.Vector3(
      Math.cos(p) * 12 + Math.sin(p * 2.1) * 3,
      4 + Math.sin(p * 1.3) * 3 + Math.max(0, Math.sin(p * 0.5)) * 4,
      -25 + Math.sin(p) * 10
    ));
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  return (
    <line geometry={geometry}>
      <lineBasicMaterial color="#e63946" linewidth={2} />
    </line>
  );
}

/**
 * BoatRide — controllable rowing on the lake
 */
export function BoatRide() {
  const { camera } = useThree();
  const boat = useRef();
  const oarL = useRef();
  const oarR = useRef();
  const rippleGrp = useRef();
  const pos = useRef(new THREE.Vector3(42, 0.35, 12));
  const heading = useRef(0);
  const t = useRef(0);
  const rowT = useRef(0);
  const endRide = useGame((s) => s.endRide);
  const flash = useGame((s) => s.flash);

  useEffect(() => {
    flash('W/S to row · A/D to steer · Explore the lake!');
  }, [flash]);

  useFrame((_, delta) => {
    t.current += delta;

    // Read input (imported keys via window)
    const w = window.__keys?.w, s = window.__keys?.s;
    const a = window.__keys?.a, d = window.__keys?.d;

    let vel = 0;
    if (w) vel += 1;
    if (s) vel -= 0.6;
    if (a) heading.current += delta * 0.9;
    if (d) heading.current -= delta * 0.9;

    // Movement
    const speed = 2.2;
    pos.current.x += Math.sin(heading.current) * vel * speed * delta;
    pos.current.z += Math.cos(heading.current) * vel * speed * delta;
    // Clamp to lake (center at 42,0,12 radius 9)
    const dx = pos.current.x - 42;
    const dz = pos.current.z - 12;
    const dist = Math.hypot(dx, dz);
    if (dist > 9) {
      pos.current.x = 42 + (dx / dist) * 9;
      pos.current.z = 12 + (dz / dist) * 9;
    }

    // Row animation
    if (vel !== 0) rowT.current += delta * 5;
    const rowAngle = Math.sin(rowT.current) * 0.9;
    if (oarL.current) oarL.current.rotation.x = -rowAngle * 0.6;
    if (oarR.current) oarR.current.rotation.x = -rowAngle * 0.6;

    if (boat.current) {
      boat.current.position.copy(pos.current);
      boat.current.position.y = 0.35 + Math.sin(t.current * 1.4) * 0.05;
      boat.current.rotation.y = heading.current;
      boat.current.rotation.z = Math.sin(t.current * 1.2) * 0.03;
    }

    // Camera: chase from behind
    const behind = new THREE.Vector3(-Math.sin(heading.current) * 5, 2.6, -Math.cos(heading.current) * 5);
    const desired = new THREE.Vector3().copy(pos.current).add(behind);
    camera.position.lerp(desired, 0.08);
    camera.lookAt(pos.current.x, pos.current.y + 0.4, pos.current.z);

    if (t.current > 45) {
      endRide('Boating on the Lake', 80, {
        id: 'boat', title: 'Rowed Across the Lake', location: 'Lake',
        description: 'You steered. She laughed at the ducks. The whole lake was ours.',
        emoji: '🚣',
      });
    }
  });

  return (
    <group>
      <ParkBackdrop />
      <Lake position={[42, 0, 12]} />
      <group ref={boat}>
        {/* Hull */}
        <mesh castShadow>
          <boxGeometry args={[1.4, 0.35, 2.2]} />
          <meshStandardMaterial color="#8b5a2b" />
        </mesh>
        <mesh position={[0, 0.15, 0]}>
          <boxGeometry args={[1.1, 0.15, 1.9]} />
          <meshStandardMaterial color="#c9a074" />
        </mesh>
        {/* Couple */}
        <group position={[-0.3, 0.55, 0.3]} scale={0.55}>
          <Person bodyColor="#3b6dc4" hairStyle="short" hairColor="#2a1a10" />
        </group>
        <group position={[0.3, 0.55, -0.3]} scale={0.55}>
          <Person bodyColor="#e07aa4" hairStyle="long" hairColor="#3a2015" />
        </group>
        {/* Oars */}
        <group ref={oarL} position={[-0.7, 0.5, 0]}>
          <mesh position={[-0.6, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.03, 0.03, 1.4, 8]} />
            <meshStandardMaterial color="#5b3a24" />
          </mesh>
          <mesh position={[-1.25, 0, 0]}>
            <boxGeometry args={[0.25, 0.05, 0.4]} />
            <meshStandardMaterial color="#3a2418" />
          </mesh>
        </group>
        <group ref={oarR} position={[0.7, 0.5, 0]}>
          <mesh position={[0.6, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.03, 0.03, 1.4, 8]} />
            <meshStandardMaterial color="#5b3a24" />
          </mesh>
          <mesh position={[1.25, 0, 0]}>
            <boxGeometry args={[0.25, 0.05, 0.4]} />
            <meshStandardMaterial color="#3a2418" />
          </mesh>
        </group>
      </group>
      <Overlay text="🚣 Row with W · Steer with A/D" />
    </group>
  );
}

function Lake({ position }) {
  const water = useRef();
  useFrame(({ clock }) => {
    if (water.current) {
      const s = 1 + Math.sin(clock.elapsedTime * 1.2) * 0.005;
      water.current.scale.set(s, 1, s);
    }
  });
  return (
    <group position={position}>
      <mesh ref={water} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.15, 0]}>
        <circleGeometry args={[10, 40]} />
        <meshStandardMaterial color="#4c9be8" transparent opacity={0.92} metalness={0.5} roughness={0.15} />
      </mesh>
      {/* Ripples */}
      {[...Array(12)].map((_, i) => (
        <Ripple key={i} seed={i} />
      ))}
    </group>
  );
}

function Ripple({ seed }) {
  const ref = useRef();
  const startTime = useRef(-Math.random() * 6);
  useFrame(({ clock }) => {
    const t = (clock.elapsedTime + startTime.current) % 6;
    if (t < 0) return;
    if (ref.current) {
      const s = 0.5 + t * 1.2;
      ref.current.scale.set(s, s, s);
      const opac = Math.max(0, 0.5 - t / 6);
      if (ref.current.material) ref.current.material.opacity = opac;
      if (t < 0.02) {
        // relocate
        const a = Math.random() * Math.PI * 2;
        const r = Math.random() * 8;
        ref.current.position.set(Math.cos(a) * r, 0.16, Math.sin(a) * r);
      }
    }
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.16, 0]}>
      <ringGeometry args={[0.4, 0.5, 20]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.4} />
    </mesh>
  );
}

function ParkBackdrop() {
  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[300, 300]} />
        <meshStandardMaterial color="#5fae5c" />
      </mesh>
      {/* Distant trees */}
      {[...Array(60)].map((_, i) => {
        const a = (i / 60) * Math.PI * 2;
        const r = 45 + (i % 5) * 8;
        return (
          <group key={i} position={[Math.cos(a) * r, 0, Math.sin(a) * r]}>
            <mesh>
              <coneGeometry args={[1.5, 3, 6]} />
              <meshStandardMaterial color="#3f8f3d" flatShading />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function Overlay({ text }) {
  return (
    <group />
  );
}
