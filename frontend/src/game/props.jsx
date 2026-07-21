import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { seedRand } from './utils';

// Stylized low-poly tree
export function Tree({ position = [0, 0, 0], scale = 1, color = '#4fa159' }) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.18, 0.28, 1.4, 8]} />
        <meshStandardMaterial color="#7a4b28" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, 2.1, 0]}>
        <icosahedronGeometry args={[1.1, 0]} />
        <meshStandardMaterial color={color} roughness={0.7} flatShading />
      </mesh>
      <mesh castShadow position={[0.5, 2.6, 0.2]}>
        <icosahedronGeometry args={[0.75, 0]} />
        <meshStandardMaterial color={color} roughness={0.7} flatShading />
      </mesh>
      <mesh castShadow position={[-0.5, 2.5, -0.2]}>
        <icosahedronGeometry args={[0.7, 0]} />
        <meshStandardMaterial color={color} roughness={0.7} flatShading />
      </mesh>
    </group>
  );
}

export function CherryTree({ position = [0, 0, 0], scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.15, 0.22, 1.8, 8]} />
        <meshStandardMaterial color="#5a3a24" />
      </mesh>
      <mesh castShadow position={[0, 2.3, 0]}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#f9b7d0" flatShading />
      </mesh>
      <mesh castShadow position={[0.4, 2.7, 0.3]}>
        <icosahedronGeometry args={[0.6, 0]} />
        <meshStandardMaterial color="#fbc2d6" flatShading />
      </mesh>
      <mesh castShadow position={[-0.4, 2.5, -0.2]}>
        <icosahedronGeometry args={[0.6, 0]} />
        <meshStandardMaterial color="#fbc2d6" flatShading />
      </mesh>
    </group>
  );
}

export function Flower({ position = [0, 0, 0], color = '#ff7fbf' }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.3, 5]} />
        <meshStandardMaterial color="#4b8a3a" />
      </mesh>
      <mesh position={[0, 0.32, 0]}>
        <sphereGeometry args={[0.09, 8, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} />
      </mesh>
    </group>
  );
}

export function FlowerField({ center = [0, 0, 0], radius = 8, count = 60, seed = 1 }) {
  const flowers = useMemo(() => {
    const rand = seedRand(seed);
    const colors = ['#ff7fbf', '#ffd166', '#ef476f', '#c084fc', '#ffffff', '#ff6b6b'];
    const arr = [];
    for (let i = 0; i < count; i++) {
      const angle = rand() * Math.PI * 2;
      const r = Math.sqrt(rand()) * radius;
      arr.push({
        pos: [center[0] + Math.cos(angle) * r, center[1], center[2] + Math.sin(angle) * r],
        color: colors[Math.floor(rand() * colors.length)],
      });
    }
    return arr;
  }, [center, radius, count, seed]);
  return (
    <group>
      {flowers.map((f, i) => (
        <Flower key={i} position={f.pos} color={f.color} />
      ))}
    </group>
  );
}

export function Bench({ position = [0, 0, 0], rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow position={[0, 0.4, 0]}>
        <boxGeometry args={[1.6, 0.1, 0.4]} />
        <meshStandardMaterial color="#8b5a2b" />
      </mesh>
      <mesh castShadow position={[0, 0.8, -0.15]}>
        <boxGeometry args={[1.6, 0.6, 0.08]} />
        <meshStandardMaterial color="#8b5a2b" />
      </mesh>
      <mesh position={[-0.7, 0.2, 0]}>
        <boxGeometry args={[0.08, 0.4, 0.35]} />
        <meshStandardMaterial color="#3a2418" />
      </mesh>
      <mesh position={[0.7, 0.2, 0]}>
        <boxGeometry args={[0.08, 0.4, 0.35]} />
        <meshStandardMaterial color="#3a2418" />
      </mesh>
    </group>
  );
}

export function Lantern({ position = [0, 0, 0] }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 2.4, 6]} />
        <meshStandardMaterial color="#332215" />
      </mesh>
      <mesh position={[0, 2.4, 0]}>
        <sphereGeometry args={[0.22, 12, 12]} />
        <meshStandardMaterial color="#ffde8a" emissive="#ffb84a" emissiveIntensity={1.2} />
      </mesh>
      <pointLight position={[0, 2.4, 0]} intensity={0.6} distance={6} color="#ffcf7a" />
    </group>
  );
}

// Fountain
export function Fountain({ position = [0, 0, 0] }) {
  const droplets = useRef();
  useFrame(({ clock }) => {
    if (droplets.current) {
      droplets.current.children.forEach((c, i) => {
        c.position.y = 1.6 + Math.abs(Math.sin(clock.elapsedTime * 2 + i)) * 0.6;
      });
    }
  });
  return (
    <group position={position}>
      <mesh receiveShadow position={[0, 0.15, 0]}>
        <cylinderGeometry args={[2.4, 2.4, 0.3, 24]} />
        <meshStandardMaterial color="#c9c2b6" />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[2.2, 2.2, 0.2, 24]} />
        <meshStandardMaterial color="#6ec8f5" transparent opacity={0.85} metalness={0.4} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.35, 0.5, 1, 12]} />
        <meshStandardMaterial color="#d6cdb8" />
      </mesh>
      <mesh position={[0, 1.5, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#ffdc86" emissive="#ff9a3a" emissiveIntensity={0.4} />
      </mesh>
      <group ref={droplets}>
        {[...Array(6)].map((_, i) => (
          <mesh key={i} position={[Math.cos((i / 6) * Math.PI * 2) * 0.5, 1.8, Math.sin((i / 6) * Math.PI * 2) * 0.5]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial color="#a4dcff" transparent opacity={0.8} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// Cute low-poly humanoid character
export function Person({
  position = [0, 0, 0],
  rotationY = 0,
  bodyColor = '#4a90e2',
  skinColor = '#f2c9a2',
  hairColor = '#3a2418',
  hairStyle = 'short',
  scale = 1,
  bob = 0,
  walkPhase = 0,
  isMoving = false,
}) {
  const legL = useRef();
  const legR = useRef();
  const armL = useRef();
  const armR = useRef();

  useFrame(() => {
    const swing = isMoving ? Math.sin(walkPhase) * 0.6 : 0;
    if (legL.current) legL.current.rotation.x = swing;
    if (legR.current) legR.current.rotation.x = -swing;
    if (armL.current) armL.current.rotation.x = -swing * 0.6;
    if (armR.current) armR.current.rotation.x = swing * 0.6;
  });

  return (
    <group position={[position[0], position[1] + bob, position[2]]} rotation={[0, rotationY, 0]} scale={scale}>
      {/* Body */}
      <mesh castShadow position={[0, 0.9, 0]}>
        <capsuleGeometry args={[0.22, 0.4, 8, 12]} />
        <meshStandardMaterial color={bodyColor} roughness={0.75} />
      </mesh>
      {/* Head */}
      <mesh castShadow position={[0, 1.55, 0]}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial color={skinColor} roughness={0.7} />
      </mesh>
      {/* Hair */}
      {hairStyle === 'long' ? (
        <>
          <mesh position={[0, 1.65, 0]}>
            <sphereGeometry args={[0.24, 16, 16]} />
            <meshStandardMaterial color={hairColor} roughness={0.5} />
          </mesh>
          <mesh position={[0, 1.35, -0.15]}>
            <boxGeometry args={[0.42, 0.4, 0.18]} />
            <meshStandardMaterial color={hairColor} />
          </mesh>
        </>
      ) : (
        <mesh position={[0, 1.68, -0.02]}>
          <sphereGeometry args={[0.235, 16, 12, 0, Math.PI * 2, 0, Math.PI / 1.8]} />
          <meshStandardMaterial color={hairColor} />
        </mesh>
      )}
      {/* Eyes */}
      <mesh position={[-0.07, 1.57, 0.2]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.07, 1.57, 0.2]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* Smile */}
      <mesh position={[0, 1.48, 0.21]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.05, 0.008, 6, 12, Math.PI]} />
        <meshStandardMaterial color="#c94b6b" />
      </mesh>
      {/* Arms */}
      <group ref={armL} position={[-0.28, 1.1, 0]}>
        <mesh castShadow position={[0, -0.25, 0]}>
          <capsuleGeometry args={[0.07, 0.35, 6, 10]} />
          <meshStandardMaterial color={bodyColor} />
        </mesh>
        <mesh position={[0, -0.5, 0]}>
          <sphereGeometry args={[0.075, 8, 8]} />
          <meshStandardMaterial color={skinColor} />
        </mesh>
      </group>
      <group ref={armR} position={[0.28, 1.1, 0]}>
        <mesh castShadow position={[0, -0.25, 0]}>
          <capsuleGeometry args={[0.07, 0.35, 6, 10]} />
          <meshStandardMaterial color={bodyColor} />
        </mesh>
        <mesh position={[0, -0.5, 0]}>
          <sphereGeometry args={[0.075, 8, 8]} />
          <meshStandardMaterial color={skinColor} />
        </mesh>
      </group>
      {/* Legs */}
      <group ref={legL} position={[-0.11, 0.55, 0]}>
        <mesh castShadow position={[0, -0.28, 0]}>
          <capsuleGeometry args={[0.09, 0.35, 6, 10]} />
          <meshStandardMaterial color="#2b2f52" />
        </mesh>
      </group>
      <group ref={legR} position={[0.11, 0.55, 0]}>
        <mesh castShadow position={[0, -0.28, 0]}>
          <capsuleGeometry args={[0.09, 0.35, 6, 10]} />
          <meshStandardMaterial color="#2b2f52" />
        </mesh>
      </group>
    </group>
  );
}

export function Balloon({ position, color = '#ff5c8a' }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.y = position[1] + Math.sin(clock.elapsedTime * 1.5 + position[0]) * 0.15;
  });
  return (
    <group ref={ref} position={position}>
      <mesh>
        <sphereGeometry args={[0.28, 12, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.15} roughness={0.4} />
      </mesh>
      <mesh position={[0, -0.35, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 0.7, 4]} />
        <meshStandardMaterial color="#333" />
      </mesh>
    </group>
  );
}

export function Butterfly({ path = [[0, 2, 0], [2, 3, 2], [0, 2, 4], [-2, 3, 2]], speed = 0.3, color = '#ff9ac1' }) {
  const ref = useRef();
  const wingL = useRef();
  const wingR = useRef();
  useFrame(({ clock }) => {
    const t = (clock.elapsedTime * speed) % 1;
    const idx = Math.floor(t * path.length);
    const nxt = (idx + 1) % path.length;
    const k = t * path.length - idx;
    const a = path[idx];
    const b = path[nxt];
    if (ref.current) {
      ref.current.position.set(a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k);
    }
    const flap = Math.sin(clock.elapsedTime * 12) * 0.9;
    if (wingL.current) wingL.current.rotation.y = flap;
    if (wingR.current) wingR.current.rotation.y = -flap;
  });
  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[0.03, 6, 6]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <group ref={wingL} position={[-0.02, 0, 0]}>
        <mesh position={[-0.08, 0, 0]}>
          <planeGeometry args={[0.2, 0.15]} />
          <meshStandardMaterial color={color} side={2} transparent opacity={0.9} />
        </mesh>
      </group>
      <group ref={wingR} position={[0.02, 0, 0]}>
        <mesh position={[0.08, 0, 0]}>
          <planeGeometry args={[0.2, 0.15]} />
          <meshStandardMaterial color={color} side={2} transparent opacity={0.9} />
        </mesh>
      </group>
    </group>
  );
}

export function HeartHedge({ position = [0, 0, 0], scale = 1 }) {
  // Simple heart-ish shape from two spheres + inverted cone
  return (
    <group position={position} scale={scale}>
      <mesh castShadow position={[-0.4, 0.55, 0]}>
        <sphereGeometry args={[0.55, 12, 12]} />
        <meshStandardMaterial color="#3f8f3d" flatShading />
      </mesh>
      <mesh castShadow position={[0.4, 0.55, 0]}>
        <sphereGeometry args={[0.55, 12, 12]} />
        <meshStandardMaterial color="#3f8f3d" flatShading />
      </mesh>
      <mesh castShadow position={[0, 0, 0]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[0.75, 1, 12]} />
        <meshStandardMaterial color="#3f8f3d" flatShading />
      </mesh>
    </group>
  );
}
