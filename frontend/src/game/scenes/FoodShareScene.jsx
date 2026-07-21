import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import Character from '../Character';
import { useGame } from '../store';
import { Tree, FlowerField, Bench } from '../props';
import { playChime } from '../audio';

/**
 * FoodShareScene — shared-eating cinematic. Camera orbits around the couple
 * sitting at a small round table with the chosen food between them.
 * Runs ~14 seconds then returns to park.
 */
export default function FoodShareScene({ food, onExit }) {
  const { camera } = useThree();
  const t = useRef(0);
  const addLove = useGame((s) => s.addLove);
  const addMemory = useGame((s) => s.addMemory);
  const registerFoodShared = useGame((s) => s.registerFoodShared);
  const registerActivity = useGame((s) => s.registerActivity);
  const [caption, setCaption] = useState('');
  const finalized = useRef(false);

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onExit(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onExit]);

  useEffect(() => {
    const stages = [
      { at: 0.5, msg: food.captions[0] },
      { at: 4, msg: food.captions[1] },
      { at: 8, msg: food.captions[2] },
      { at: 12, msg: food.captions[3] },
    ];
    const timers = stages.map((s) => setTimeout(() => setCaption(s.msg), s.at * 1000));
    playChime();
    return () => timers.forEach(clearTimeout);
  }, [food]);

  useFrame((_, delta) => {
    t.current += delta;
    // Slow orbit around the table
    const angle = t.current * 0.35;
    const r = 4.5;
    camera.position.lerp(new THREE.Vector3(Math.cos(angle) * r, 2.2 + Math.sin(t.current * 0.4) * 0.2, Math.sin(angle) * r), 0.05);
    camera.lookAt(0, 1.1, 0);

    if (t.current > 14 && !finalized.current) {
      finalized.current = true;
      addLove(food.love, food.name);
      addMemory({
        id: food.id,
        title: food.title,
        location: 'Food Street',
        description: food.desc,
        emoji: food.emoji,
      });
      registerFoodShared();
      registerActivity();
      setTimeout(onExit, 1500);
    }
  });

  return (
    <group>
      <ambientLight intensity={0.65} color="#fff2d0" />
      <hemisphereLight args={['#ffddc4', '#5cae5c', 0.55]} />
      <directionalLight position={[10, 20, 8]} intensity={1.4} color="#fff5e0" castShadow />

      {/* Ground */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#5fae5c" />
      </mesh>

      {/* Round table */}
      <mesh castShadow receiveShadow position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.7, 0.7, 0.08, 24]} />
        <meshStandardMaterial color="#c94b6b" />
      </mesh>
      <mesh position={[0, 0.75, 0]}>
        <cylinderGeometry args={[0.66, 0.66, 0.02, 24]} />
        <meshStandardMaterial color="#ffe1d0" />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.1, 0.14, 0.7, 12]} />
        <meshStandardMaterial color="#5b3a24" />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 0.06, 16]} />
        <meshStandardMaterial color="#5b3a24" />
      </mesh>

      {/* The food on the table */}
      <FoodItem type={food.type} />

      {/* Two chairs */}
      <group position={[-1.2, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <Chair />
      </group>
      <group position={[1.2, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <Chair />
      </group>

      {/* Couple sitting */}
      <group position={[-0.9, 0.35, 0]} rotation={[0, Math.PI / 2, 0]} scale={0.9}>
        <Character
          bodyColor="#3b6dc4"
          hairStyle="short"
          hairColor="#2a1a10"
          isSitting
          lookAt={new THREE.Vector3(1, 1.5, 0)}
          smileStrength={1.7}
        />
      </group>
      <group position={[0.9, 0.35, 0]} rotation={[0, -Math.PI / 2, 0]} scale={0.9}>
        <Character
          bodyColor="#e07aa4"
          hairStyle="long"
          hairColor="#3a2015"
          isSitting
          lookAt={new THREE.Vector3(-1, 1.5, 0)}
          smileStrength={1.8}
        />
      </group>

      {/* Floating hearts */}
      <FloatingHearts />

      {/* Decor around */}
      <Bench position={[3, 0, -3]} rotation={[0, -Math.PI / 4, 0]} />
      <Bench position={[-3, 0, -3]} rotation={[0, Math.PI / 4, 0]} />
      <Tree position={[5, 0, -5]} scale={1.1} />
      <Tree position={[-5, 0, -5]} scale={1.1} />
      <Tree position={[6, 0, 3]} scale={1} />
      <Tree position={[-6, 0, 3]} scale={1} />
      <FlowerField center={[0, 0, -8]} radius={5} count={40} seed={food.id.length + 3} />

      {/* HUD */}
      <Billboard position={[0, 4, 0]}>
        <Text fontSize={0.55} color="#ffffff" outlineColor="#c94b6b" outlineWidth={0.05}>
          {food.emoji}  {food.name}
        </Text>
      </Billboard>
      <Billboard position={[0, 3.3, 0]}>
        <Text fontSize={0.28} color="#ffd166" outlineColor="#3a1c50" outlineWidth={0.025}>
          {caption}
        </Text>
      </Billboard>
      <Billboard position={[0, 2.8, 0]}>
        <Text fontSize={0.16} color="#ffffff" outlineColor="#3a1c50" outlineWidth={0.015}>
          ESC to skip
        </Text>
      </Billboard>
    </group>
  );
}

function Chair() {
  return (
    <group>
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[0.55, 0.08, 0.55]} />
        <meshStandardMaterial color="#8b5a2b" />
      </mesh>
      <mesh position={[0, 0.75, -0.24]}>
        <boxGeometry args={[0.55, 0.7, 0.06]} />
        <meshStandardMaterial color="#8b5a2b" />
      </mesh>
      <mesh position={[-0.22, 0.16, -0.22]}>
        <cylinderGeometry args={[0.03, 0.03, 0.32, 6]} />
        <meshStandardMaterial color="#5b3a24" />
      </mesh>
      <mesh position={[0.22, 0.16, -0.22]}>
        <cylinderGeometry args={[0.03, 0.03, 0.32, 6]} />
        <meshStandardMaterial color="#5b3a24" />
      </mesh>
      <mesh position={[-0.22, 0.16, 0.22]}>
        <cylinderGeometry args={[0.03, 0.03, 0.32, 6]} />
        <meshStandardMaterial color="#5b3a24" />
      </mesh>
      <mesh position={[0.22, 0.16, 0.22]}>
        <cylinderGeometry args={[0.03, 0.03, 0.32, 6]} />
        <meshStandardMaterial color="#5b3a24" />
      </mesh>
    </group>
  );
}

function FoodItem({ type }) {
  if (type === 'ice_cream') {
    return (
      <group position={[0, 0.85, 0]}>
        <mesh>
          <coneGeometry args={[0.12, 0.3, 8]} rotation={[Math.PI, 0, 0]} />
          <meshStandardMaterial color="#c9a074" />
        </mesh>
        <mesh position={[0, 0.15, 0]}>
          <sphereGeometry args={[0.14, 12, 12]} />
          <meshStandardMaterial color="#ffd6e0" />
        </mesh>
        <mesh position={[0.06, 0.28, 0.03]}>
          <sphereGeometry args={[0.11, 12, 12]} />
          <meshStandardMaterial color="#ffb1c8" />
        </mesh>
      </group>
    );
  }
  if (type === 'pizza') {
    return (
      <group position={[0, 0.8, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.35, 16]} />
          <meshStandardMaterial color="#c9a074" />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <circleGeometry args={[0.32, 16]} />
          <meshStandardMaterial color="#e63946" />
        </mesh>
        {/* Cheese blobs */}
        {[...Array(6)].map((_, i) => {
          const a = (i / 6) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.18, 0.04, Math.sin(a) * 0.18]}>
              <sphereGeometry args={[0.04, 6, 6]} />
              <meshStandardMaterial color="#ffd166" />
            </mesh>
          );
        })}
      </group>
    );
  }
  if (type === 'cotton_candy') {
    return (
      <group position={[0, 0.9, 0]}>
        <mesh>
          <cylinderGeometry args={[0.02, 0.02, 0.5, 6]} />
          <meshStandardMaterial color="#5b3a24" />
        </mesh>
        <mesh position={[0, 0.25, 0]}>
          <sphereGeometry args={[0.2, 12, 12]} />
          <meshStandardMaterial color="#ffb1c8" flatShading />
        </mesh>
        <mesh position={[0.08, 0.3, 0.05]}>
          <sphereGeometry args={[0.14, 12, 12]} />
          <meshStandardMaterial color="#ff9ac1" flatShading />
        </mesh>
        <mesh position={[-0.08, 0.32, -0.05]}>
          <sphereGeometry args={[0.13, 12, 12]} />
          <meshStandardMaterial color="#ffc5d8" flatShading />
        </mesh>
      </group>
    );
  }
  // coffee (two cups)
  return (
    <group position={[0, 0.82, 0]}>
      <group position={[-0.15, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.09, 0.07, 0.15, 12]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.085, 0.085, 0.02, 12]} />
          <meshStandardMaterial color="#5b3a24" />
        </mesh>
        <mesh position={[0.11, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.05, 0.012, 6, 12, Math.PI]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      </group>
      <group position={[0.15, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.09, 0.07, 0.15, 12]} />
          <meshStandardMaterial color="#ffe1d0" />
        </mesh>
        <mesh position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.085, 0.085, 0.02, 12]} />
          <meshStandardMaterial color="#5b3a24" />
        </mesh>
      </group>
      {/* Steam */}
      <mesh position={[0, 0.3, 0]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

function FloatingHearts() {
  const hearts = React.useMemo(() => (
    [...Array(6)].map((_, i) => ({
      x: (Math.random() - 0.5) * 2.5,
      z: (Math.random() - 0.5) * 2.5,
      phase: i * 0.6,
      speed: 0.6 + Math.random() * 0.4,
    }))
  ), []);
  const refs = useRef([]);
  useFrame(({ clock }) => {
    hearts.forEach((h, i) => {
      if (refs.current[i]) {
        const t = (clock.elapsedTime * h.speed + h.phase) % 4;
        refs.current[i].position.set(h.x, 1.2 + t * 0.4, h.z);
        refs.current[i].scale.setScalar(0.9 + Math.sin(clock.elapsedTime * 3 + i) * 0.1);
        if (refs.current[i].material) {
          refs.current[i].material.opacity = Math.max(0, 1 - t / 4);
        }
      }
    });
  });
  return (
    <group>
      {hearts.map((h, i) => (
        <mesh key={i} ref={(el) => refs.current[i] = el} position={[h.x, 1.2, h.z]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshBasicMaterial color="#ff5c8a" transparent opacity={0.9} />
        </mesh>
      ))}
    </group>
  );
}
