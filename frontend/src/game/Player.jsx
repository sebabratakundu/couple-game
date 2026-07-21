import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import Character from './Character';
import { useGame } from './store';

// Simple keyboard state
const keys = { w: false, a: false, s: false, d: false, shift: false, e: false, space: false };
const mouse = { wheel: 0 };
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (k in keys) keys[k] = true;
    if (k === 'shift') keys.shift = true;
    if (k === ' ') keys.space = true;
  });
  window.addEventListener('keyup', (e) => {
    const k = e.key.toLowerCase();
    if (k in keys) keys[k] = false;
    if (k === 'shift') keys.shift = false;
    if (k === ' ') keys.space = false;
  });
  window.addEventListener('wheel', (e) => {
    mouse.wheel += e.deltaY * 0.006;
    mouse.wheel = THREE.MathUtils.clamp(mouse.wheel, -3, 4);
  }, { passive: true });
}

export { keys };

export default function Player({ interactables }) {
  const group = useRef();
  const boyRef = useRef();
  const girlRef = useRef();
  const { camera } = useThree();

  const walkPhase = useRef(0);
  const paused = useGame((s) => s.paused);
  const setNearby = useGame((s) => s.setNearby);
  const nearbyInteraction = useGame((s) => s.nearbyInteraction);
  const atSummit = useGame((s) => s.atSummit);
  const onRopeway = useGame((s) => s.onRopeway);

  const pos = useRef(new THREE.Vector3(0, 0, 18));
  const facing = useRef(Math.PI); // yaw
  const targetFacing = useRef(Math.PI);
  const velocity = useRef(new THREE.Vector3());
  const speedNow = useRef(0);
  const isMoving = useRef(false);
  const isRunning = useRef(false);
  const eKeyPrev = useRef(false);
  const idleTimer = useRef(0);

  // Cached vectors to avoid GC
  const camDir = useMemo(() => new THREE.Vector3(), []);
  const camRight = useMemo(() => new THREE.Vector3(), []);
  const wantDir = useMemo(() => new THREE.Vector3(), []);
  const partnerLookTarget = useMemo(() => new THREE.Vector3(), []);
  const playerLookTarget = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, deltaRaw) => {
    if (paused || onRopeway) return;
    const delta = Math.min(0.05, deltaRaw); // clamp for stable physics

    const runMultiplier = keys.shift ? 1.9 : 1;
    const maxSpeed = 4.6 * runMultiplier;

    let dx = 0, dz = 0;
    if (keys.w) dz -= 1;
    if (keys.s) dz += 1;
    if (keys.a) dx -= 1;
    if (keys.d) dx += 1;
    const hasInput = dx !== 0 || dz !== 0;

    camera.getWorldDirection(camDir);
    camDir.y = 0; camDir.normalize();
    camRight.crossVectors(camDir, new THREE.Vector3(0, 1, 0)).normalize();

    wantDir.set(0, 0, 0);
    if (hasInput) {
      wantDir.addScaledVector(camDir, -dz);
      wantDir.addScaledVector(camRight, dx);
      wantDir.normalize();
    }

    // Accel/decel
    const accel = hasInput ? 18 : 12;
    const targetSpeed = hasInput ? maxSpeed : 0;
    speedNow.current = THREE.MathUtils.damp(speedNow.current, targetSpeed, 4, delta);
    isMoving.current = speedNow.current > 0.2;
    isRunning.current = isMoving.current && keys.shift;

    if (isMoving.current) {
      const move = wantDir.clone().multiplyScalar(speedNow.current * delta);
      pos.current.add(move);
      targetFacing.current = Math.atan2(wantDir.x, wantDir.z);
      idleTimer.current = 0;
    } else {
      idleTimer.current += delta;
    }

    // Smooth yaw
    const dy = shortestAngle(facing.current, targetFacing.current);
    facing.current += dy * Math.min(1, delta * 8);

    walkPhase.current += delta * (isMoving.current ? (isRunning.current ? 12 : 8.5) : 0);

    // Bounds
    if (!atSummit) {
      pos.current.x = THREE.MathUtils.clamp(pos.current.x, -70, 70);
      pos.current.z = THREE.MathUtils.clamp(pos.current.z, -70, 70);
    } else {
      pos.current.x = THREE.MathUtils.clamp(pos.current.x, -14, 14);
      pos.current.z = THREE.MathUtils.clamp(pos.current.z, -14, 14);
    }

    if (group.current) {
      group.current.position.copy(pos.current);
      group.current.rotation.y = facing.current;
    }

    // Camera follow (third-person with mouse wheel zoom)
    const baseDist = 6.5 + mouse.wheel;
    const height = 3.4 + mouse.wheel * 0.4;
    const camTarget = new THREE.Vector3(pos.current.x, pos.current.y + 1.4, pos.current.z);
    const behind = new THREE.Vector3(Math.sin(facing.current + Math.PI) * baseDist, height, Math.cos(facing.current + Math.PI) * baseDist);
    const desired = camTarget.clone().add(behind);
    camera.position.lerp(desired, 0.09);
    camera.lookAt(camTarget);

    // Idle look-at partner
    if (boyRef.current && girlRef.current) {
      girlRef.current.getWorldPosition(partnerLookTarget);
      boyRef.current.getWorldPosition(playerLookTarget);
    }

    // Interaction detection
    let nearest = null;
    let nearestDist = 3.4;
    for (const it of interactables || []) {
      const d = pos.current.distanceTo(new THREE.Vector3(...it.pos));
      if (d < nearestDist) {
        nearest = it;
        nearestDist = d;
      }
    }
    if ((nearest?.id || null) !== (nearbyInteraction?.id || null)) {
      setNearby(nearest);
    }

    if (keys.e && !eKeyPrev.current && nearest?.onInteract) {
      nearest.onInteract();
    }
    eKeyPrev.current = keys.e;
  });

  const wave = idleTimer.current > 6 && Math.floor(idleTimer.current) % 5 === 0;

  return (
    <group ref={group}>
      <group position={[-0.35, 0, 0]}>
        <Character
          refOuter={boyRef}
          bodyColor="#3b6dc4"
          skinColor="#f2c9a2"
          hairColor="#2a1a10"
          hairStyle="short"
          walkPhase={walkPhase.current}
          isMoving={isMoving.current}
          isRunning={isRunning.current}
          lookAt={!isMoving.current ? partnerLookTarget : null}
        />
      </group>
      <group position={[0.35, 0, 0]}>
        <Character
          refOuter={girlRef}
          bodyColor="#e07aa4"
          skinColor="#f7d1b4"
          hairColor="#3a2015"
          hairStyle="long"
          walkPhase={walkPhase.current + 0.4}
          isMoving={isMoving.current}
          isRunning={isRunning.current}
          lookAt={!isMoving.current ? playerLookTarget : null}
          wave={wave}
        />
      </group>
      {/* Holding hands: subtle bar */}
      <mesh position={[0, 1.06, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.4, 0.03, 0.04]} />
        <meshStandardMaterial color="#f7d1b4" />
      </mesh>
      <HeartFloat />
    </group>
  );
}

function shortestAngle(from, to) {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function HeartFloat() {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.position.y = 2.2 + Math.sin(clock.elapsedTime * 2) * 0.08;
    ref.current.rotation.y = clock.elapsedTime * 0.6;
    const s = 0.9 + Math.sin(clock.elapsedTime * 3) * 0.08;
    ref.current.scale.set(s, s, s);
  });
  return (
    <group ref={ref} position={[0, 2.2, 0]}>
      <mesh position={[-0.06, 0, 0]}>
        <sphereGeometry args={[0.07, 10, 10]} />
        <meshBasicMaterial color="#ff5c8a" />
      </mesh>
      <mesh position={[0.06, 0, 0]}>
        <sphereGeometry args={[0.07, 10, 10]} />
        <meshBasicMaterial color="#ff5c8a" />
      </mesh>
      <mesh position={[0, -0.06, 0]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.14, 0.14, 0.03]} />
        <meshBasicMaterial color="#ff5c8a" />
      </mesh>
    </group>
  );
}
