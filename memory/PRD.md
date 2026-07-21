# Anniversary Adventure — Product Requirements

## Original Problem
A stylized, non-combat, semi-realistic 3D anniversary gift game where a couple explores an amusement park, plays mini-games, eats together, collects memories/Love Points, unlocks a ropeway, watches the sunset from a mountain summit, and receives a personalized ending.

**Personalization (from user):**
- Partner: **Fullu Mukh sona**
- Player: **Godai**
- Anniversary: **26/07/26**

**Tech constraint (chosen):** Browser-based 3D via React Three Fiber + Three.js + drei + @react-three/rapier physics + @pmndrs/assets HDRI environment. Runs on any laptop/phone browser, easy to share as a link.

## Delivered so far (in order)

### Foundation (Pass 1)
- Rapier physics + HDRI Environment (`preset="park"`) + drei loading progress hook
- Custom romantic loading screen with rotating messages, heart pulse, progress bar
- Day-only sky cycle capped at Golden Hour while in the park; sunset only triggers at Summit
- Third-person controller with **smooth turning**, **accel/decel**, **idle breathing**, **head-look-at-partner**, **mouse-wheel zoom**, shift-to-run
- Rewritten character (Character.jsx): capsule limbs, expressive face (eyes with highlights, blush cheeks, smile), long-hair variant, hair sway, sitting pose, hands-up pose, waving

### Environment (Pass 1)
- Central fountain, heart hedges, denser tree cluster (3× via multi-cluster), heart-shaped hedges
- Entrance arch with pink pillars + flower cluster
- 4 food stalls (Ice Cream / Pizza / Cotton Candy / Coffee) + 4 game stalls (Ring Toss / Shooting / Dance / Bowling)
- Ice cream carts, balloon vendors, banners ("Happy Anniversary", "Love Wins", "Welcome Sweethearts")
- NPCs: walking waypoint AI + sitting NPCs on benches + flying birds
- Butterflies (3 paths, animated flap), balloons drifting, decorative lamps
- Lake with animated water shader ripples + swimming ducks + wooden bridge + gazebo
- Hidden collectibles (letters, teddy, music boxes) — 12 scattered

### Fully-playable Scenes (Pass 2)
- **Bowling** (Rapier physics) — hold LMB to charge, release to throw; real pin collision; 3 frames; earns 3× score in Love Points
- **Ferris Wheel** (cinematic) — 28s ride with 3 camera modes (interior, outside orbit, close-up), couple sits together, wheel rotates
- **Boat** (in-world) — controllable rowing (W/S/A/D), animated water shader that ripples around the boat, ducks swim nearby, camera follows, 45s ride
- **Roller Coaster** (spline) — CatmullRom curve with hills; car follows, couple sits with hands-up moments, camera trails behind, staged messages ("HANDS UP!", "AAAAAH!", "cheese 📸")
- **Shooting Gallery** (3D raycast) — mouse-aim reticle, click to shoot; moving balloons + ducks at 3 height layers; higher = more points; 30s timer

### Ropeway + Summit (Pass 3)
- **Rewritten Ropeway**: 50s cinematic journey on a spline going UP the mountain
  - Scenery: layered mountains (4 depths), 3 forests, **3 animated waterfalls**, river, 3 villages below, bird flock, cloud layer
  - 3 rotating camera modes + **R key to toggle free orbit** inside cabin
  - Cable car with proper attach arm, tinted windows, tiny flag on top, couple pointing at scenery
  - Sky transitions from Golden Hour up to 0.83 over the ride (day → sunset only at top)
- **Rewritten Summit**: 22m radius island with wooden deck, plank flooring, heart-shaped hedge
  - 10 cherry blossom trees ringed by 12 regular trees
  - Lantern-lit path (12 lanterns)
  - Butterflies fluttering, distant purple mountains + visible waterfall in the valley
  - Cloud layer below, wildflower field (100+ flowers)
  - Sunset-facing bench with "Sit together — Press E" prompt

### Ending Sequence
- 5-stage cinematic: Sunset scene → "Happy Anniversary, My Fullu Mukh sona ❤ · 26/07/26" → memory slideshow of everything played → stats grid → handwritten love letter from Godai
- Fireflies + floating lanterns + fireworks bursts
- Play-again button

### UI Systems
- HUD with Love Points, ropeway progress, time-of-day, journal button, photo counter
- Scrapbook journal (rotating memory cards)
- Interact prompts (nearby E-key), toast notifications
- Selfie via Spacebar (camera flash + memory)
- Debug keys: `=` add 100 love, `]` teleport to summit, `'` trigger ending

## Backlog / Nice-to-haves
- Real gLTF character models (Quaternius or Ready Player Me) with mocap animations (would need asset hosting)
- Real Water shader from three/addons with HDRI reflections
- Rapier-based Ring Toss (currently kept as 2D popup for now)
- Ice Cream / Pizza / Cotton Candy shared-eating cinematic scenes
- Music: royalty-free ambient piano at summit + park ambience layered by zone
- Photo mode with save-to-scrapbook

## Personalization touches embedded
- Start screen: "For Fullu Mukh sona, from Godai · 26/07/26"
- Love letter at ending signed "— Godai"
- All memory descriptions reference "she", "you two", romantic tone

## Files structure
```
/app/frontend/src/game/
├── Game.jsx             — Canvas + scene router
├── Loading.jsx          — Loading screen with useProgress
├── Character.jsx        — Rewritten stylized character w/ animation
├── Player.jsx           — Third-person controller (smooth turning, zoom, run)
├── Sky.jsx              — Day cycle + hemisphere/directional + sky dome shader
├── World.jsx            — Park world with all interactables + NPCs + decor
├── Ropeway.jsx          — 50s cinematic ropeway + expanded summit
├── UI.jsx               — HUD, StartScreen, Scrapbook, InteractPrompt
├── Ending.jsx           — Multi-stage cinematic ending
├── Minigames.jsx        — Legacy 2D minigame popups (RingToss, Shooting-2D, Dance)
├── props.jsx            — Reusable Tree/CherryTree/Bench/Fountain/Butterfly/etc.
├── store.js             — Zustand state (Love Points, memories, scene switching)
├── utils.js             — Sky color LUT + time helpers + seeded rand
└── scenes/
    ├── Bowling.jsx      — Rapier physics
    ├── FerrisWheelScene — Cinematic
    ├── BoatScene        — Playable rowing
    ├── CoasterScene     — Spline ride
    └── ShootingScene    — 3D raycast
```
