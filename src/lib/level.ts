const LEVEL_THRESHOLDS = [
  { pct: 0,    name: 'Level 1: Rookie' },
  { pct: 0.1,  name: 'Level 2: Beginner' },
  { pct: 0.25, name: 'Level 3: Intermediate' },
  { pct: 0.5,  name: 'Level 4: Advanced' },
  { pct: 0.75, name: 'Level 5: Expert' },
  { pct: 1,    name: 'Level 6: Master' },
] as const;

export function getLevel(completed: number, total: number): string {
  const pct = total > 0 ? completed / total : 0;
  let current: string = LEVEL_THRESHOLDS[0].name;
  for (const t of LEVEL_THRESHOLDS) {
    if (pct >= t.pct) current = t.name;
  }
  return current;
}

export interface NextLevelProgress {
  skillsNeeded: number;
  nextLevelName: string;
}

// How many more completions until the next level — null once already at
// the max level (100%).
export function getNextLevelProgress(completed: number, total: number): NextLevelProgress | null {
  const pct = total > 0 ? completed / total : 0;
  const next = LEVEL_THRESHOLDS.find(t => t.pct > pct);
  if (!next) return null;
  const neededCount = Math.ceil(next.pct * total);
  return {
    skillsNeeded: Math.max(1, neededCount - completed),
    nextLevelName: next.name,
  };
}
