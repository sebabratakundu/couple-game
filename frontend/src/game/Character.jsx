import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Polished stylized character with:
 * - Idle breathing
 * - Realistic walking (leg + arm swing, hip sway)
 * - Head look-at target (partner or camera)
 * - Sitting poses
 * - Smiling expression
 * - Hair with subtle bob
 */
export default function Character({
  refOuter,
  bodyColor = '#3b6dc4',
  skinColor = '#f2c9a2',
  hairColor = '#2a1a10',
  pantsColor = '#2b2f52',
  hairStyle = 'short',
  scale = 1,
  isMoving = false,
  isRunning = false,
  isSitting = false,
  walkPhase = 0,
  lookAt = null, // THREE.Vector3 or null
  handsUp = false,
  wave = false,
  smileStrength = 1,
}) {
  const group = useRef();
  const chest = useRef();
  const head = useRef();
  const legL = useRef();
  const legR = useRef();
  const armL = useRef();
  const armR = useRef();
  const hair = useRef();

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    // Breathing
    if (chest.current) {
      const breath = Math.sin(t * 1.6) * 0.015 + 1;
      chest.current.scale.y = breath;
    }
    // Head look-at
    if (head.current && lookAt && group.current) {
      const worldPos = new THREE.Vector3();
      head.current.getWorldPosition(worldPos);
      const dir = lookAt.clone().sub(worldPos);
      const localDir = dir.clone().applyQuaternion(group.current.quaternion.clone().invert());
      const yaw = Math.atan2(localDir.x, localDir.z);
      const pitch = Math.atan2(-localDir.y, Math.hypot(localDir.x, localDir.z));
      head.current.rotation.y = THREE.MathUtils.clamp(yaw, -0.8, 0.8) * 0.9;
      head.current.rotation.x = THREE.MathUtils.clamp(pitch, -0.4, 0.4) * 0.7;
    } else if (head.current) {
      // Subtle idle head movement
      head.current.rotation.y = Math.sin(t * 0.5) * 0.08;
      head.current.rotation.x = Math.sin(t * 0.3) * 0.04;
    }

    // Hair sway
    if (hair.current) {
      hair.current.rotation.z = Math.sin(t * 1.2) * 0.04;
    }

    // Legs / arms swing
    if (isSitting) {
      if (legL.current) legL.current.rotation.x = -Math.PI / 2.2;
      if (legR.current) legR.current.rotation.x = -Math.PI / 2.2;
      if (armL.current) armL.current.rotation.x = -0.4;
      if (armR.current) armR.current.rotation.x = -0.4;
    } else {
      const swing = isMoving ? Math.sin(walkPhase) * (isRunning ? 0.8 : 0.55) : Math.sin(t * 1.5) * 0.03;
      const armSwing = isMoving ? Math.sin(walkPhase) * (isRunning ? 0.65 : 0.45) : Math.sin(t * 1.5) * 0.05;
      if (legL.current) legL.current.rotation.x = swing;
      if (legR.current) legR.current.rotation.x = -swing;
      if (!handsUp && !wave) {
        if (armL.current) armL.current.rotation.x = -armSwing * 0.85;
        if (armR.current) armR.current.rotation.x = armSwing * 0.85;
      }
      if (handsUp) {
        const wobble = Math.sin(t * 6) * 0.15;
        if (armL.current) armL.current.rotation.x = -Math.PI + wobble;
        if (armR.current) armR.current.rotation.x = -Math.PI - wobble;
      }
      if (wave) {
        if (armR.current) armR.current.rotation.x = -Math.PI * 0.6 + Math.sin(t * 8) * 0.4;
        if (armR.current) armR.current.rotation.z = Math.sin(t * 8) * 0.4 - 0.4;
      } else if (armR.current) {
        armR.current.rotation.z = 0;
      }
    }
  });

  return (
    <group ref={(r) => { group.current = r; if (refOuter) refOuter.current = r; }} scale={scale}>
      {/* Legs */}
      <group ref={legL} position={[-0.11, 0.62, 0]}>
        <mesh castShadow position={[0, -0.28, 0]}>
          <capsuleGeometry args={[0.09, 0.35, 6, 10]} />
          <meshStandardMaterial color={pantsColor} roughness={0.85} />
        </mesh>
        <mesh position={[0, -0.5, 0.03]}>
          <boxGeometry args={[0.13, 0.06, 0.22]} />
          <meshStandardMaterial color="#2a1a10" roughness={0.9} />
        </mesh>
      </group>
      <group ref={legR} position={[0.11, 0.62, 0]}>
        <mesh castShadow position={[0, -0.28, 0]}>
          <capsuleGeometry args={[0.09, 0.35, 6, 10]} />
          <meshStandardMaterial color={pantsColor} roughness={0.85} />
        </mesh>
        <mesh position={[0, -0.5, 0.03]}>
          <boxGeometry args={[0.13, 0.06, 0.22]} />
          <meshStandardMaterial color="#2a1a10" roughness={0.9} />
        </mesh>
      </group>

      {/* Torso */}
      <group ref={chest}>
        <mesh castShadow position={[0, 1.0, 0]}>
          <capsuleGeometry args={[0.24, 0.4, 8, 14]} />
          <meshStandardMaterial color={bodyColor} roughness={0.75} />
        </mesh>
        {/* Neck */}
        <mesh castShadow position={[0, 1.36, 0]}>
          <cylinderGeometry args={[0.08, 0.09, 0.12, 10]} />
          <meshStandardMaterial color={skinColor} />
        </mesh>
      </group>

      {/* Arms */}
      <group ref={armL} position={[-0.3, 1.2, 0]}>
        <mesh castShadow position={[0, -0.28, 0]}>
          <capsuleGeometry args={[0.075, 0.36, 6, 10]} />
          <meshStandardMaterial color={bodyColor} />
        </mesh>
        <mesh castShadow position={[0, -0.56, 0]}>
          <capsuleGeometry args={[0.07, 0.2, 6, 8]} />
          <meshStandardMaterial color={skinColor} />
        </mesh>
        <mesh position={[0, -0.7, 0]}>
          <sphereGeometry args={[0.08, 10, 10]} />
          <meshStandardMaterial color={skinColor} />
        </mesh>
      </group>
      <group ref={armR} position={[0.3, 1.2, 0]}>
        <mesh castShadow position={[0, -0.28, 0]}>
          <capsuleGeometry args={[0.075, 0.36, 6, 10]} />
          <meshStandardMaterial color={bodyColor} />
        </mesh>
        <mesh castShadow position={[0, -0.56, 0]}>
          <capsuleGeometry args={[0.07, 0.2, 6, 8]} />
          <meshStandardMaterial color={skinColor} />
        </mesh>
        <mesh position={[0, -0.7, 0]}>
          <sphereGeometry args={[0.08, 10, 10]} />
          <meshStandardMaterial color={skinColor} />
        </mesh>
      </group>

      {/* Head */}
      <group ref={head} position={[0, 1.58, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.23, 20, 20]} />
          <meshStandardMaterial color={skinColor} roughness={0.65} />
        </mesh>
        {/* Cheeks blush */}
        <mesh position={[-0.14, -0.03, 0.19]}>
          <circleGeometry args={[0.04, 12]} />
          <meshBasicMaterial color="#f0a5a5" transparent opacity={0.55} />
        </mesh>
        <mesh position={[0.14, -0.03, 0.19]}>
          <circleGeometry args={[0.04, 12]} />
          <meshBasicMaterial color="#f0a5a5" transparent opacity={0.55} />
        </mesh>
        {/* Eyes */}
        <mesh position={[-0.075, 0.02, 0.21]}>
          <sphereGeometry args={[0.028, 10, 10]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
        <mesh position={[0.075, 0.02, 0.21]}>
          <sphereGeometry args={[0.028, 10, 10]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
        {/* Eye highlights */}
        <mesh position={[-0.07, 0.03, 0.23]}>
          <sphereGeometry args={[0.008, 6, 6]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0.08, 0.03, 0.23]}>
          <sphereGeometry args={[0.008, 6, 6]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        {/* Smile */}
        <mesh position={[0, -0.08, 0.21]}>
          <torusGeometry args={[0.045 + smileStrength * 0.01, 0.007, 6, 14, Math.PI]} />
          <meshStandardMaterial color="#a13a4a" />
        </mesh>
        {/* Hair */}
        <group ref={hair} position={[0, 0.02, -0.01]}>
          {hairStyle === 'long' ? (
            <>
              <mesh castShadow position={[0, 0.05, 0]}>
                <sphereGeometry args={[0.245, 18, 18]} />
                <meshStandardMaterial color={hairColor} roughness={0.55} />
              </mesh>
              <mesh castShadow position={[0, -0.28, -0.15]}>
                <boxGeometry args={[0.42, 0.55, 0.16]} />
                <meshStandardMaterial color={hairColor} roughness={0.55} />
              </mesh>
              <mesh position={[0.15, 0.1, 0.17]}>
                <sphereGeometry args={[0.045, 8, 8]} />
                <meshStandardMaterial color="#ff7fbf" emissive="#ff7fbf" emissiveIntensity={0.2} />
              </mesh>
            </>
          ) : (
            <mesh castShadow position={[0, 0.05, -0.01]}>
              <sphereGeometry args={[0.238, 18, 12, 0, Math.PI * 2, 0, Math.PI / 1.7]} />
              <meshStandardMaterial color={hairColor} roughness={0.55} />
            </mesh>
          )}
        </group>
      </group>
    </group>
  );
}
