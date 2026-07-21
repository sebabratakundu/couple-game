import { create } from 'zustand';

const initialMemories = [];
const initialCollected = new Set();

export const useGame = create((set, get) => ({
  // Meta
  started: false,
  ended: false,
  showScrapbook: false,
  showEnding: false,
  ropewayUnlocked: false,
  onRopeway: false,
  atSummit: false,
  activeRide: null, // 'ferris' | 'coaster' | 'boat' | null

  // Personalization
  partnerName: 'Fullu Mukh sona',
  playerName: 'Godai',
  anniversaryDate: '26/07/26',

  // Currency
  lovePoints: 0,
  photos: 0,
  activitiesCompleted: 0,
  minigamesWon: 0,
  foodShared: 0,

  // World
  timeOfDay: 0.1, // 0..1 (0 morning, 0.5 noon, 0.85 sunset, 1 night)
  paused: false,

  // Memories
  memories: initialMemories,
  collectedIds: initialCollected,

  // Interactions
  nearbyInteraction: null, // { id, label, action }
  activeMinigame: null, // 'ringtoss' | 'shooting' | 'dance' | null
  activeScene: null, // 'bowling' | 'ferris' | 'coaster' | 'boat' | 'shooting' | 'food' | null
  foodShareData: null,
  toast: null,

  // Actions
  start: () => set({ started: true }),
  setTime: (t) => set({ timeOfDay: t }),
  setPaused: (p) => set({ paused: p }),
  setNearby: (i) => set({ nearbyInteraction: i }),
  setActiveMinigame: (m) => set({ activeMinigame: m, paused: !!m }),
  setActiveScene: (s, data = null) => set({ activeScene: s, paused: !!s, foodShareData: data }),
  setActiveRide: (r) => set({ activeRide: r, paused: !!r }),
  endRide: (rewardTitle, rewardLove, memory) => {
    const state = get();
    set({ activeRide: null, paused: false });
    if (rewardLove) state.addLove(rewardLove, rewardTitle);
    if (memory) state.addMemory(memory);
    state.registerActivity();
  },
  toggleScrapbook: () => set((s) => ({ showScrapbook: !s.showScrapbook, paused: !s.showScrapbook })),

  addLove: (amount, reason) => {
    set((s) => ({ lovePoints: s.lovePoints + amount }));
    get().flash(`+${amount} ❤️  ${reason || ''}`);
  },

  addMemory: (memory) => {
    const exists = get().memories.some((m) => m.id === memory.id);
    if (exists) return;
    set((s) => ({
      memories: [
        ...s.memories,
        { ...memory, timestamp: new Date().toISOString() },
      ],
    }));
    get().flash(`❤️  Memory unlocked: ${memory.title}`);
  },

  collect: (id, love = 25) => {
    const cs = get().collectedIds;
    if (cs.has(id)) return false;
    const next = new Set(cs);
    next.add(id);
    set({ collectedIds: next });
    get().addLove(love, 'Hidden treasure!');
    return true;
  },

  registerActivity: () => set((s) => ({ activitiesCompleted: s.activitiesCompleted + 1 })),
  registerMinigameWin: () => set((s) => ({ minigamesWon: s.minigamesWon + 1 })),
  registerPhoto: () => set((s) => ({ photos: s.photos + 1 })),
  registerFoodShared: () => set((s) => ({ foodShared: s.foodShared + 1 })),

  unlockRopeway: () => {
    if (get().ropewayUnlocked) return;
    set({ ropewayUnlocked: true });
    get().addMemory({
      id: 'ropeway',
      title: 'Sunset Ticket Earned',
      location: 'Ropeway Station',
      description: 'You saved up enough love to reach the top of the world.',
      emoji: '🎫',
    });
  },

  boardRopeway: () => set({ onRopeway: true, paused: false }),
  reachSummit: () => set({ onRopeway: false, atSummit: true, timeOfDay: 0.82 }),
  triggerEnding: () => set({ showEnding: true, paused: true }),

  flash: (msg) => {
    set({ toast: { msg, ts: Date.now() } });
    setTimeout(() => {
      if (get().toast?.msg === msg) set({ toast: null });
    }, 2200);
  },
}));
