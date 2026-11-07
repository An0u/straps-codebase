/*
 * ============================================================================
 * COMPLETE DIRECTIONAL LOGIC WITH RHOMBUS CENTER AND NON-OVERLAPPING GROUPS
 * ============================================================================
 * 
 * RHOMBUS CENTER STRUCTURE
 * ------------------------
 * The skill tree originates from a central rhombus positioned at the page center.
 * The rhombus has four corners positioned at cardinal directions: TOP, RIGHT, BOTTOM, and LEFT.
 * Each corner serves as an anchor point where a Level 1 node group begins.
 * A node group consists of a Level 1 node (category) and ALL its descendant nodes (Level 2, 3, and 4 children).
 * 
 * Rhombus Layout:
 * - TOP corner: Reserved for future expansion or central navigation
 * - RIGHT corner: 'Two Arm' category group flows RIGHT (left-to-right)
 * - BOTTOM corner: 'C-Shaping' category group flows DOWN (top-to-bottom)
 * - LEFT corner: 'One Arm' category group flows LEFT (right-to-left)
 * 
 * Each Level 1 node is positioned at its respective rhombus corner, and its entire
 * descendant hierarchy extends outward in the designated direction.
 * 
 * ============================================================================
 * RIGHT DIRECTION (Two Arm Category - from RIGHT corner)
 * ============================================================================
 * 
 * Flow: Level 1 → Level 2 (right) → Level 3 (right) → Level 4 chain (right, +150px each)
 * Level 4 chains: horizontal, x starts at 1710, step +150. y fixed per L3.
 * 
 * ============================================================================
 * LEFT DIRECTION (One Arm Category - from LEFT corner)
 * ============================================================================
 * 
 * Flow: Level 1 → Level 2 (left) → Level 3 (left) → Level 4 chain (left, -150px each)
 * Level 4 chains: horizontal, x starts at 210, step -150. y fixed per L3.
 * 
 * ============================================================================
 * DOWN DIRECTION (C-Shaping Category - from BOTTOM corner)
 * ============================================================================
 * 
 * Flow: Level 1 → Level 2 (down) → Level 3 (down) → Level 4 chain (down, +150px each)
 * Level 4 chains: vertical, x fixed at 960, y starts at 1610, step +150.
 * 
 * ============================================================================
 * UP DIRECTION (Future Expansion - from TOP corner)
 * ============================================================================
 * Reserved. Any new L1 category flows upward from the TOP rhombus corner.
 * 
 * ============================================================================
 * SPACING AND CONNECTION RULES
 * ============================================================================
 * - L1 → L2: straight lines
 * - L2 → L3: straight lines
 * - L3 → first L4 only: straight line; rest of chain is sequential L4 → L4
 * - L4 chain: each skill connects forward to the next (singly linked)
 * - Key skills (type: 'key'): isGoldBorder = true, yellow glow in UI
 * - isBlue = true for Two Arm skills, false for One Arm / C-Shaping
 * 
 * NODE SCHEMA
 * -----------
 * id          — unique slug identifier
 * name        — display name
 * description — skill description
 * prerequisites — parent node ids (used for lock/unlock logic)
 * type        — 'category' | 'regular' | 'key'
 * state       — 'active' | 'inactive'
 * isGoldBorder — true for key skills
 * isBlue      — true for Two Arm branch
 * x, y        — absolute canvas position in pixels
 * connections — child node ids (what this node unlocks)
 * videoUrl    — optional YouTube link
 * ============================================================================
 */

export type SkillState = 'active' | 'inactive';
export type SkillType = 'category' | 'regular' | 'key';

export interface Skill {
  id: string;
  /** Display name. Hydrated at runtime from Supabase. */
  name?: string;
  /** Description. Hydrated at runtime from Supabase. */
  description?: string;
  prerequisites: string[];
  type: SkillType;
  state: SkillState;
  isGoldBorder?: boolean;
  isBlue?: boolean;
  x: number;
  y: number;
  connections: string[];
  /** Video URL. Hydrated at runtime from Supabase; absent here. */
  videoUrl?: string;
}

export interface SkillTreeSection {
  id: string;
  skills: Skill[];
}

export const skillTreeData: Skill[] = [

  // ── LEVEL 1 ─────────────────────────────────────────────────────────────────
  {
    id: 'two-arm',
    prerequisites: [],
    type: 'category',
    state: 'active',
    isBlue: true,
    x: 1050,
    y: 450,
    connections: ['two-spin', 'two-static', 'two-swing']
  },
  {
    id: 'one-arm',
    prerequisites: [],
    type: 'category',
    state: 'active',
    x: 870,
    y: 450,
    connections: ['one-spin', 'one-static', 'one-swing']
  },
  {
    id: 'c-shaping',
    prerequisites: [],
    type: 'category',
    state: 'active',
    x: 960,
    y: 1200,
    connections: ['c-shaping-static']
  },
  {
    id: 'armpit-skills',
    prerequisites: [],
    type: 'category',
    state: 'inactive',
    x: 960,
    y: -150,
    connections: []
  },

  // ── LEVEL 2 — Two Arm ────────────────────────────────────────────────────────
  {
    id: 'two-spin',
    prerequisites: ['two-arm'],
    type: 'category',
    state: 'active',
    isBlue: true,
    x: 1300,
    y: 75,
    connections: ['two-spin-normal', 'two-spin-reverse', 'two-spin-center']
  },
  {
    id: 'two-static',
    prerequisites: ['two-arm'],
    type: 'category',
    state: 'active',
    isBlue: true,
    x: 1300,
    y: 525,
    connections: ['two-static-hanging', 'two-static-support', 'two-static-support-ii']
  },
  {
    id: 'two-swing',
    prerequisites: ['two-arm'],
    type: 'category',
    state: 'active',
    isBlue: true,
    x: 1300,
    y: 975,
    connections: ['two-swing-twisting', 'two-swing-twisting-ii', 'two-swing-rotating']
  },

  // ── LEVEL 2 — One Arm ────────────────────────────────────────────────────────
  {
    id: 'one-spin',
    prerequisites: ['one-arm'],
    type: 'category',
    state: 'active',
    x: 620,
    y: 75,
    connections: ['one-spin-center', 'one-spin-reverse', 'one-spin-normal']
  },
  {
    id: 'one-static',
    prerequisites: ['one-arm'],
    type: 'category',
    state: 'active',
    x: 620,
    y: 450,
    connections: ['one-static-hanging']
  },
  {
    id: 'one-swing',
    prerequisites: ['one-arm'],
    type: 'category',
    state: 'active',
    x: 620,
    y: 888,
    connections: ['one-swing-basics', 'one-swing-twisting', 'one-swing-rotating', 'one-swing-rotating-ii']
  },

  // ── LEVEL 2 — C-Shaping ──────────────────────────────────────────────────────
  {
    id: 'c-shaping-static',
    prerequisites: ['c-shaping'],
    type: 'category',
    state: 'active',
    x: 960,
    y: 1450,
    connections: ['front-c']
  },

  // ── LEVEL 3 — Two Arm Spin ───────────────────────────────────────────────────
  {
    id: 'two-spin-normal',
    prerequisites: ['two-spin'],
    type: 'category',
    state: 'active',
    isBlue: true,
    x: 1550,
    y: -75,
    connections: ['flare']
  },
  {
    id: 'two-spin-reverse',
    prerequisites: ['two-spin'],
    type: 'category',
    state: 'active',
    isBlue: true,
    x: 1550,
    y: 75,
    connections: ['meathook-in-reverse']
  },
  {
    id: 'two-spin-center',
    prerequisites: ['two-spin'],
    type: 'category',
    state: 'active',
    isBlue: true,
    x: 1550,
    y: 225,
    connections: ['spinning-muscle-up']
  },

  // ── LEVEL 3 — Two Arm Static ─────────────────────────────────────────────────
  {
    id: 'two-static-hanging',
    prerequisites: ['two-static'],
    type: 'category',
    state: 'active',
    isBlue: true,
    x: 1550,
    y: 375,
    connections: ['2-arm-inversion']
  },
  {
    id: 'two-static-support',
    prerequisites: ['two-static'],
    type: 'category',
    state: 'active',
    isBlue: true,
    x: 1550,
    y: 525,
    connections: ['front-balance']
  },
  {
    id: 'two-static-support-ii',
    prerequisites: ['two-static'],
    type: 'category',
    state: 'active',
    isBlue: true,
    x: 1550,
    y: 675,
    connections: ['bent-arm-to-handstand']
  },

  // ── LEVEL 3 — Two Arm Swing ──────────────────────────────────────────────────
  {
    id: 'two-swing-twisting',
    prerequisites: ['two-swing'],
    type: 'category',
    state: 'active',
    isBlue: true,
    x: 1550,
    y: 825,
    connections: ['pull-to-hips']
  },
  {
    id: 'two-swing-twisting-ii',
    prerequisites: ['two-swing'],
    type: 'category',
    state: 'active',
    isBlue: true,
    x: 1550,
    y: 975,
    connections: ['bell-beats']
  },
  {
    id: 'two-swing-rotating',
    prerequisites: ['two-swing'],
    type: 'category',
    state: 'active',
    isBlue: true,
    x: 1550,
    y: 1125,
    connections: ['armpit-beats']
  },

  // ── LEVEL 3 — One Arm Spin ───────────────────────────────────────────────────
  {
    id: 'one-spin-center',
    prerequisites: ['one-spin'],
    type: 'category',
    state: 'active',
    x: 370,
    y: -75,
    connections: ['center-spin'],
	
  },
  {
    id: 'one-spin-reverse',
    prerequisites: ['one-spin'],
    type: 'category',
    state: 'active',
    x: 370,
    y: 75,
    connections: ['meathook-1']
  },
  {
    id: 'one-spin-normal',
    prerequisites: ['one-spin'],
    type: 'category',
    state: 'active',
    x: 370,
    y: 225,
    connections: ['flare-1']
  },

  // ── LEVEL 3 — One Arm Static ─────────────────────────────────────────────────
  {
    id: 'one-static-hanging',
    prerequisites: ['one-static'],
    type: 'category',
    state: 'active',
    x: 370,
    y: 450,
    connections: ['straddle-rock-to-flag']
  },

  // ── LEVEL 3 — One Arm Swing ──────────────────────────────────────────────────
  {
    id: 'one-swing-basics',
    prerequisites: ['one-swing'],
    type: 'category',
    state: 'active',
    x: 370,
    y: 663,
    connections: ['front-to-front']
  },
  {
    id: 'one-swing-twisting',
    prerequisites: ['one-swing'],
    type: 'category',
    state: 'active',
    x: 370,
    y: 813,
    connections: ['inside-pirouette']
  },
  {
    id: 'one-swing-rotating',
    prerequisites: ['one-swing'],
    type: 'category',
    state: 'active',
    x: 370,
    y: 963,
    connections: ['back']
  },
  {
    id: 'one-swing-rotating-ii',
    prerequisites: ['one-swing'],
    type: 'category',
    state: 'active',
    x: 370,
    y: 1113,
    connections: ['front']
  },

  // ── LEVEL 4 — two-spin-normal chain ─────────────────────────────────────────────────
  {
    id: 'flare',
    prerequisites: ['two-spin-normal'],
    type: 'key',
    state: 'inactive',
    isBlue: true,
    isGoldBorder: true,
    x: 1710,
    y: -75,
    connections: ['nutcracker'],
  },
  {
    id: 'nutcracker',
    prerequisites: ['two-spin-normal'],
    type: 'regular',
    state: 'inactive',
    isBlue: true,
    x: 1860,
    y: -75,
    connections: ['meathook'],
  },
  {
    id: 'meathook',
    prerequisites: ['two-spin-normal'],
    type: 'regular',
    state: 'inactive',
    isBlue: true,
    x: 2010,
    y: -75,
    connections: ['straightjacket'],
  },
  {
    id: 'straightjacket',
    prerequisites: ['two-spin-normal'],
    type: 'regular',
    state: 'inactive',
    isBlue: true,
    x: 2160,
    y: -75,
    connections: ['flare-to-flag'],
  },
  {
    id: 'flare-to-flag',
    prerequisites: ['two-spin-normal'],
    type: 'key',
    state: 'inactive',
    isBlue: true,
    isGoldBorder: true,
    x: 2310,
    y: -75,
    connections: ['flare-to-full'],
  },
  {
    id: 'flare-to-full',
    prerequisites: ['two-spin-normal'],
    type: 'regular',
    state: 'inactive',
    isBlue: true,
    x: 2460,
    y: -75,
    connections: [],
  },

  // ── LEVEL 4 — two-spin-reverse chain ─────────────────────────────────────────────────
  {
    id: 'meathook-in-reverse',
    prerequisites: ['two-spin-reverse'],
    type: 'regular',
    state: 'inactive',
    isBlue: true,
    x: 1710,
    y: 75,
    connections: ['straightjacket-in-reverse'],
  },
  {
    id: 'straightjacket-in-reverse',
    prerequisites: ['two-spin-reverse'],
    type: 'regular',
    state: 'inactive',
    isBlue: true,
    x: 1860,
    y: 75,
    connections: [],
  },

  // ── LEVEL 4 — two-spin-center chain ─────────────────────────────────────────────────
  {
    id: 'spinning-muscle-up',
    prerequisites: ['two-spin-center'],
    type: 'regular',
    state: 'inactive',
    isBlue: true,
    x: 1710,
    y: 225,
    connections: [],
  },

  // ── LEVEL 4 — two-static-hanging chain ─────────────────────────────────────────────────
  {
    id: '2-arm-inversion',
    prerequisites: ['two-static-hanging'],
    type: 'key',
    state: 'inactive',
    isBlue: true,
    isGoldBorder: true,
    x: 1710,
    y: 375,
    connections: ['2-arm-skin-the-cat'],
  },
  {
    id: '2-arm-skin-the-cat',
    prerequisites: ['two-static-hanging'],
    type: 'regular',
    state: 'inactive',
    isBlue: true,
    x: 1860,
    y: 375,
    connections: ['inversion-to-methook'],
  },
  {
    id: 'inversion-to-methook',
    prerequisites: ['two-static-hanging'],
    type: 'regular',
    state: 'inactive',
    isBlue: true,
    x: 2010,
    y: 375,
    connections: ['back-flag'],
  },
  {
    id: 'back-flag',
    prerequisites: ['two-static-hanging'],
    type: 'key',
    state: 'inactive',
    isBlue: true,
    isGoldBorder: true,
    x: 2160,
    y: 375,
    connections: [],
  },

  // ── LEVEL 4 — two-static-support chain ─────────────────────────────────────────────────
  {
    id: 'front-balance',
    prerequisites: ['two-static-support'],
    type: 'regular',
    state: 'inactive',
    isBlue: true,
    x: 1710,
    y: 525,
    connections: ['side-balance'],
  },
  {
    id: 'side-balance',
    prerequisites: ['two-static-support'],
    type: 'regular',
    state: 'inactive',
    isBlue: true,
    x: 1860,
    y: 525,
    connections: ['butterfly'],
  },
  {
    id: 'butterfly',
    prerequisites: ['two-static-support'],
    type: 'regular',
    state: 'inactive',
    isBlue: true,
    x: 2010,
    y: 525,
    connections: ['full-to-full'],
  },
  {
    id: 'full-to-full',
    prerequisites: ['two-static-support'],
    type: 'regular',
    state: 'inactive',
    isBlue: true,
    x: 2160,
    y: 525,
    connections: [],
  },

  // ── LEVEL 4 — two-static-support-ii chain ─────────────────────────────────────────────────
  {
    id: 'bent-arm-to-handstand',
    prerequisites: ['two-static-support-ii'],
    type: 'regular',
    state: 'inactive',
    isBlue: true,
    x: 1710,
    y: 675,
    connections: ['roll-ups'],
  },
  {
    id: 'roll-ups',
    prerequisites: ['two-static-support-ii'],
    type: 'key',
    state: 'inactive',
    isBlue: true,
    isGoldBorder: true,
    x: 1860,
    y: 675,
    connections: ['press-handstand'],
  },
  {
    id: 'press-handstand',
    prerequisites: ['two-static-support-ii'],
    type: 'regular',
    state: 'inactive',
    isBlue: true,
    x: 2010,
    y: 675,
    connections: ['azarian'],
  },
  {
    id: 'azarian',
    prerequisites: ['two-static-support-ii'],
    type: 'regular',
    state: 'inactive',
    isBlue: true,
    x: 2160,
    y: 675,
    connections: [],
  },

  // ── LEVEL 4 — two-swing-twisting chain ─────────────────────────────────────────────────
  {
    id: 'pull-to-hips',
    prerequisites: ['two-swing-twisting'],
    type: 'regular',
    state: 'inactive',
    isBlue: true,
    x: 1710,
    y: 825,
    connections: ['swing-to-meathook'],
  },
  {
    id: 'swing-to-meathook',
    prerequisites: ['two-swing-twisting'],
    type: 'regular',
    state: 'inactive',
    isBlue: true,
    x: 1860,
    y: 825,
    connections: ['side-swing-to-2-arm-flag'],
  },
  {
    id: 'side-swing-to-2-arm-flag',
    prerequisites: ['two-swing-twisting'],
    type: 'regular',
    state: 'inactive',
    isBlue: true,
    x: 2010,
    y: 825,
    connections: ['swing-to-fulll'],
  },
  {
    id: 'swing-to-fulll',
    prerequisites: ['two-swing-twisting'],
    type: 'regular',
    state: 'inactive',
    isBlue: true,
    x: 2160,
    y: 825,
    connections: [],
  },

  // ── LEVEL 4 — two-swing-twisting-ii chain ─────────────────────────────────────────────────
  {
    id: 'bell-beats',
    prerequisites: ['two-swing-twisting-ii'],
    type: 'regular',
    state: 'inactive',
    isBlue: true,
    x: 1710,
    y: 975,
    connections: ['to-plank'],
  },
  {
    id: 'to-plank',
    prerequisites: ['two-swing-twisting-ii'],
    type: 'regular',
    state: 'inactive',
    isBlue: true,
    x: 1860,
    y: 975,
    connections: ['side-push-pull'],
  },
  {
    id: 'side-push-pull',
    prerequisites: ['two-swing-twisting-ii'],
    type: 'regular',
    state: 'inactive',
    isBlue: true,
    x: 2010,
    y: 975,
    connections: ['half-turn'],
  },
  {
    id: 'half-turn',
    prerequisites: ['two-swing-twisting-ii'],
    type: 'regular',
    state: 'inactive',
    isBlue: true,
    x: 2160,
    y: 975,
    connections: ['pirouette'],
  },
  {
    id: 'pirouette',
    prerequisites: ['two-swing-twisting-ii'],
    type: 'regular',
    state: 'inactive',
    isBlue: true,
    x: 2310,
    y: 975,
    connections: ['swing-to-handstand'],
  },
  {
    id: 'swing-to-handstand',
    prerequisites: ['two-swing-twisting-ii'],
    type: 'regular',
    state: 'inactive',
    isBlue: true,
    x: 2460,
    y: 975,
    connections: [],
  },

  // ── LEVEL 4 — two-swing-rotating chain ─────────────────────────────────────────────────
  {
    id: 'armpit-beats',
    prerequisites: ['two-swing-rotating'],
    type: 'regular',
    state: 'inactive',
    isBlue: true,
    x: 1710,
    y: 1125,
    connections: ['disloc'],
  },
  {
    id: 'disloc',
    prerequisites: ['two-swing-rotating'],
    type: 'regular',
    state: 'inactive',
    isBlue: true,
    x: 1860,
    y: 1125,
    connections: ['inloc'],
  },
  {
    id: 'inloc',
    prerequisites: ['two-swing-rotating'],
    type: 'regular',
    state: 'inactive',
    isBlue: true,
    x: 2010,
    y: 1125,
    connections: ['giants'],
  },
  {
    id: 'giants',
    prerequisites: ['two-swing-rotating'],
    type: 'regular',
    state: 'inactive',
    isBlue: true,
    x: 2160,
    y: 1125,
    connections: ['inloc-giants'],
  },
  {
    id: 'inloc-giants',
    prerequisites: ['two-swing-rotating'],
    type: 'regular',
    state: 'inactive',
    isBlue: true,
    x: 2310,
    y: 1125,
    connections: ['back-salto'],
  },
  {
    id: 'back-salto',
    prerequisites: ['two-swing-rotating'],
    type: 'regular',
    state: 'inactive',
    isBlue: true,
    x: 2460,
    y: 1125,
    connections: ['delchev'],
  },
  {
    id: 'delchev',
    prerequisites: ['two-swing-rotating'],
    type: 'regular',
    state: 'inactive',
    isBlue: true,
    x: 2610,
    y: 1125,
    connections: ['yamawaki'],
  },
  {
    id: 'yamawaki',
    prerequisites: ['two-swing-rotating'],
    type: 'regular',
    state: 'inactive',
    isBlue: true,
    x: 2760,
    y: 1125,
    connections: [],
  },

  // ── LEVEL 4 — one-spin-center chain ─────────────────────────────────────────────────
  {
    id: 'center-spin',
    prerequisites: ['one-spin-center'],
    type: 'regular',
    state: 'inactive',
    x: 210,
    y: -75,
    connections: ['front-candle'],
  },
  {
    id: 'front-candle',
    prerequisites: ['one-spin-center'],
    type: 'regular',
    state: 'inactive',
    x: 60,
    y: -75,
    connections: ['back-candle'],
  },
  {
    id: 'back-candle',
    prerequisites: ['one-spin-center'],
    type: 'regular',
    state: 'inactive',
    x: -90,
    y: -75,
    connections: ['nugget'],
  },
  {
    id: 'nugget',
    prerequisites: ['one-spin-center'],
    type: 'regular',
    state: 'inactive',
    x: -240,
    y: -75,
    connections: [],
  },

  // ── LEVEL 4 — one-spin-reverse chain ─────────────────────────────────────────────────
  {
    id: 'meathook-1',
    prerequisites: ['one-spin-reverse'],
    type: 'regular',
    state: 'inactive',
    x: 210,
    y: 75,
    connections: ['split-grip-to-flag'],
  },
  {
    id: 'split-grip-to-flag',
    prerequisites: ['one-spin-reverse'],
    type: 'regular',
    state: 'inactive',
    x: 60,
    y: 75,
    connections: ['split-grip-to-full'],
  },
  {
    id: 'split-grip-to-full',
    prerequisites: ['one-spin-reverse'],
    type: 'regular',
    state: 'inactive',
    x: -90,
    y: 75,
    connections: ['flare-to-lockoff'],
  },
  {
    id: 'flare-to-lockoff',
    prerequisites: ['one-spin-reverse'],
    type: 'regular',
    state: 'inactive',
    x: -240,
    y: 75,
    connections: ['beat-to-1-arm'],
  },
  {
    id: 'beat-to-1-arm',
    prerequisites: ['one-spin-reverse'],
    type: 'regular',
    state: 'inactive',
    x: -390,
    y: 75,
    connections: ['reverse-flag'],
  },
  {
    id: 'reverse-flag',
    prerequisites: ['one-spin-reverse'],
    type: 'regular',
    state: 'inactive',
    x: -540,
    y: 75,
    connections: ['reverse-full'],
  },
  {
    id: 'reverse-full',
    prerequisites: ['one-spin-reverse'],
    type: 'regular',
    state: 'inactive',
    x: -690,
    y: 75,
    connections: ['reverse-mushu'],
  },
  {
    id: 'reverse-mushu',
    prerequisites: ['one-spin-reverse'],
    type: 'regular',
    state: 'inactive',
    x: -840,
    y: 75,
    connections: [],
  },

  // ── LEVEL 4 — one-spin-normal chain ─────────────────────────────────────────────────
  {
    id: 'flare-1',
    prerequisites: ['one-spin-normal'],
    type: 'regular',
    state: 'inactive',
    x: 210,
    y: 225,
    connections: ['nutcracker-1'],
  },
  {
    id: 'nutcracker-1',
    prerequisites: ['one-spin-normal'],
    type: 'regular',
    state: 'inactive',
    x: 60,
    y: 225,
    connections: ['reverse-meathook'],
  },
  {
    id: 'reverse-meathook',
    prerequisites: ['one-spin-normal'],
    type: 'regular',
    state: 'inactive',
    x: -90,
    y: 225,
    connections: ['flare-to-flag-1'],
  },
  {
    id: 'flare-to-flag-1',
    prerequisites: ['one-spin-normal'],
    type: 'key',
    state: 'inactive',
    isGoldBorder: true,
    x: -240,
    y: 225,
    connections: ['low-switch'],
  },
  {
    id: 'low-switch',
    prerequisites: ['one-spin-normal'],
    type: 'regular',
    state: 'inactive',
    x: -390,
    y: 225,
    connections: ['nutcrcker-switch'],
  },
  {
    id: 'nutcrcker-switch',
    prerequisites: ['one-spin-normal'],
    type: 'regular',
    state: 'inactive',
    x: -540,
    y: 225,
    connections: ['high-switch'],
  },
  {
    id: 'high-switch',
    prerequisites: ['one-spin-normal'],
    type: 'regular',
    state: 'inactive',
    x: -690,
    y: 225,
    connections: ['full'],
  },
  {
    id: 'full',
    prerequisites: ['one-spin-normal'],
    type: 'regular',
    state: 'inactive',
    x: -840,
    y: 225,
    connections: ['mushu'],
  },
  {
    id: 'mushu',
    prerequisites: ['one-spin-normal'],
    type: 'key',
    state: 'inactive',
    isGoldBorder: true,
    x: -990,
    y: 225,
    connections: ['double-full'],
  },
  {
    id: 'double-full',
    prerequisites: ['one-spin-normal'],
    type: 'regular',
    state: 'inactive',
    x: -1140,
    y: 225,
    connections: [],
  },

  // ── LEVEL 4 — one-static-hanging chain ─────────────────────────────────────────────────
  {
    id: 'straddle-rock-to-flag',
    prerequisites: ['one-static-hanging'],
    type: 'regular',
    state: 'inactive',
    x: 210,
    y: 450,
    connections: ['high-switch-1'],
  },
  {
    id: 'high-switch-1',
    prerequisites: ['one-static-hanging'],
    type: 'regular',
    state: 'inactive',
    x: 60,
    y: 450,
    connections: ['inversion'],
  },
  {
    id: 'inversion',
    prerequisites: ['one-static-hanging'],
    type: 'regular',
    state: 'inactive',
    x: -90,
    y: 450,
    connections: ['inversion-to-meathook'],
  },
  {
    id: 'inversion-to-meathook',
    prerequisites: ['one-static-hanging'],
    type: 'regular',
    state: 'inactive',
    x: -240,
    y: 450,
    connections: ['inversion-to-flag'],
  },
  {
    id: 'inversion-to-flag',
    prerequisites: ['one-static-hanging'],
    type: 'regular',
    state: 'inactive',
    x: -390,
    y: 450,
    connections: [],
  },

  // ── LEVEL 4 — one-swing-basics chain ─────────────────────────────────────────────────
  {
    id: 'front-to-front',
    prerequisites: ['one-swing-basics'],
    type: 'regular',
    state: 'inactive',
    x: 210,
    y: 663,
    connections: ['fron-to-side'],
  },
  {
    id: 'fron-to-side',
    prerequisites: ['one-swing-basics'],
    type: 'regular',
    state: 'inactive',
    x: 60,
    y: 663,
    connections: [],
  },

  // ── LEVEL 4 — one-swing-twisting chain ─────────────────────────────────────────────────
  {
    id: 'inside-pirouette',
    prerequisites: ['one-swing-twisting'],
    type: 'regular',
    state: 'inactive',
    x: 210,
    y: 813,
    connections: ['reverse-soleil'],
  },
  {
    id: 'reverse-soleil',
    prerequisites: ['one-swing-twisting'],
    type: 'regular',
    state: 'inactive',
    x: 60,
    y: 813,
    connections: ['soleil'],
  },
  {
    id: 'soleil',
    prerequisites: ['one-swing-twisting'],
    type: 'regular',
    state: 'inactive',
    x: -90,
    y: 813,
    connections: ['outside-pirouette'],
  },
  {
    id: 'outside-pirouette',
    prerequisites: ['one-swing-twisting'],
    type: 'regular',
    state: 'inactive',
    x: -240,
    y: 813,
    connections: ['swing-to-flag'],
  },
  {
    id: 'swing-to-flag',
    prerequisites: ['one-swing-twisting'],
    type: 'regular',
    state: 'inactive',
    x: -390,
    y: 813,
    connections: ['swing-to-mushu'],
  },
  {
    id: 'swing-to-mushu',
    prerequisites: ['one-swing-twisting'],
    type: 'regular',
    state: 'inactive',
    x: -540,
    y: 813,
    connections: [],
  },

  // ── LEVEL 4 — one-swing-rotating chain ─────────────────────────────────────────────────
  {
    id: 'back',
    prerequisites: ['one-swing-rotating'],
    type: 'regular',
    state: 'inactive',
    x: 210,
    y: 963,
    connections: ['disloc-1'],
  },
  {
    id: 'disloc-1',
    prerequisites: ['one-swing-rotating'],
    type: 'regular',
    state: 'inactive',
    x: 60,
    y: 963,
    connections: ['salto'],
  },
  {
    id: 'salto',
    prerequisites: ['one-swing-rotating'],
    type: 'regular',
    state: 'inactive',
    x: -90,
    y: 963,
    connections: ['1-5-arm-salto'],
  },
  {
    id: '1-5-arm-salto',
    prerequisites: ['one-swing-rotating'],
    type: 'regular',
    state: 'inactive',
    x: -240,
    y: 963,
    connections: ['double-salto'],
  },
  {
    id: 'double-salto',
    prerequisites: ['one-swing-rotating'],
    type: 'regular',
    state: 'inactive',
    x: -390,
    y: 963,
    connections: [],
  },

  // ── LEVEL 4 — one-swing-rotating-ii chain ─────────────────────────────────────────────────
  {
    id: 'front',
    prerequisites: ['one-swing-rotating-ii'],
    type: 'regular',
    state: 'inactive',
    x: 210,
    y: 1113,
    connections: ['inloc-1'],
  },
  {
    id: 'inloc-1',
    prerequisites: ['one-swing-rotating-ii'],
    type: 'regular',
    state: 'inactive',
    x: 60,
    y: 1113,
    connections: ['double-front'],
  },
  {
    id: 'double-front',
    prerequisites: ['one-swing-rotating-ii'],
    type: 'regular',
    state: 'inactive',
    x: -90,
    y: 1113,
    connections: [],
  },

  // ── LEVEL 4 — c-shaping-static chain ─────────────────────────────────────────
  {
    id: 'front-c',
    prerequisites: ['c-shaping-static'],
    type: 'regular',
    state: 'inactive',
    x: 960,
    y: 1610,
    connections: []
  }
];

export const getSkillById = (id: string): Skill | undefined => {
  return skillTreeData.find(skill => skill.id === id);
};

export const getPrerequisiteSkills = (skill: Skill): Skill[] => {
  return skill.prerequisites
    .map(prereqId => getSkillById(prereqId))
    .filter((s): s is Skill => s !== undefined);
};
