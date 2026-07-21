import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import Character from '../Character';
import { useGame } from '../store';
import { keys } from '../Player';
import { Tree, FlowerField } from '../props';

/**
 * BoatScene — Rent a boat, sit inside, W accelerate, S reverse, A/D turn.
 * Water reacts with ripples. Ducks swim around. Beautiful lakeside setting.
 */
export default function BoatScene({ onExit }) {
  const { camera } = useThree();
  const boatRef = useRef();
  const boatPos = useRef(new THREE.Vector3(0, 0.25, 0));
  const boatVel = useRef(new THREE.Vector3());
  const boatYaw = useRef(0);
  const paddlePhase = useRef(0);
  const t = useRef(0);
  const addLove = useGame((s) => s.addLove);
  const addMemory = useGame((s) => s.addMemory);
  const registerActivity = useGame((s) => s.registerActivity);
  const finalized = useRef(false);
  const [rippleTime, setRippleTime] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  const [message, setMessage] = useState('Rent the boat and enjoy the lake ❤️');

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onExit(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onExit]);

  useFrame((_, delta) => {
    t.current += delta;
    // Steering
    let steer = 0;
    if (keys.a) steer += 1;
    if (keys.d) steer -= 1;
    boatYaw.current += steer * delta * 0.8;

    // Throttle
    let throttle = 0;
    if (keys.w) throttle = 1;
    if (keys.s) throttle = -0.5;

    const dir = new THREE.Vector3(Math.sin(boatYaw.current), 0, Math.cos(boatYaw.current));
    boatVel.current.addScaledVector(dir, throttle * delta * 3);
    // Damping
    boatVel.current.multiplyScalar(0.96);

    boatPos.current.add(boatVel.current.clone().multiplyScalar(delta * 60));
    // Clamp within lake radius
    const r = Math.hypot(boatPos.current.x, boatPos.current.z);
    const maxR = 22;
    if (r > maxR) {
      const dirBack = new THREE.Vector3(boatPos.current.x, 0, boatPos.current.z).normalize().multiplyScalar(maxR);
      boatPos.current.x = dirBack.x;
      boatPos.current.z = dirBack.z;
      boatVel.current.multiplyScalar(0.3);
    }

    // Bob
    boatPos.current.y = 0.25 + Math.sin(t.current * 2) * 0.05;

    setIsMoving(Math.abs(throttle) > 0.1);
    if (isMoving) paddlePhase.current += delta * 4;
    setRippleTime(t.current);

    if (boatRef.current) {
      boatRef.current.position.copy(boatPos.current);
      boatRef.current.rotation.y = boatYaw.current;
      // Slight roll on turns
      boatRef.current.rotation.z = -steer * 0.05;
      boatRef.current.rotation.x = throttle * -0.03 + Math.sin(t.current * 2) * 0.02;
    }

    // Camera follows boat from behind and above
    const camOffset = new THREE.Vector3(-Math.sin(boatYaw.current) * 7, 4, -Math.cos(boatYaw.current) * 7);
    const camTarget = boatPos.current.clone().add(new THREE.Vector3(0, 0.8, 0));
    camera.position.lerp(boatPos.current.clone().add(camOffset), 0.06);
    camera.lookAt(camTarget);

    // Auto-complete after 45s
    if (t.current > 45 && !finalized.current) {
      finalized.current = true;
      addLove(60, 'Boating adventure');
      addMemory({
        id: 'boat_ride', title: 'Boat Ride Together',
        location: 'Lake',
        description: 'You rowed in circles. She said this was her favorite part of the day.',
        emoji: '🚣',
      });
      registerActivity();
      setMessage('What a beautiful ride ❤️  Press ESC to return');
    }
  });

  return (
    <group>
      <ambientLight intensity={0.55} color="#fff2d0" />
      <hemisphereLight args={['#cfe6ff', '#5cae5c', 0.5]} />
      <directionalLight position={[20, 30, 20]} intensity={1.6} color="#fff5e0" castShadow />

      {/* Lake bed */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]}>
        <circleGeometry args={[30, 40]} />
        <meshStandardMaterial color="#3a5a4a" />
      </mesh>

      {/* Water surface with animated shader */}
      <WaterSurface time={rippleTime} boatX={boatPos.current.x} boatZ={boatPos.current.z} />

      {/* Boat */}
      <group ref={boatRef}>
        <Boat />
        {/* Couple inside */}
        <group position={[-0.28, 0.15, 0.15]} scale={0.42} rotation={[0, Math.PI / 8, 0]}>
          <Character bodyColor="#3b6dc4" hairStyle="short" hairColor="#2a1a10" isSitting lookAt={new THREE.Vector3(0.5, 1.5, 0.4)} smileStrength={1.6} />
        </group>
        <group position={[0.28, 0.15, 0.15]} scale={0.42} rotation={[0, -Math.PI / 8, 0]}>
          <Character bodyColor="#e07aa4" hairStyle="long" hairColor="#3a2015" isSitting lookAt={new THREE.Vector3(-0.5, 1.5, 0.4)} smileStrength={1.6} />
        </group>
        {/* Paddle */}
        <group position={[0.7, 0.3, -0.1]} rotation={[0, 0, Math.sin(paddlePhase.current) * 0.6 - 0.2]}>
          <mesh>
            <cylinderGeometry args={[0.03, 0.03, 1.2, 6]} />
            <meshStandardMaterial color="#8b5a2b" />
          </mesh>
          <mesh position={[0, -0.7, 0]}>
            <boxGeometry args={[0.2, 0.3, 0.04]} />
            <meshStandardMaterial color="#a67b58" />
          </mesh>
        </group>
      </group>

      {/* Shoreline decoration */}
      <ShoreDecor />
      {/* Ducks */}
      <Duck position={[8, 0.05, 5]} phase={0} />
      <Duck position={[-6, 0.05, 8]} phase={1.5} />
      <Duck position={[10, 0.05, -8]} phase={2.5} />
      <Duck position={[-10, 0.05, -5]} phase={0.8} />

      {/* HUD */}
      <Billboard position={[0, 8, 0]}>
        <Text fontSize={0.8} color="#ffffff" outlineColor="#3a1c50" outlineWidth={0.06}>Boating on the Lake 🚣</Text>
      </Billboard>
      <Billboard position={[0, 6.8, 0]}>
        <Text fontSize={0.35} color="#ffd166" outlineColor="#3a1c50" outlineWidth={0.03}>{message}</Text>
      </Billboard>
      <Billboard position={[0, 6, 0]}>
        <Text fontSize={0.22} color="#ffffff" outlineColor="#3a1c50" outlineWidth={0.02}>W accelerate · S reverse · A/D steer · ESC leave</Text>
      </Billboard>
    </group>
  );
}

function Boat() {
  return (
    <group>
      {/* Hull */}
      <mesh castShadow>
        <boxGeometry args={[1.4, 0.35, 2.6]} />
        <meshStandardMaterial color="#7a4b28" roughness={0.6} />
      </mesh>
      <mesh position={[0, -0.05, 1.3]} rotation={[Math.PI / 4, 0, 0]}>
        <boxGeometry args={[1.4, 0.4, 0.5]} />
        <meshStandardMaterial color="#7a4b28" />
      </mesh>
      <mesh position={[0, -0.05, -1.3]} rotation={[-Math.PI / 4, 0, 0]}>
        <boxGeometry args={[1.4, 0.4, 0.5]} />
        <meshStandardMaterial color="#7a4b28" />
      </mesh>
      {/* Interior floor */}
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[1.1, 0.05, 2.2]} />
        <meshStandardMaterial color="#c9a074" />
      </mesh>
      {/* Bench */}
      <mesh position={[0, 0.15, 0.4]}>
        <boxGeometry args={[1.2, 0.1, 0.5]} />
        <meshStandardMaterial color="#5b3a24" />
      </mesh>
      {/* Little decoration */}
      <mesh position={[0, 0.4, -1.2]}>
        <sphereGeometry args={[0.12, 10, 10]} />
        <meshStandardMaterial color="#c94b6b" emissive="#c94b6b" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

function WaterSurface({ time, boatX, boatZ }) {
  const materialRef = useRef();
  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = time;
      materialRef.current.uniforms.uBoat.value.set(boatX, boatZ);
    }
  });
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uBoat: { value: new THREE.Vector2() },
        uColor1: { value: new THREE.Color('#5cb5e8') },
        uColor2: { value: new THREE.Color('#2f6a9a') },
      },
      vertexShader: `
        uniform float uTime;
        uniform vec2 uBoat;
        varying vec2 vUv;
        varying float vWave;
        void main() {
          vec3 p = position;
          float w1 = sin(p.x * 0.4 + uTime * 1.5) * 0.06;
          float w2 = sin(p.z * 0.3 + uTime * 1.2) * 0.06;
          float dx = p.x - uBoat.x;
          float dz = p.z - uBoat.y;
          float d = sqrt(dx*dx + dz*dz);
          float ripple = sin(d * 2.0 - uTime * 5.0) * 0.08 * exp(-d * 0.25);
          p.y += w1 + w2 + ripple;
          vWave = w1 + w2 + ripple;
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        varying vec2 vUv;
        varying float vWave;
        void main() {
          float k = smoothstep(-0.15, 0.15, vWave);
          vec3 c = mix(uColor2, uColor1, k);
          gl_FragColor = vec4(c, 0.92);
        }
      `,
      transparent: true,
    });
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[60, 60, 80, 80]} />
      <primitive object={material} ref={materialRef} attach="material" />
    </mesh>
  );
}

function ShoreDecor() {
  const items = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const r = 26 + Math.sin(a * 3) * 2;
      arr.push({ pos: [Math.cos(a) * r, 0, Math.sin(a) * r], scale: 0.9 + (i % 3) * 0.2 });
    }
    return arr;
  }, []);
  return (
    <group>
      {/* Shore ring */}
      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[24, 30, 40]} />
        <meshStandardMaterial color="#5fae5c" />
      </mesh>
      {items.map((t, i) => (
        <Tree key={i} position={t.pos} scale={t.scale} color={i % 3 === 0 ? '#4fa159' : i % 3 === 1 ? '#3f8f3d' : '#65b06a'} />
      ))}
      <FlowerField center={[24, 0, 0]} radius={4} count={30} seed={5} />
      <FlowerField center={[-24, 0, 0]} radius={4} count={30} seed={7} />
      <FlowerField center={[0, 0, 24]} radius={4} count={30} seed={9} />
      <FlowerField center={[0, 0, -24]} radius={4} count={30} seed={11} />
      {/* Dock */}
      <mesh position={[0, 0.05, -24]}>
        <boxGeometry args={[3, 0.15, 4]} />
        <meshStandardMaterial color="#8b5a2b" />
      </mesh>
    </group>
  );
}

function Duck({ position, phase }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (ref.current) {
      const t = clock.elapsedTime * 0.4 + phase;
      ref.current.position.x = position[0] + Math.cos(t) * 1.5;
      ref.current.position.z = position[2] + Math.sin(t) * 1.5;
      ref.current.position.y = position[1] + Math.sin(clock.elapsedTime * 3) * 0.03;
      ref.current.rotation.y = t + Math.PI / 2;
    }
  });
  return (
    <group ref={ref} position={position}>
      <mesh>
        <sphereGeometry args={[0.18, 12, 12]} />
        <meshStandardMaterial color="#f5efe1" />
      </mesh>
      <mesh position={[0.12, 0.16, 0]}>
        <sphereGeometry args={[0.1, 10, 10]} />
        <meshStandardMaterial color="#f5efe1" />
      </mesh>
      <mesh position={[0.22, 0.16, 0]}>
        <coneGeometry args={[0.05, 0.09, 6]} />
        <meshStandardMaterial color="#f79256" />
      </mesh>
    </group>
  );
}
