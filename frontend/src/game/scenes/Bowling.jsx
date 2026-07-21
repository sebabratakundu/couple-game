import React, { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody, CuboidCollider, BallCollider, CylinderCollider, Physics } from '@react-three/rapier';
import { Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useGame } from '../store';

/**
 * BowlingScene — full 3D bowling with real physics.
 * Controls:
 *  - Mouse move: aim left/right (angle)
 *  - Hold left mouse: charge power
 *  - Release: throw ball
 *  - ESC: return to park
 */
export default function BowlingScene({ onExit }) {
  return (
    <Physics gravity={[0, -14, 0]} timeStep={1 / 60}>
      <BowlingInner onExit={onExit} />
    </Physics>
  );
}

function BowlingInner({ onExit }) {
  const { camera, gl } = useThree();
  const pinsRef = useRef([]); // { id, pos, ref }
  const [pinsVersion, setPinsVersion] = useState(0); // increments to trigger re-render
  const [ballKey, setBallKey] = useState(0);
  const [score, setScore] = useState(0);
  const [frame, setFrame] = useState(1);
  const [rolls, setRolls] = useState(0);
  const [message, setMessage] = useState('Hold LEFT MOUSE to charge, release to throw. Move mouse to aim.');
  const [gameOver, setGameOver] = useState(false);
  const ballBody = useRef();
  const aim = useRef(0);
  const power = useRef(0);
  const charging = useRef(false);
  const ballReady = useRef(true);
  const gameOverRef = useRef(false);
  const settleTimer = useRef(null);
  const addLove = useGame((s) => s.addLove);
  const addMemory = useGame((s) => s.addMemory);
  const registerMinigameWin = useGame((s) => s.registerMinigameWin);

  // Initialize pins once
  useEffect(() => {
    pinsRef.current = buildPinsData(0);
    setPinsVersion((v) => v + 1);
    return () => {
      if (settleTimer.current) clearTimeout(settleTimer.current);
    };
  }, []);

  // Camera setup once
  useEffect(() => {
    camera.position.set(0, 2.6, 6.5);
    camera.lookAt(0, 0.8, -8);
  }, [camera]);

  // Aim & shoot handlers on canvas
  useEffect(() => {
    const dom = gl && gl.domElement;
    if (!dom) return;
    const onMove = (e) => {
      const rect = dom.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      aim.current = THREE.MathUtils.clamp(nx * 0.55, -0.55, 0.55);
    };
    const onDown = (e) => {
      if (e.button !== 0) return;
      if (!ballReady.current || gameOverRef.current) return;
      charging.current = true;
      power.current = 0;
    };
    const onUp = (e) => {
      if (e.button !== 0) return;
      if (!charging.current) return;
      charging.current = false;
      throwBall();
    };
    const onKey = (e) => {
      if (e.key === 'Escape') onExit();
    };
    dom.addEventListener('mousemove', onMove);
    dom.addEventListener('mousedown', onDown);
    dom.addEventListener('mouseup', onUp);
    window.addEventListener('keydown', onKey);
    return () => {
      dom.removeEventListener('mousemove', onMove);
      dom.removeEventListener('mousedown', onDown);
      dom.removeEventListener('mouseup', onUp);
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, onExit]);

  useFrame((_, delta) => {
    if (charging.current) {
      power.current = Math.min(1, power.current + delta * 0.9);
    }
  });

  function throwBall() {
    try {
      if (!ballBody.current || !ballReady.current || gameOverRef.current) return;
      ballReady.current = false;
      const p = Math.max(0.35, power.current);
      const forwardVel = -22 * p;
      const sideVel = aim.current * 4;
      if (typeof ballBody.current.setLinvel === 'function') {
        ballBody.current.setLinvel({ x: sideVel, y: 0, z: forwardVel }, true);
      }
      if (typeof ballBody.current.setAngvel === 'function') {
        ballBody.current.setAngvel({ x: -8 * p, y: 0, z: 0 }, true);
      }
      power.current = 0;
      setMessage('Rolling...');
      if (settleTimer.current) clearTimeout(settleTimer.current);
      settleTimer.current = setTimeout(evaluateThrow, 3200);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Bowling throw error:', err);
    }
  }

  function evaluateThrow() {
    try {
      let downed = 0;
      const currentPins = pinsRef.current || [];
      currentPins.forEach((p) => {
        try {
          const b = p.ref && p.ref.current;
          if (!b || typeof b.translation !== 'function') return;
          const t = b.translation();
          const q = typeof b.rotation === 'function' ? b.rotation() : { x: 0, y: 0, z: 0, w: 1 };
          if (
            (t && typeof t.y === 'number' && t.y < 0.35) ||
            (q && typeof q.x === 'number' && Math.abs(q.x) > 0.35) ||
            (q && typeof q.z === 'number' && Math.abs(q.z) > 0.35)
          ) {
            downed++;
          }
        } catch (err) {
          // ignore single-pin read errors
        }
      });
      const roundScore = Math.min(10, downed);
      setScore((s) => s + roundScore);
      setMessage(
        roundScore === 10
          ? 'STRIKE! 🎳'
          : roundScore >= 7
          ? `Great! ${roundScore} pins down`
          : roundScore >= 4
          ? `Nice — ${roundScore} pins`
          : `${roundScore} pins — try again`
      );

      const nextRolls = rolls + 1;
      const advanceFrame = nextRolls >= 2 || roundScore === 10;
      if (advanceFrame) {
        const nextFrame = frame + 1;
        setFrame(nextFrame);
        setRolls(0);
        if (nextFrame > 3) {
          // Game over — finalize
          finalizeGame(score + roundScore);
        } else {
          setTimeout(() => {
            pinsRef.current = buildPinsData(Date.now());
            setPinsVersion((v) => v + 1);
          }, 900);
        }
      } else {
        setRolls(nextRolls);
      }

      setTimeout(() => {
        setBallKey((k) => k + 1);
        ballReady.current = true;
      }, 1000);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Bowling evaluate error:', err);
      // recover — allow next throw
      setBallKey((k) => k + 1);
      ballReady.current = true;
    }
  }

  function finalizeGame(total) {
    if (gameOverRef.current) return;
    gameOverRef.current = true;
    setGameOver(true);
    const love = total * 3;
    addLove(love, 'Bowling winnings');
    if (total >= 20) {
      registerMinigameWin();
      addMemory({
        id: 'won_bowling',
        title: 'Won Bowling',
        location: 'Carnival Alley',
        description: 'Ten pins, one perfect throw, one very impressed girlfriend.',
        emoji: '🎳',
      });
    }
    setMessage(`Game over! Score: ${total}. Earned ${love} ❤ · Press ESC to return`);
  }

  const pinsToRender = pinsRef.current || [];

  return (
    <group>
      <ambientLight intensity={0.6} color="#fff2d0" />
      <directionalLight position={[10, 20, 8]} intensity={1.5} color="#fff5e0" castShadow />
      <hemisphereLight args={['#ffe1d0', '#5a3a24', 0.55]} />

      {/* Floor with collider */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[3, 0.1, 15]} position={[0, -0.1, -8]} />
        <mesh receiveShadow position={[0, -0.1, -8]}>
          <boxGeometry args={[6, 0.2, 30]} />
          <meshStandardMaterial color="#e6c88a" roughness={0.5} />
        </mesh>
      </RigidBody>

      {/* Polished lane */}
      <mesh position={[0, 0.01, -9]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.6, 20]} />
        <meshStandardMaterial color="#f4d99a" roughness={0.15} metalness={0.1} />
      </mesh>

      {/* Gutters */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[0.2, 0.15, 10]} position={[-1.0, 0.05, -9]} />
        <mesh position={[-1.0, 0.05, -9]}>
          <boxGeometry args={[0.4, 0.3, 20]} />
          <meshStandardMaterial color="#5b3a24" />
        </mesh>
        <CuboidCollider args={[0.2, 0.15, 10]} position={[1.0, 0.05, -9]} />
        <mesh position={[1.0, 0.05, -9]}>
          <boxGeometry args={[0.4, 0.3, 20]} />
          <meshStandardMaterial color="#5b3a24" />
        </mesh>
      </RigidBody>

      {/* End wall */}
      <RigidBody type="fixed">
        <mesh position={[0, 1.2, -18]}>
          <boxGeometry args={[8, 2.4, 0.3]} />
          <meshStandardMaterial color="#c9a074" />
        </mesh>
      </RigidBody>

      {/* Pins */}
      {pinsToRender.map((p) => (
        <Pin key={`${p.id}_${pinsVersion}`} refBody={p.ref} position={p.pos} />
      ))}

      {/* Ball */}
      <RigidBody
        key={ballKey}
        ref={ballBody}
        position={[aim.current * 0.5, 0.35, 5]}
        colliders={false}
        restitution={0.15}
        friction={0.25}
        linearDamping={0.15}
        angularDamping={0.2}
      >
        <BallCollider args={[0.22]} />
        <mesh castShadow>
          <sphereGeometry args={[0.22, 24, 24]} />
          <meshStandardMaterial color="#c94b6b" metalness={0.4} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.15, 0.16]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial color="#3a1c50" />
        </mesh>
      </RigidBody>

      {/* Aim guide */}
      <mesh position={[aim.current * 0.5, 0.02, 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.08, 12]} />
        <meshBasicMaterial color="#ff5c8a" transparent opacity={0.4} />
      </mesh>

      {/* Banner */}
      <Billboard position={[0, 3, -6]}>
        <Text fontSize={0.5} color="#3a1c50" outlineColor="#ffffff" outlineWidth={0.03}>Anniversary Alley 🎳</Text>
      </Billboard>

      {/* Score board */}
      <Billboard position={[0, 2.3, -18]}>
        <Text fontSize={0.5} color="#ffffff" outlineColor="#3a1c50" outlineWidth={0.04}>
          {`Frame ${Math.min(3, frame)}/3     Score: ${score}`}
        </Text>
      </Billboard>
      <Billboard position={[0, 1.7, -18]}>
        <Text fontSize={0.28} color="#ffd166" outlineColor="#3a1c50" outlineWidth={0.02}>{message}</Text>
      </Billboard>

      {/* Exit hint */}
      <Billboard position={[0, 2.5, 6.4]}>
        <Text fontSize={0.18} color="#3a1c50" outlineColor="#ffffff" outlineWidth={0.015}>Press ESC to return to the park</Text>
      </Billboard>
    </group>
  );
}

function Pin({ refBody, position }) {
  return (
    <RigidBody
      ref={refBody}
      position={position}
      colliders={false}
      restitution={0.05}
      friction={0.6}
      angularDamping={0.15}
    >
      <CylinderCollider args={[0.22, 0.09]} />
      <mesh castShadow>
        <cylinderGeometry args={[0.07, 0.09, 0.44, 12]} />
        <meshStandardMaterial color="#ffffff" roughness={0.4} />
      </mesh>
      <mesh castShadow position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.05, 0.09, 0.12, 12]} />
        <meshStandardMaterial color="#e63946" />
      </mesh>
    </RigidBody>
  );
}

function buildPinsData(seed) {
  const spacing = 0.24;
  const rows = 4;
  const pins = [];
  let id = 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c <= r; c++) {
      const x = (c - r / 2) * spacing;
      const z = -12 - r * spacing;
      pins.push({ id: `${seed}_${id++}`, pos: [x, 0.23, z], ref: React.createRef() });
    }
  }
  return pins;
}
