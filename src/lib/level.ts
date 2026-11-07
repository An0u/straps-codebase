export function getLevel(completed: number, total: number): string {
  const pct = total > 0 ? completed / total : 0;
  if (pct >= 1) return 'Level 6: Master';
  if (pct >= 0.75) return 'Level 5: Expert';
  if (pct >= 0.5) return 'Level 4: Advanced';
  if (pct >= 0.25) return 'Level 3: Intermediate';
  if (pct >= 0.1) return 'Level 2: Beginner';
  return 'Level 1: Rookie';
}
