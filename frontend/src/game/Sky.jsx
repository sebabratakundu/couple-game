import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles, Cloud, Clouds, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useGame } from './store';
import { skyColorsFromTime, sunFromTime, sunIntensity, ambientColor } from './utils';

export default function SkyRig() {
  const time = useGame((s) => s.timeOfDay);
  const setTime = useGame((s) => s.setTime);
  const paused = useGame((s) => s.paused);
  const atSummit = useGame((s) => s.atSummit);

  const sun = useMemo(() => sunFromTime(time), [time]);
  const colors = useMemo(() => skyColorsFromTime(time), [time]);
  const intensity = useMemo(() => sunIntensity(time), [time]);
  const amb = useMemo(() => ambientColor(time), [time]);

  const sunLight = useRef();

  useFrame((_, delta) => {
    if (!paused) {
      // Slow natural time advance. Cap at Golden Hour while in the park.
      // Only the summit sequence pushes it into full sunset.
      const speed = atSummit ? 0.015 : 0.0035;
      const cap = atSummit ? 1.0 : 0.7; // never dip into night while walking in park
      const next = Math.min(cap, time + delta * speed);
      setTime(next);
    }
  });

  return (
    <>
      <SkyDome top={colors.top} bot={colors.bot} />
      <hemisphereLight args={[colors.top, '#3d6b3a', 0.55]} />
      <ambientLight intensity={0.35} color={amb} />
      <directionalLight
        ref={sunLight}
        castShadow
        position={sun.toArray()}
        intensity={intensity * 1.6}
        color={time > 0.7 ? '#ffb37a' : '#fff5e0'}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={200}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
      />
      {/* Sun disc */}
      <mesh position={sun.toArray()}>
        <sphereGeometry args={[2.2, 24, 24]} />
        <meshBasicMaterial color={time > 0.7 ? '#ffcf87' : '#fff8d6'} />
      </mesh>
      <Clouds material={THREE.MeshBasicMaterial} limit={30}>
        <Cloud seed={1} position={[-30, 22, -30]} bounds={[8, 2, 4]} volume={6} color={time > 0.7 ? '#ffcbb0' : '#ffffff'} opacity={0.55} />
        <Cloud seed={2} position={[30, 25, -20]} bounds={[10, 2, 5]} volume={7} color={time > 0.7 ? '#ffc39d' : '#f7fbff'} opacity={0.55} />
        <Cloud seed={3} position={[10, 20, 40]} bounds={[9, 2, 5]} volume={6} color={time > 0.7 ? '#f6a186' : '#ffffff'} opacity={0.5} />
        <Cloud seed={4} position={[-40, 28, 20]} bounds={[7, 2, 4]} volume={5} color={time > 0.7 ? '#e88f7c' : '#ffffff'} opacity={0.45} />
      </Clouds>
      {time > 0.9 && (
        <>
          <Stars radius={120} depth={40} count={800} factor={3} fade speed={0.5} />
          <Sparkles count={80} scale={[40, 8, 40]} size={4} color="#fff2a1" speed={0.4} />
        </>
      )}
    </>
  );
}

function SkyDome({ top, bot }) {
  const mat = useMemo(() => {
    const m = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        topColor: { value: new THREE.Color(top) },
        bottomColor: { value: new THREE.Color(bot) },
        offset: { value: 20 },
        exponent: { value: 0.7 },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 wp = modelMatrix * vec4(position,1.0);
          vWorldPosition = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + vec3(0.0, offset, 0.0)).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h,0.0), exponent),0.0)),1.0);
        }
      `,
    });
    return m;
  }, []);

  // Update on prop change
  React.useEffect(() => {
    mat.uniforms.topColor.value.set(top);
    mat.uniforms.bottomColor.value.set(bot);
  }, [top, bot, mat]);

  return (
    <mesh scale={[1, 1, 1]}>
      <sphereGeometry args={[300, 32, 16]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}
