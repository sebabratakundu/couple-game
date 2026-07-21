import React, { useState, useCallback, useMemo, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, Preload } from '@react-three/drei';
import SkyRig from './Sky';
import World from './World';
import Player from './Player';
import { RopewayRide, Summit } from './Ropeway';
import { MinigameHost } from './Minigames';
import { HUD, StartScreen, Scrapbook, InteractPrompt } from './UI';
import { Ending } from './Ending';
import { useGame } from './store';
import { LoadingScreen } from './Loading';
import BowlingScene from './scenes/Bowling';
import FerrisWheelScene from './scenes/FerrisWheelScene';
import BoatScene from './scenes/BoatScene';
import CoasterScene from './scenes/CoasterScene';
import ShootingScene from './scenes/ShootingScene';
import FoodShareScene from './scenes/FoodShareScene';
import { unlockAudio, playPark, playSummit, stopAll } from './audio';
import * as THREE from 'three';

export default function Game() {
  const started = useGame((s) => s.started);
  const onRopeway = useGame((s) => s.onRopeway);
  const atSummit = useGame((s) => s.atSummit);
  const showEnding = useGame((s) => s.showEnding);
  const activeScene = useGame((s) => s.activeScene);
  const setActiveScene = useGame((s) => s.setActiveScene);
  const [interactables, setInteractables] = useState([]);
  const setLst = useCallback((l) => setInteractables(l), []);
  const summitInteractables = useMemo(() => [], []);

  const foodShareData = useGame((s) => s.foodShareData);

  // Music orchestration
  React.useEffect(() => {
    if (!started) return;
    if (atSummit) playSummit();
    else playPark();
  }, [started, atSummit]);
  React.useEffect(() => {
    return () => stopAll();
  }, []);

  return (
    <div className="game-root" data-testid="game-root" onClick={() => unlockAudio()} onKeyDown={() => unlockAudio()}>
      {started && (
        <Canvas
          shadows
          dpr={[1, 1.5]}
          camera={{ position: [0, 6, 26], fov: 55 }}
          gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, outputColorSpace: THREE.SRGBColorSpace }}
        >
          <Suspense fallback={null}>
            <color attach="background" args={['#e9d5b8']} />
            <fog attach="fog" args={['#f0dfc4', 60, 230]} />
            <Environment preset="park" background={false} />

            {activeScene === 'bowling' ? (
              <BowlingScene onExit={() => setActiveScene(null)} />
            ) : activeScene === 'ferris' ? (
              <FerrisWheelScene onExit={() => setActiveScene(null)} />
            ) : activeScene === 'boat' ? (
              <BoatScene onExit={() => setActiveScene(null)} />
            ) : activeScene === 'coaster' ? (
              <CoasterScene onExit={() => setActiveScene(null)} />
            ) : activeScene === 'shooting' ? (
              <ShootingScene onExit={() => setActiveScene(null)} />
            ) : activeScene === 'food' && foodShareData ? (
              <FoodShareScene food={foodShareData} onExit={() => setActiveScene(null)} />
            ) : (
              <>
                <SkyRig />
                {!onRopeway && !atSummit && (
                  <>
                    <World registerInteractables={setLst} />
                    <Player interactables={interactables} />
                  </>
                )}
                {onRopeway && <RopewayRide />}
                {atSummit && (
                  <>
                    <Summit />
                    <Player interactables={summitInteractables} />
                  </>
                )}
              </>
            )}
            <Preload all />
          </Suspense>
        </Canvas>
      )}

      {started && <LoadingScreen />}

      {!started && <StartScreen />}
      {started && !showEnding && !activeScene && <HUD />}
      {started && !showEnding && !activeScene && <InteractPrompt />}
      {started && !showEnding && <Scrapbook />}
      {started && !showEnding && <MinigameHost />}
      {showEnding && <Ending />}
    </div>
  );
}
