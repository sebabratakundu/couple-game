import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text, Billboard } from '@react-three/drei';
import { Tree, CherryTree, FlowerField, Bench, Fountain, Butterfly, Lantern, Balloon, HeartHedge, Person } from './props';
import { useGame } from './store';
import { seedRand } from './utils';

/**
 * The main amusement park world.
 * Interactables are collected into an array and passed up so Player can proximity-check.
 */
export default function World({ registerInteractables }) {
  const addLove = useGame((s) => s.addLove);
  const addMemory = useGame((s) => s.addMemory);
  const registerActivity = useGame((s) => s.registerActivity);
  const registerFoodShared = useGame((s) => s.registerFoodShared);
  const registerPhoto = useGame((s) => s.registerPhoto);
  const setActiveMinigame = useGame((s) => s.setActiveMinigame);
  const lovePoints = useGame((s) => s.lovePoints);
  const ropewayUnlocked = useGame((s) => s.ropewayUnlocked);
  const unlockRopeway = useGame((s) => s.unlockRopeway);
  const boardRopeway = useGame((s) => s.boardRopeway);
  const collect = useGame((s) => s.collect);
  const flash = useGame((s) => s.flash);

  // Build interactables list
  const interactables = useMemo(() => {
    const list = [];

    // Rides
    const rides = [
      { id: 'ride_ferris', pos: [-25, 0, -18], label: 'Ride the Ferris Wheel 🎡', scene: 'ferris' },
      { id: 'ride_carousel', pos: [-10, 0, -22], label: 'Ride the Carousel 🎠',
        memory: { id: 'carousel', title: 'Carousel Spin', location: 'Carousel', description: 'You picked the pink horse. Of course you did.', emoji: '🎠' } },
      { id: 'ride_coaster', pos: [24, 0, -25], label: 'Ride the Roller Coaster 🎢', scene: 'coaster' },
      { id: 'ride_boat', pos: [42, 0, 4], label: 'Rent a Boat 🚣', scene: 'boat' },
    ];
    for (const r of rides) {
      list.push({
        ...r,
        onInteract: () => {
          if (r.scene) {
            useGame.getState().setActiveScene(r.scene);
          } else {
            addLove(40, r.memory.title);
            addMemory(r.memory);
            registerActivity();
          }
        },
      });
    }

    // Food stalls — now trigger cinematic shared-eating scenes
    const foods = [
      { id: 'food_ice', pos: [15, 0, 8], label: 'Share Ice Cream 🍦', name: 'Ice Cream', type: 'ice_cream', emoji: '🍦', title: 'Shared Ice Cream', desc: 'She gave you the last bite. Some things never change.', love: 45,
        captions: ['Two scoops, one cone…', 'She stole a lick 😄', 'Sticky fingers, sweet smiles', 'You’d share every scoop with her.'] },
      { id: 'food_pizza', pos: [19, 0, 12], label: 'Share Pizza Slice 🍕', name: 'Pizza', type: 'pizza', emoji: '🍕', title: 'Pizza Bliss', desc: 'Extra cheese, extra love.', love: 40,
        captions: ['One slice, two mouths.', 'Cheese pull! 🧀', 'She saved you the last bite.', 'Extra pepperoni, extra love.'] },
      { id: 'food_cotton', pos: [22, 0, 6], label: 'Share Cotton Candy 🍭', name: 'Cotton Candy', type: 'cotton_candy', emoji: '🍭', title: 'Cotton Candy Kiss', desc: 'Pink sugar clouds and a sticky little kiss.', love: 40,
        captions: ['Pink sugar cloud ☁', 'Her lips turned pink.', 'You leaned in for a taste.', 'That was worth every calorie.'] },
      { id: 'food_coffee', pos: [11, 0, 12], label: 'Coffee for Two ☕', name: 'Coffee for Two', type: 'coffee', emoji: '☕', title: 'Warm Coffee Together', desc: 'Steam curled up like tiny hearts.', love: 35,
        captions: ['Two cappuccinos, one heart.', 'Steam curled between you.', 'You made her laugh mid-sip.', 'Perfect little pause together.'] },
    ];
    for (const f of foods) {
      list.push({
        id: f.id,
        pos: f.pos,
        label: f.label,
        onInteract: () => {
          useGame.getState().setActiveScene('food', f);
        },
      });
    }

    // Boat (rowing experience)
    list.push({
      id: 'boat', pos: [42, 0, 22], label: 'Rent a Boat 🚣',
      onInteract: () => useGame.getState().setActiveScene('boat'),
    });

    // Mini-games
    list.push({
      id: 'mg_ring', pos: [-20, 0, 12], label: 'Play Ring Toss',
      onInteract: () => setActiveMinigame('ringtoss'),
    });
    list.push({
      id: 'mg_shoot', pos: [-25, 0, 6], label: 'Play Shooting Gallery 🎯',
      onInteract: () => useGame.getState().setActiveScene('shooting'),
    });
    list.push({
      id: 'mg_dance', pos: [-18, 0, 20], label: 'Dance Machine',
      onInteract: () => setActiveMinigame('dance'),
    });
    list.push({
      id: 'mg_bowl', pos: [-30, 0, 16], label: 'Play Bowling (Physics!)',
      onInteract: () => useGame.getState().setActiveScene('bowling'),
    });

    // Selfie & fountain photos
    list.push({
      id: 'photo_fountain', pos: [0, 0, 0], label: 'Take a Selfie by the Fountain',
      onInteract: () => {
        addLove(15, 'Selfie captured');
        registerPhoto();
        addMemory({ id: 'selfie_fountain', title: 'Took Selfie', location: 'Central Fountain', description: 'You made her laugh right when the camera clicked.', emoji: '📸' });
      },
    });
    list.push({
      id: 'photo_flowers', pos: [10, 0, -6], label: 'Selfie in the Flowers',
      onInteract: () => {
        addLove(15, 'Selfie captured');
        registerPhoto();
        addMemory({ id: 'selfie_flowers', title: 'Flower Field Photo', location: 'Central Garden', description: 'She tucked a pink flower behind her ear. You almost forgot to press the button.', emoji: '📸' });
      },
    });

    // Lake / duck feed
    list.push({
      id: 'ducks', pos: [42, 0, 18], label: 'Feed the Ducks',
      onInteract: () => {
        addLove(15, 'Fed the ducks');
        addMemory({ id: 'fed_ducks', title: 'Fed Ducks', location: 'Lake', description: 'The tiniest one waddled straight to you. Obviously.', emoji: '🦆' });
        registerActivity();
      },
    });
    list.push({
      id: 'gazebo', pos: [46, 0, 8], label: 'Slow dance in the Gazebo',
      onInteract: () => {
        addLove(30, 'Slow dance');
        addMemory({ id: 'gazebo_dance', title: 'Gazebo Slow Dance', location: 'Lake Gazebo', description: 'No music needed. Your hearts kept the tempo.', emoji: '💃' });
        registerActivity();
      },
    });

    // Ropeway station
    list.push({
      id: 'ropeway', pos: [0, 0, -55], label: ropewayUnlocked ? 'Board the Ropeway (Sunset Awaits) 🎫' : `Ropeway — need 500 ❤ (${useGame.getState().lovePoints} so far)`,
      onInteract: () => {
        if (!ropewayUnlocked) {
          if (useGame.getState().lovePoints >= 500) {
            unlockRopeway();
            flash('The gate slowly opens...');
            setTimeout(() => boardRopeway(), 800);
          } else {
            flash(`Need 500 ❤️ (you have ${useGame.getState().lovePoints})`);
          }
        } else {
          boardRopeway();
        }
      },
    });

    // Hidden collectibles (love letters, teddy bears etc.)
    const rand = seedRand(42);
    const kinds = [
      { type: 'letter', emoji: '💌', reward: 30 },
      { type: 'teddy', emoji: '🧸', reward: 30 },
      { type: 'balloon', emoji: '🎈', reward: 25 },
      { type: 'music', emoji: '🎵', reward: 30 },
      { type: 'photo', emoji: '🖼️', reward: 30 },
    ];
    for (let i = 0; i < 12; i++) {
      const angle = rand() * Math.PI * 2;
      const radius = 15 + rand() * 40;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      // Keep off the ropeway path
      if (Math.abs(x) < 4 && z < -30) continue;
      const kind = kinds[Math.floor(rand() * kinds.length)];
      const id = `hidden_${i}`;
      list.push({
        id, pos: [x, 0.4, z], label: `Pick up ${kind.emoji}  hidden treasure`,
        collectible: kind,
        onInteract: () => {
          if (collect(id, kind.reward)) {
            addMemory({ id, title: `Found a ${kind.type}`, location: 'Somewhere in the park', description: 'A tiny gift, hidden just for you two.', emoji: kind.emoji });
          }
        },
      });
    }

    return list;
  }, [ropewayUnlocked]);

  React.useEffect(() => {
    registerInteractables(interactables);
  }, [interactables, registerInteractables]);

  return (
    <group>
      {/* Ground */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[220, 220, 40, 40]} />
        <meshStandardMaterial color="#5fae5c" roughness={0.95} />
      </mesh>
      {/* Path circle */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[7.5, 8.5, 48]} />
        <meshStandardMaterial color="#d9c39b" />
      </mesh>

      {/* Zone signage using drei Text */}
      <ZoneLabel position={[0, 6.5, 22]} text="Welcome" sub="Anniversary Park" size={0.55} />
      <ZoneLabel position={[24, 3.6, 10]} text="Food Street" size={0.5} />
      <ZoneLabel position={[-22, 3.6, 10]} text="Carnival Games" size={0.5} />
      <ZoneLabel position={[-20, 3.6, -22]} text="Adventure Zone" size={0.5} />
      <ZoneLabel position={[42, 3.6, 12]} text="Lake" size={0.5} />
      <ZoneLabel position={[0, 5, -50]} text="Ropeway to the Sunset" sub={ropewayUnlocked ? 'Unlocked — climb aboard!' : `500 ❤ needed`} size={0.6} />

      {/* Central Fountain */}
      <Fountain position={[0, 0, 0]} />
      <FlowerField center={[10, 0, -6]} radius={5} count={40} seed={7} />
      <FlowerField center={[-10, 0, 6]} radius={5} count={40} seed={13} />
      <FlowerField center={[6, 0, 10]} radius={4} count={30} seed={22} />

      {/* Heart hedges */}
      <HeartHedge position={[-6, 0, 4]} scale={1.4} />
      <HeartHedge position={[6, 0, 4]} scale={1.4} />

      {/* Trees around the park */}
      <TreeCluster count={45} seed={5} />

      {/* Butterflies */}
      <Butterfly path={[[8, 1.6, 6], [10, 2.2, 8], [12, 1.6, 6], [10, 2.2, 4]]} color="#ffe08a" />
      <Butterfly path={[[-8, 1.4, -6], [-6, 2.4, -8], [-4, 1.6, -6], [-6, 2.4, -4]]} color="#f2a1e0" speed={0.4} />
      <Butterfly path={[[3, 1.6, 12], [5, 2.6, 14], [7, 1.6, 12], [5, 2.6, 10]]} color="#a8ecff" speed={0.35} />

      {/* Benches around center */}
      <Bench position={[10, 0, 0]} rotation={[0, -Math.PI / 2, 0]} />
      <Bench position={[-10, 0, 0]} rotation={[0, Math.PI / 2, 0]} />
      <Bench position={[0, 0, 10]} rotation={[0, Math.PI, 0]} />
      <Bench position={[0, 0, -10]} />

      {/* Balloons at entrance */}
      <Balloon position={[-2, 2.5, 22]} color="#ff5c8a" />
      <Balloon position={[2, 2.7, 22]} color="#ffd166" />
      <Balloon position={[-3, 3.0, 24]} color="#c084fc" />
      <Balloon position={[3, 3.2, 24]} color="#ff9ac1" />

      {/* Entrance arch */}
      <EntranceArch position={[0, 0, 22]} />

      {/* Adventure Zone (rides) */}
      <FerrisWheel position={[-25, 0, -18]} />
      <Carousel position={[-10, 0, -22]} />
      <RollerCoaster position={[24, 0, -25]} />

      {/* Food Street */}
      <FoodStall position={[15, 0, 8]} color="#ffb1c8" flag="🍦" label="Ice Cream" />
      <FoodStall position={[19, 0, 12]} color="#ffd166" flag="🍕" label="Pizza" />
      <FoodStall position={[22, 0, 6]} color="#c084fc" flag="🍭" label="Cotton Candy" />
      <FoodStall position={[11, 0, 12]} color="#a8dadc" flag="☕" label="Coffee" />

      {/* Carnival Games */}
      <GameStall position={[-20, 0, 12]} color="#f79256" label="Ring Toss" flag="🎯" />
      <GameStall position={[-25, 0, 6]} color="#7dcfb6" label="Shooting Gallery" flag="🎈" />
      <GameStall position={[-18, 0, 20]} color="#c084fc" label="Dance Machine" flag="💃" />
      <GameStall position={[-30, 0, 16]} color="#7dcfb6" label="Bowling" flag="🎳" />

      {/* Ice cream carts and balloon vendors */}
      <IceCreamCart position={[6, 0, 16]} />
      <IceCreamCart position={[-6, 0, -14]} />
      <BalloonVendor position={[-8, 0, 18]} />
      <BalloonVendor position={[8, 0, -18]} />

      {/* Banners */}
      <Banner position={[-14, 0, 0]} rotation={0} text="Happy Anniversary" />
      <Banner position={[14, 0, 0]} rotation={0} text="Love Wins ❤" />
      <Banner position={[0, 0, -14]} rotation={Math.PI / 2} text="Welcome, Sweethearts" />

      {/* Sitting NPCs on benches */}
      <SittingNPC position={[10, 0, 0]} rotationY={-Math.PI / 2} body="#7dcfb6" hair="short" hairColor="#3a2015" />
      <SittingNPC position={[-10, 0, 0]} rotationY={Math.PI / 2} body="#f79256" hair="long" hairColor="#4a2a15" />
      <SittingNPC position={[0, 0, -10]} rotationY={0} body="#c084fc" hair="long" hairColor="#e6b04c" />

      {/* Birds flying */}
      <FlyingBird path="A" />
      <FlyingBird path="B" />
      <FlyingBird path="C" />

      {/* Extra dense trees */}
      <TreeCluster count={35} seed={99} />
      <TreeCluster count={20} seed={200} />

      {/* Lake */}
      <Lake position={[42, 0, 12]} />

      {/* Ropeway station */}
      <RopewayStation position={[0, 0, -55]} unlocked={ropewayUnlocked} />

      {/* NPCs */}
      <NPCs />

      {/* Hidden collectibles visuals */}
      <Collectibles list={interactables.filter((i) => i.collectible)} />

      {/* Labels for interactables */}
      <InteractableGlows list={interactables} />
    </group>
  );
}

function ZoneLabel({ position, text, sub, size = 0.7 }) {
  return (
    <Billboard position={position} follow={true}>
      <Text
        color="#3a1c50"
        fontSize={size}
        outlineWidth={0.03}
        outlineColor="#ffffff"
        anchorX="center"
        anchorY="middle"
        maxWidth={20}
      >
        {text}
      </Text>
      {sub && (
        <Text
          position={[0, -0.65, 0]}
          color="#8a3e6b"
          fontSize={size * 0.45}
          outlineWidth={0.015}
          outlineColor="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          {sub}
        </Text>
      )}
    </Billboard>
  );
}

function TreeCluster({ count = 30, seed = 5 }) {
  const trees = useMemo(() => {
    const rand = seedRand(seed);
    const arr = [];
    const colors = ['#4fa159', '#3f8f3d', '#5cb85c', '#65b06a'];
    for (let i = 0; i < count; i++) {
      const angle = rand() * Math.PI * 2;
      const radius = 30 + rand() * 40;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      // skip ropeway path
      if (Math.abs(x) < 6 && z < -25) continue;
      arr.push({ pos: [x, 0, z], scale: 0.9 + rand() * 0.6, color: colors[Math.floor(rand() * colors.length)] });
    }
    return arr;
  }, [count, seed]);
  return trees.map((t, i) => <Tree key={i} position={t.pos} scale={t.scale} color={t.color} />);
}

function EntranceArch({ position }) {
  return (
    <group position={position}>
      <mesh position={[-3.5, 2.5, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 5, 12]} />
        <meshStandardMaterial color="#c94b6b" />
      </mesh>
      <mesh position={[3.5, 2.5, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 5, 12]} />
        <meshStandardMaterial color="#c94b6b" />
      </mesh>
      <mesh position={[0, 5.1, 0]}>
        <torusGeometry args={[3.5, 0.28, 12, 24, Math.PI]} />
        <meshStandardMaterial color="#c94b6b" />
      </mesh>
      {/* Flower cluster on arch */}
      {[...Array(24)].map((_, i) => {
        const t = i / 23;
        const a = Math.PI - t * Math.PI;
        return (
          <mesh key={i} position={[Math.cos(a) * 3.5, 5.1 + Math.sin(a) * 3.5 - 3.5 + 3.5, 0]}>
            <sphereGeometry args={[0.16, 8, 8]} />
            <meshStandardMaterial color={i % 3 === 0 ? '#ffd166' : i % 3 === 1 ? '#ff7fbf' : '#ffffff'} />
          </mesh>
        );
      })}
    </group>
  );
}

function FerrisWheel({ position }) {
  const wheel = useRef();
  useFrame((_, d) => { if (wheel.current) wheel.current.rotation.z += d * 0.2; });
  return (
    <group position={position}>
      <mesh position={[0, 6, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 12, 8]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#455" />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[6, 1, 3]} />
        <meshStandardMaterial color="#775544" />
      </mesh>
      <group ref={wheel} position={[0, 6, 0]}>
        <mesh>
          <torusGeometry args={[5, 0.15, 8, 24]} />
          <meshStandardMaterial color="#f79256" />
        </mesh>
        {[...Array(8)].map((_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <group key={i}>
              <mesh rotation={[0, 0, a]}>
                <boxGeometry args={[10, 0.06, 0.06]} />
                <meshStandardMaterial color="#f79256" />
              </mesh>
              <mesh position={[Math.cos(a) * 5, Math.sin(a) * 5, 0]}>
                <boxGeometry args={[0.9, 0.6, 0.6]} />
                <meshStandardMaterial color={['#ff5c8a', '#ffd166', '#a8dadc', '#c084fc'][i % 4]} />
              </mesh>
            </group>
          );
        })}
      </group>
    </group>
  );
}

function Carousel({ position }) {
  const top = useRef();
  useFrame((_, d) => { if (top.current) top.current.rotation.y += d * 0.5; });
  return (
    <group position={position}>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[2.5, 2.5, 0.3, 24]} />
        <meshStandardMaterial color="#e8dbc0" />
      </mesh>
      <group ref={top} position={[0, 0.3, 0]}>
        {[...Array(6)].map((_, i) => {
          const a = (i / 6) * Math.PI * 2;
          return (
            <group key={i} position={[Math.cos(a) * 1.8, 0.4, Math.sin(a) * 1.8]}>
              <mesh>
                <boxGeometry args={[0.4, 0.7, 0.9]} />
                <meshStandardMaterial color={['#ff9ac1', '#a8dadc', '#ffd166'][i % 3]} />
              </mesh>
              <mesh position={[0, 1, 0]}>
                <cylinderGeometry args={[0.05, 0.05, 2, 8]} />
                <meshStandardMaterial color="#c9a94a" />
              </mesh>
            </group>
          );
        })}
      </group>
      <mesh position={[0, 3.4, 0]}>
        <coneGeometry args={[2.6, 1.2, 12]} />
        <meshStandardMaterial color="#c94b6b" />
      </mesh>
    </group>
  );
}

function RollerCoaster({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 3, 0]}>
        <torusGeometry args={[4, 0.15, 8, 32]} />
        <meshStandardMaterial color="#e63946" />
      </mesh>
      <mesh position={[0, 3, 2.5]} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[3, 0.12, 8, 32, Math.PI]} />
        <meshStandardMaterial color="#e63946" />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[8, 1, 5]} />
        <meshStandardMaterial color="#6a4a2a" />
      </mesh>
      {/* Coaster car */}
      <CoasterCar />
    </group>
  );
}

function CoasterCar() {
  const car = useRef();
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 0.7;
    if (car.current) {
      car.current.position.x = Math.cos(t) * 4;
      car.current.position.y = 3 + Math.sin(t) * 0.15;
      car.current.position.z = Math.sin(t) * 4;
      car.current.rotation.y = -t;
    }
  });
  return (
    <mesh ref={car}>
      <boxGeometry args={[0.6, 0.4, 0.4]} />
      <meshStandardMaterial color="#ffd166" />
    </mesh>
  );
}

function FoodStall({ position, color, flag, label }) {
  return (
    <group position={position}>
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[2.2, 2, 1.6]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 2.2, 0]}>
        <boxGeometry args={[2.6, 0.3, 1.9]} />
        <meshStandardMaterial color="#5b3a24" />
      </mesh>
      <mesh position={[0, 2.6, 0]}>
        <coneGeometry args={[1.6, 0.6, 4]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <Billboard position={[0, 1.1, 0.9]}>
        <Text fontSize={0.5} color="#3a1c50" anchorX="center" anchorY="middle">{flag}</Text>
        <Text position={[0, -0.6, 0]} fontSize={0.22} color="#3a1c50" outlineWidth={0.01} outlineColor="#ffffff" anchorX="center" anchorY="middle">{label}</Text>
      </Billboard>
    </group>
  );
}

function GameStall({ position, color, flag, label }) {
  return (
    <group position={position}>
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[2.4, 2, 1.6]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 2.3, 0]}>
        <coneGeometry args={[1.7, 0.7, 6]} />
        <meshStandardMaterial color="#3a1c50" />
      </mesh>
      <Billboard position={[0, 1.2, 0.9]}>
        <Text fontSize={0.6} color="#ffffff" anchorX="center" anchorY="middle">{flag}</Text>
        <Text position={[0, -0.6, 0]} fontSize={0.22} color="#ffffff" outlineWidth={0.015} outlineColor="#3a1c50" anchorX="center" anchorY="middle">{label}</Text>
      </Billboard>
    </group>
  );
}

function Lake({ position }) {
  const water = useRef();
  useFrame(({ clock }) => {
    if (water.current) {
      const s = 1 + Math.sin(clock.elapsedTime * 1.2) * 0.005;
      water.current.scale.set(s, 1, s);
    }
  });
  return (
    <group position={position}>
      <mesh ref={water} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <circleGeometry args={[10, 40]} />
        <meshStandardMaterial color="#4c9be8" transparent opacity={0.9} metalness={0.4} roughness={0.15} />
      </mesh>
      {/* Bridge */}
      <mesh position={[-8, 0.4, 0]}>
        <boxGeometry args={[6, 0.15, 1.5]} />
        <meshStandardMaterial color="#8b5a2b" />
      </mesh>
      {/* Gazebo */}
      <group position={[4, 0, -4]}>
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[1.4, 1.4, 0.15, 8]} />
          <meshStandardMaterial color="#c9a074" />
        </mesh>
        {[0, 1, 2, 3].map((i) => {
          const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
          return (
            <mesh key={i} position={[Math.cos(a) * 1.1, 1.2, Math.sin(a) * 1.1]}>
              <cylinderGeometry args={[0.08, 0.08, 2.2, 8]} />
              <meshStandardMaterial color="#8b5a2b" />
            </mesh>
          );
        })}
        <mesh position={[0, 2.5, 0]}>
          <coneGeometry args={[1.6, 0.8, 8]} />
          <meshStandardMaterial color="#c94b6b" />
        </mesh>
      </group>
      {/* Ducks */}
      <Duck position={[2, 0.2, 6]} />
      <Duck position={[-3, 0.2, 4]} phase={1.5} />
      <Duck position={[5, 0.2, -2]} phase={0.8} />
    </group>
  );
}

function Duck({ position, phase = 0 }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.x = position[0] + Math.cos(clock.elapsedTime * 0.5 + phase) * 0.8;
      ref.current.position.z = position[2] + Math.sin(clock.elapsedTime * 0.5 + phase) * 0.8;
      ref.current.rotation.y = clock.elapsedTime * 0.5 + phase + Math.PI / 2;
    }
  });
  return (
    <group ref={ref} position={position}>
      <mesh>
        <sphereGeometry args={[0.16, 12, 12]} />
        <meshStandardMaterial color="#f5efe1" />
      </mesh>
      <mesh position={[0.1, 0.14, 0]}>
        <sphereGeometry args={[0.09, 10, 10]} />
        <meshStandardMaterial color="#f5efe1" />
      </mesh>
      <mesh position={[0.18, 0.14, 0]}>
        <coneGeometry args={[0.04, 0.08, 6]} rotation={[0, 0, -Math.PI / 2]} />
        <meshStandardMaterial color="#f79256" />
      </mesh>
    </group>
  );
}

function RopewayStation({ position, unlocked }) {
  return (
    <group position={position}>
      {/* Platform */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[6, 0.6, 4]} />
        <meshStandardMaterial color="#c9a074" />
      </mesh>
      {/* Roof pillars */}
      {[-2.5, 2.5].map((x, i) => (
        <mesh key={i} position={[x, 2, -1.5]}>
          <cylinderGeometry args={[0.15, 0.15, 4, 8]} />
          <meshStandardMaterial color="#8b5a2b" />
        </mesh>
      ))}
      <mesh position={[0, 4, -1.5]}>
        <boxGeometry args={[6, 0.3, 3]} />
        <meshStandardMaterial color="#c94b6b" />
      </mesh>
      {/* Gate */}
      <mesh position={[0, 1.4, 1.9]}>
        <boxGeometry args={[3.5, 2.6, 0.15]} />
        <meshStandardMaterial color={unlocked ? '#ffd166' : '#5b3a24'} emissive={unlocked ? '#ffb84a' : '#000000'} emissiveIntensity={unlocked ? 0.3 : 0} />
      </mesh>
      {/* Signage */}
      <Billboard position={[0, 5, -1.5]}>
        <Text fontSize={0.5} color="#ffffff" outlineWidth={0.03} outlineColor="#3a1c50" anchorX="center">
          Ropeway to the Summit
        </Text>
      </Billboard>
      {/* Cable to mountain */}
      <mesh position={[0, 10, -20]} rotation={[Math.PI / 2 - 0.3, 0, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 40, 6]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      {/* Cable car (visual, static) */}
      <mesh position={[0, 6, -8]}>
        <boxGeometry args={[1.4, 1.2, 1.2]} />
        <meshStandardMaterial color="#e63946" />
      </mesh>
      <mesh position={[0, 6.8, -8]}>
        <boxGeometry args={[1.1, 0.15, 0.9]} />
        <meshStandardMaterial color="#c1121f" />
      </mesh>
    </group>
  );
}

function NPCs() {
  const npcs = useMemo(() => {
    const rand = seedRand(88);
    const arr = [];
    for (let i = 0; i < 10; i++) {
      const angle = rand() * Math.PI * 2;
      const r = 8 + rand() * 20;
      arr.push({
        x: Math.cos(angle) * r,
        z: Math.sin(angle) * r,
        speed: 0.2 + rand() * 0.5,
        radius: 3 + rand() * 6,
        offset: rand() * Math.PI * 2,
        bodyColor: ['#4a90e2', '#e07aa4', '#7dcfb6', '#f79256', '#c084fc'][Math.floor(rand() * 5)],
        hair: rand() > 0.5 ? 'short' : 'long',
        hairColor: ['#2a1a10', '#e6b04c', '#4a2a15', '#333333'][Math.floor(rand() * 4)],
      });
    }
    return arr;
  }, []);
  return npcs.map((n, i) => <NPC key={i} data={n} />);
}

function NPC({ data }) {
  const ref = useRef();
  const walkPhase = useRef(0);
  useFrame(({ clock }, delta) => {
    walkPhase.current += delta * 6;
    if (ref.current) {
      const t = clock.elapsedTime * data.speed + data.offset;
      const x = data.x + Math.cos(t) * data.radius;
      const z = data.z + Math.sin(t) * data.radius;
      ref.current.position.x = x;
      ref.current.position.z = z;
      ref.current.rotation.y = -t + Math.PI / 2;
    }
  });
  return (
    <group ref={ref}>
      <Person bodyColor={data.bodyColor} hairColor={data.hairColor} hairStyle={data.hair} isMoving walkPhase={walkPhase.current} scale={0.95} />
    </group>
  );
}

function Collectibles({ list }) {
  const collectedIds = useGame((s) => s.collectedIds);
  return (
    <group>
      {list.map((c) => {
        if (collectedIds.has(c.id)) return null;
        return <Collectible key={c.id} pos={c.pos} kind={c.collectible} />;
      })}
    </group>
  );
}

function Collectible({ pos, kind }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.elapsedTime * 1.5;
    ref.current.position.y = pos[1] + 0.6 + Math.sin(clock.elapsedTime * 2 + pos[0]) * 0.1;
  });
  return (
    <group ref={ref} position={[pos[0], pos[1] + 0.6, pos[2]]}>
      <mesh>
        <sphereGeometry args={[0.25, 12, 12]} />
        <meshStandardMaterial color="#fff2a1" emissive="#ffd166" emissiveIntensity={0.7} transparent opacity={0.85} />
      </mesh>
      <Text position={[0, 0, 0.05]} fontSize={0.3} color="#8a3e6b" anchorX="center" anchorY="middle">
        {kind.emoji}
      </Text>
      <pointLight intensity={0.6} distance={3} color="#ffd166" />
    </group>
  );
}

function InteractableGlows({ list }) {
  const nearby = useGame((s) => s.nearbyInteraction);
  return (
    <group>
      {list.map((it) => {
        if (it.collectible) return null;
        const active = nearby?.id === it.id;
        return (
          <mesh key={it.id + '_glow'} position={[it.pos[0], 0.02, it.pos[2]]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.9, 1.15, 24]} />
            <meshBasicMaterial color={active ? '#ff5c8a' : '#ffd166'} transparent opacity={active ? 0.7 : 0.35} />
          </mesh>
        );
      })}
    </group>
  );
}

function IceCreamCart({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[1.2, 1, 0.8]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, 1.2, 0]}>
        <boxGeometry args={[1.3, 0.15, 0.9]} />
        <meshStandardMaterial color="#ff5c8a" />
      </mesh>
      <mesh position={[-0.5, 0.15, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.15, 16]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[0.5, 0.15, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.15, 16]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[0, 1.6, 0]}>
        <coneGeometry args={[0.2, 0.4, 16]} />
        <meshStandardMaterial color="#f4d0a8" />
      </mesh>
      <mesh position={[0, 1.9, 0]}>
        <sphereGeometry args={[0.22, 12, 12]} />
        <meshStandardMaterial color="#ffb1c8" />
      </mesh>
    </group>
  );
}

function BalloonVendor({ position }) {
  const bunch = useRef();
  useFrame(({ clock }) => {
    if (bunch.current) bunch.current.rotation.z = Math.sin(clock.elapsedTime * 0.6) * 0.05;
  });
  return (
    <group position={position}>
      {/* Vendor */}
      <group scale={0.95}>
        <Person bodyColor="#e63946" hairColor="#4a2a15" hairStyle="short" />
      </group>
      {/* Balloon bunch */}
      <group ref={bunch} position={[0, 2.2, 0]}>
        {['#ff5c8a', '#ffd166', '#c084fc', '#7dcfb6', '#f79256', '#a8dadc'].map((c, i) => {
          const a = (i / 6) * Math.PI * 2;
          return (
            <group key={i} position={[Math.cos(a) * 0.3, i * 0.05, Math.sin(a) * 0.3]}>
              <mesh>
                <sphereGeometry args={[0.24, 12, 12]} />
                <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.1} />
              </mesh>
              <mesh position={[0, -1.3, 0]}>
                <cylinderGeometry args={[0.005, 0.005, 2.5, 4]} />
                <meshStandardMaterial color="#333" />
              </mesh>
            </group>
          );
        })}
      </group>
    </group>
  );
}

function Banner({ position, rotation = 0, text }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[-3, 2.5, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 5, 8]} />
        <meshStandardMaterial color="#5b3a24" />
      </mesh>
      <mesh position={[3, 2.5, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 5, 8]} />
        <meshStandardMaterial color="#5b3a24" />
      </mesh>
      <mesh position={[0, 4.2, 0]}>
        <planeGeometry args={[6, 1.2]} />
        <meshStandardMaterial color="#c94b6b" side={2} />
      </mesh>
      <Billboard position={[0, 4.2, 0.02]} follow={true}>
        <Text fontSize={0.42} color="#ffffff" outlineColor="#5b3a24" outlineWidth={0.03} anchorX="center" anchorY="middle">
          {text}
        </Text>
      </Billboard>
    </group>
  );
}

function SittingNPC({ position, rotationY = 0, body, hair, hairColor }) {
  return (
    <group position={[position[0], position[1] + 0.55, position[2]]} rotation={[0, rotationY, 0]}>
      {/* Torso */}
      <mesh castShadow position={[0, 0.35, 0]}>
        <capsuleGeometry args={[0.2, 0.35, 8, 12]} />
        <meshStandardMaterial color={body} />
      </mesh>
      {/* Head */}
      <mesh castShadow position={[0, 0.95, 0]}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial color="#f2c9a2" />
      </mesh>
      {/* Hair */}
      <mesh position={[0, 1.05, 0]}>
        <sphereGeometry args={[0.235, 16, 12]} />
        <meshStandardMaterial color={hairColor} />
      </mesh>
      {/* Legs (bent) */}
      <mesh position={[-0.12, 0, 0.28]} rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.09, 0.35, 6, 10]} />
        <meshStandardMaterial color="#2b2f52" />
      </mesh>
      <mesh position={[0.12, 0, 0.28]} rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.09, 0.35, 6, 10]} />
        <meshStandardMaterial color="#2b2f52" />
      </mesh>
    </group>
  );
}

function FlyingBird({ path }) {
  const ref = useRef();
  const wingL = useRef();
  const wingR = useRef();
  const config = {
    A: { radius: 40, y: 15, speed: 0.25, phase: 0 },
    B: { radius: 30, y: 18, speed: 0.3, phase: Math.PI },
    C: { radius: 50, y: 12, speed: 0.2, phase: Math.PI / 2 },
  }[path];
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * config.speed + config.phase;
    if (ref.current) {
      ref.current.position.set(Math.cos(t) * config.radius, config.y + Math.sin(t * 2) * 1.2, Math.sin(t) * config.radius);
      ref.current.rotation.y = -t + Math.PI / 2;
    }
    const flap = Math.sin(clock.elapsedTime * 10) * 0.6;
    if (wingL.current) wingL.current.rotation.z = flap;
    if (wingR.current) wingR.current.rotation.z = -flap;
  });
  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh ref={wingL} position={[-0.25, 0, 0]}>
        <boxGeometry args={[0.4, 0.03, 0.15]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      <mesh ref={wingR} position={[0.25, 0, 0]}>
        <boxGeometry args={[0.4, 0.03, 0.15]} />
        <meshStandardMaterial color="#222" />
      </mesh>
    </group>
  );
}
