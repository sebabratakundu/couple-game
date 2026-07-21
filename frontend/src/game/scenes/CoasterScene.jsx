import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import Character from '../Character';
import { useGame } from '../store';
import { Tree, FlowerField } from '../props';

/**
 * CoasterScene — full spline track roller coaster ride cinematic.
 * The couple sits in the car, hands up, screaming, laughing. Camera follows the car.
 */
export default function CoasterScene({ onExit }) {
  const { camera } = useThree();
  const t = useRef(0);
  const carRef = useRef();
  const addLove = useGame((s) => s.addLove);
  const addMemory = useGame((s) => s.addMemory);
  const registerActivity = useGame((s) => s.registerActivity);
  const registerPhoto = useGame((s) => s.registerPhoto);
  const finalized = useRef(false);
  const [phase, setPhase] = useState('starting');
  const [handsUp, setHandsUp] = useState(false);
  const [message, setMessage] = useState('Hold on tight!');

  // Build spline curve
  const curve = useMemo(() => {
    const points = [
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(6, 2, -4),
      new THREE.Vector3(12, 5, -8),
      new THREE.Vector3(15, 12, -6),  // top of first hill
      new THREE.Vector3(14, 14, -2),
      new THREE.Vector3(10, 12, 4),   // drop
      new THREE.Vector3(4, 6, 6),
      new THREE.Vector3(-2, 3, 8),
      new THREE.Vector3(-8, 5, 4),
      new THREE.Vector3(-12, 8, -2),  // second hill
      new THREE.Vector3(-14, 10, -8),
      new THREE.Vector3(-10, 6, -14),
      new THREE.Vector3(-4, 3, -12),
      new THREE.Vector3(2, 2, -8),
      new THREE.Vector3(6, 1.5, -3),
      new THREE.Vector3(0, 1, 0),
    ];
    return new THREE.CatmullRomCurve3(points, true);
  }, []);

  // Track visualization
  const trackMesh = useMemo(() => {
    return new THREE.TubeGeometry(curve, 300, 0.06, 8, true);
  }, [curve]);
  const rail1 = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 300; i++) {
      const u = i / 300;
      const p = curve.getPoint(u);
      const tangent = curve.getTangent(u);
      const normal = new THREE.Vector3(0, 1, 0);
      const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize().multiplyScalar(0.32);
      pts.push(p.clone().add(binormal));
    }
    const c = new THREE.CatmullRomCurve3(pts, true);
    return new THREE.TubeGeometry(c, 300, 0.04, 6, true);
  }, [curve]);
  const rail2 = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 300; i++) {
      const u = i / 300;
      const p = curve.getPoint(u);
      const tangent = curve.getTangent(u);
      const normal = new THREE.Vector3(0, 1, 0);
      const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize().multiplyScalar(-0.32);
      pts.push(p.clone().add(binormal));
    }
    const c = new THREE.CatmullRomCurve3(pts, true);
    return new THREE.TubeGeometry(c, 300, 0.04, 6, true);
  }, [curve]);

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onExit(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onExit]);

  useEffect(() => {
    const stages = [
      { at: 0, msg: 'Hold on tight!' },
      { at: 2.5, msg: 'Climbing…', handsUp: false },
      { at: 8, msg: 'HANDS UP! 🙌', handsUp: true },
      { at: 14, msg: 'AAAAAH! 😂' },
      { at: 22, msg: 'Wow, look at the view!' },
      { at: 28, msg: 'Almost done — say cheese! 📸' },
      { at: 33, msg: 'What a ride ❤️' },
    ];
    const timers = stages.map((s) => setTimeout(() => {
      setMessage(s.msg);
      if (s.handsUp !== undefined) setHandsUp(s.handsUp);
      if (s.msg.includes('cheese')) {
        registerPhoto();
        addMemory({
          id: 'coaster_photo', title: 'Ride Photo!',
          location: 'Roller Coaster',
          description: 'You both had matching wind-swept hair and giant smiles.',
          emoji: '📸',
        });
      }
    }, s.at * 1000));
    return () => timers.forEach(clearTimeout);
  }, [addMemory, registerPhoto]);

  useFrame((_, delta) => {
    // Duration ~36 seconds for full loop
    t.current += delta / 36;
    const u = t.current % 1;

    const p = curve.getPoint(u);
    const tangent = curve.getTangent(u);
    const nextP = curve.getPoint((u + 0.01) % 1);

    if (carRef.current) {
      carRef.current.position.copy(p);
      carRef.current.lookAt(nextP);
    }

    // Camera follows behind & above
    const camOff = tangent.clone().multiplyScalar(-4);
    camOff.y += 2;
    const desired = p.clone().add(camOff);
    camera.position.lerp(desired, 0.1);
    camera.lookAt(p);

    if (t.current > 1.05 && !finalized.current) {
      finalized.current = true;
      addLove(70, 'Roller Coaster');
      addMemory({
        id: 'coaster', title: 'Screams & Laughs',
        location: 'Roller Coaster',
        description: 'Neither of us stopped smiling for hours.',
        emoji: '🎢',
      });
      registerActivity();
      setTimeout(onExit, 2000);
    }
  });

  const walkPhase = useRef(0);

  return (
    <group>
      <ambientLight intensity={0.55} color="#fff2d0" />
      <hemisphereLight args={['#cfe6ff', '#5cae5c', 0.5]} />
      <directionalLight position={[20, 30, 20]} intensity={1.6} color="#fff5e0" castShadow />

      {/* Ground */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#5fae5c" />
      </mesh>

      {/* Track supports */}
      <TrackSupports curve={curve} />

      {/* Track tubes */}
      <mesh geometry={trackMesh}>
        <meshStandardMaterial color="#c94b6b" metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh geometry={rail1}>
        <meshStandardMaterial color="#e63946" metalness={0.6} roughness={0.2} />
      </mesh>
      <mesh geometry={rail2}>
        <meshStandardMaterial color="#e63946" metalness={0.6} roughness={0.2} />
      </mesh>

      {/* Coaster car */}
      <group ref={carRef}>
        <mesh castShadow>
          <boxGeometry args={[0.9, 0.35, 1.3]} />
          <meshStandardMaterial color="#ffd166" metalness={0.4} />
        </mesh>
        <mesh position={[0, 0.25, 0]}>
          <boxGeometry args={[0.7, 0.2, 1.1]} />
          <meshStandardMaterial color="#c94b6b" />
        </mesh>
        {/* Safety bars */}
        <mesh position={[0, 0.45, 0]}>
          <torusGeometry args={[0.4, 0.03, 6, 12, Math.PI]} />
          <meshStandardMaterial color="#3a1c50" metalness={0.7} />
        </mesh>
        {/* Couple sitting */}
        <group position={[-0.22, 0.15, -0.1]} scale={0.36}>
          <Character bodyColor="#3b6dc4" hairStyle="short" hairColor="#2a1a10" isSitting handsUp={handsUp} smileStrength={1.5} />
        </group>
        <group position={[0.22, 0.15, -0.1]} scale={0.36}>
          <Character bodyColor="#e07aa4" hairStyle="long" hairColor="#3a2015" isSitting handsUp={handsUp} smileStrength={1.7} />
        </group>
      </group>

      {/* Environment */}
      {[...Array(30)].map((_, i) => {
        const a = (i / 30) * Math.PI * 2;
        const r = 22 + (i % 3) * 3;
        return <Tree key={i} position={[Math.cos(a) * r, 0, Math.sin(a) * r]} scale={0.9 + (i % 3) * 0.2} />;
      })}
      <FlowerField center={[0, 0, -20]} radius={6} count={40} seed={13} />
      <FlowerField center={[0, 0, 20]} radius={6} count={40} seed={14} />

      {/* HUD */}
      <Billboard position={[camera.position.x, camera.position.y + 1.4, camera.position.z]}>
        <Text fontSize={0.3} color="#ffd166" outlineColor="#3a1c50" outlineWidth={0.03}>{message}</Text>
      </Billboard>
    </group>
  );
}

function TrackSupports({ curve }) {
  const supports = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 40; i++) {
      const u = i / 40;
      const p = curve.getPoint(u);
      if (p.y > 1.5) {
        arr.push([p.x, p.y, p.z]);
      }
    }
    return arr;
  }, [curve]);
  return (
    <>
      {supports.map((p, i) => (
        <mesh key={i} position={[p[0], p[1] / 2, p[2]]}>
          <cylinderGeometry args={[0.06, 0.09, p[1], 6]} />
          <meshStandardMaterial color="#5b3a24" />
        </mesh>
      ))}
    </>
  );
}
