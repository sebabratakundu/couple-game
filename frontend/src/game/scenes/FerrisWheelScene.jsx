import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Text, Billboard } from '@react-three/drei';
import Character from '../Character';
import { useGame } from '../store';
import { Tree, FlowerField } from '../props';

/**
 * FerrisWheelScene — the couple boards a cabin, the wheel rotates slowly,
 * camera smoothly orbits between: cabin interior view, external panorama,
 * and close-up on the couple.
 */
export default function FerrisWheelScene({ onExit }) {
  const { camera } = useThree();
  const [phase, setPhase] = useState('boarding'); // boarding, riding, ending
  const t = useRef(0);
  const wheelRot = useRef(0);
  const wheelRef = useRef();
  const cabinRef = useRef();
  const cameraTarget = useRef(new THREE.Vector3());
  const camMode = useRef(0); // 0 interior, 1 outside orbit, 2 close-up
  const addLove = useGame((s) => s.addLove);
  const addMemory = useGame((s) => s.addMemory);
  const registerActivity = useGame((s) => s.registerActivity);
  const finalized = useRef(false);

  useEffect(() => {
    // ESC to exit
    const h = (e) => { if (e.key === 'Escape') onExit(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onExit]);

  useEffect(() => {
    // start riding after brief boarding
    const boardTimer = setTimeout(() => setPhase('riding'), 2400);
    return () => clearTimeout(boardTimer);
  }, []);

  useFrame((_, delta) => {
    t.current += delta;

    if (phase === 'boarding') {
      // Fade-in cinematic on the cabin at bottom
      const target = new THREE.Vector3(4, 1.4, 0);
      camera.position.lerp(new THREE.Vector3(6.5, 1.8, 3.5), 0.05);
      camera.lookAt(target);
      return;
    }

    // Riding phase — wheel rotates
    wheelRot.current += delta * 0.28;
    if (wheelRef.current) wheelRef.current.rotation.z = wheelRot.current;

    // Cabin position: bottom-right cabin at (cos(rot)*5, sin(rot)*5+6, 0) — always upright
    const cabinAngle = wheelRot.current + Math.PI / 2; // start at right side
    const cx = Math.cos(cabinAngle) * 5;
    const cy = Math.sin(cabinAngle) * 5 + 6;
    if (cabinRef.current) {
      cabinRef.current.position.set(cx, cy, 0);
      cabinRef.current.rotation.z = 0; // stays upright
    }

    // Camera modes rotate every ~7 seconds
    const cycle = Math.floor(t.current / 7) % 3;
    camMode.current = cycle;

    if (cycle === 0) {
      // Interior — inside cabin looking out and at couple
      const desired = new THREE.Vector3(cx - 0.6, cy + 0.4, 1.4);
      camera.position.lerp(desired, 0.045);
      cameraTarget.current.set(cx, cy + 0.2, 0);
      camera.lookAt(cameraTarget.current);
    } else if (cycle === 1) {
      // Outside orbit — beauty shot
      const orbit = t.current * 0.15;
      const desired = new THREE.Vector3(Math.cos(orbit) * 18, 10, Math.sin(orbit) * 18);
      camera.position.lerp(desired, 0.035);
      camera.lookAt(0, 6, 0);
    } else {
      // Close-up on couple
      const desired = new THREE.Vector3(cx + 1.3, cy + 0.6, 2.5);
      camera.position.lerp(desired, 0.045);
      camera.lookAt(cx, cy, 0);
    }

    // End after ~28s
    if (t.current > 28 && !finalized.current) {
      finalized.current = true;
      addLove(50, 'Ferris Wheel ride');
      addMemory({
        id: 'first_ride', title: 'First Ride Together',
        location: 'Ferris Wheel',
        description: 'The world felt small from up there — everything except us two.',
        emoji: '🎡',
      });
      registerActivity();
      setPhase('ending');
      setTimeout(onExit, 3500);
    }
  });

  return (
    <group>
      <ambientLight intensity={0.55} color="#fff2d0" />
      <hemisphereLight args={['#cfe6ff', '#5cae5c', 0.5]} />
      <directionalLight position={[20, 30, 20]} intensity={1.6} color="#fff5e0" castShadow />

      {/* Base ground */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#5fae5c" />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[6, 8, 40]} />
        <meshStandardMaterial color="#d9c39b" />
      </mesh>

      {/* Ferris wheel structure */}
      <mesh position={[0, 3, 0]}>
        <cylinderGeometry args={[0.4, 0.5, 6, 8]} />
        <meshStandardMaterial color="#775544" />
      </mesh>
      <mesh position={[-3, 3, 0]} rotation={[0, 0, -0.5]}>
        <cylinderGeometry args={[0.15, 0.15, 7, 8]} />
        <meshStandardMaterial color="#8a5a3a" />
      </mesh>
      <mesh position={[3, 3, 0]} rotation={[0, 0, 0.5]}>
        <cylinderGeometry args={[0.15, 0.15, 7, 8]} />
        <meshStandardMaterial color="#8a5a3a" />
      </mesh>

      <group ref={wheelRef} position={[0, 6, 0]}>
        <mesh>
          <torusGeometry args={[5, 0.15, 10, 40]} />
          <meshStandardMaterial color="#f79256" metalness={0.4} roughness={0.4} />
        </mesh>
        <mesh>
          <torusGeometry args={[4.6, 0.06, 8, 32]} />
          <meshStandardMaterial color="#c94b6b" />
        </mesh>
        {[...Array(8)].map((_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <group key={i}>
              <mesh rotation={[0, 0, a]}>
                <boxGeometry args={[10, 0.06, 0.06]} />
                <meshStandardMaterial color="#f79256" />
              </mesh>
              {/* cabin at end of spoke */}
              <group position={[Math.cos(a) * 5, Math.sin(a) * 5, 0]}>
                <mesh>
                  <boxGeometry args={[0.7, 0.5, 0.7]} />
                  <meshStandardMaterial color={['#ff5c8a', '#ffd166', '#a8dadc', '#c084fc'][i % 4]} />
                </mesh>
                <mesh position={[0, 0.35, 0]}>
                  <coneGeometry args={[0.5, 0.3, 4]} />
                  <meshStandardMaterial color="#3a1c50" />
                </mesh>
              </group>
            </group>
          );
        })}
      </group>

      {/* Our cabin — larger, with couple inside */}
      <group ref={cabinRef}>
        {/* Cabin frame */}
        <mesh castShadow>
          <boxGeometry args={[1.4, 1.1, 1.2]} />
          <meshStandardMaterial color="#ffe1d0" transparent opacity={0.9} roughness={0.15} metalness={0.3} />
        </mesh>
        <mesh position={[0, 0.7, 0]}>
          <coneGeometry args={[1, 0.6, 4]} />
          <meshStandardMaterial color="#c94b6b" />
        </mesh>
        {/* Window frame */}
        <mesh>
          <boxGeometry args={[1.42, 0.05, 1.22]} />
          <meshStandardMaterial color="#3a1c50" />
        </mesh>
        {/* Couple sitting */}
        <group position={[-0.28, -0.3, 0]} scale={0.42}>
          <Character bodyColor="#3b6dc4" hairStyle="short" hairColor="#2a1a10" isSitting lookAt={new THREE.Vector3(0.4, 1.5, 0)} smileStrength={1.5} />
        </group>
        <group position={[0.28, -0.3, 0]} scale={0.42}>
          <Character bodyColor="#e07aa4" hairStyle="long" hairColor="#3a2015" isSitting lookAt={new THREE.Vector3(-0.4, 1.5, 0)} smileStrength={1.5} />
        </group>
        {/* Floating hearts */}
        <FloatingHeart position={[0, 0.9, 0]} />
      </group>

      {/* Environment decoration around the wheel */}
      {[...Array(20)].map((_, i) => {
        const a = (i / 20) * Math.PI * 2;
        const r = 15 + (i % 3) * 3;
        return <Tree key={i} position={[Math.cos(a) * r, 0, Math.sin(a) * r]} scale={0.9 + (i % 3) * 0.2} />;
      })}
      <FlowerField center={[0, 0, 8]} radius={6} count={40} seed={11} />
      <FlowerField center={[0, 0, -8]} radius={6} count={40} seed={22} />

      {/* HUD */}
      <Billboard position={[0, 13, 0]}>
        <Text fontSize={0.7} color="#ffffff" outlineColor="#c94b6b" outlineWidth={0.05}>
          Ferris Wheel Ride 🎡
        </Text>
      </Billboard>
      <Billboard position={[camera.position.x, camera.position.y - 1.2, camera.position.z]}>
        <Text fontSize={0.15} color="#ffffff" outlineColor="#3a1c50" outlineWidth={0.015}>
          {phase === 'boarding' ? 'Boarding the cabin…' : phase === 'ending' ? 'What a ride ❤️' : 'ESC to skip'}
        </Text>
      </Billboard>
    </group>
  );
}

function FloatingHeart({ position }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.position.y = position[1] + Math.sin(clock.elapsedTime * 2) * 0.06;
    ref.current.rotation.y = clock.elapsedTime * 0.8;
  });
  return (
    <group ref={ref} position={position}>
      <mesh position={[-0.05, 0, 0]}>
        <sphereGeometry args={[0.06, 10, 10]} />
        <meshBasicMaterial color="#ff5c8a" />
      </mesh>
      <mesh position={[0.05, 0, 0]}>
        <sphereGeometry args={[0.06, 10, 10]} />
        <meshBasicMaterial color="#ff5c8a" />
      </mesh>
      <mesh position={[0, -0.05, 0]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.11, 0.11, 0.03]} />
        <meshBasicMaterial color="#ff5c8a" />
      </mesh>
    </group>
  );
}
