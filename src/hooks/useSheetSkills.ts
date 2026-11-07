import { useQuery } from '@tanstack/react-query';
import { skillTreeData, Skill } from '@/data/skillTreeData';
import { supabase } from '@/lib/supabase';

type Direction = 'Left' | 'Right' | 'Down' | 'Up';

interface CategoryRow { id: number; slug: string; name: string; direction: Direction }
interface GroupRow { id: number; slug: string; name: string; category_id: number }
interface SubgroupRow { id: number; slug: string; name: string; group_id: number }

interface SkillRow {
  id: number;
  slug: string;
  name: string;
  is_key_skill: boolean;
  direction: Direction;
  link: string | null;
  description: string | null;
  connects_to: number | null;
  subgroup_id: number;
}

interface SkillRecord {
  slug: string;
  name: string;
  isKey: boolean;
  direction: Direction;
  videoUrl: string;
  description: string;
  connectsToSlug: string | null;
  subgroupSlug: string | null;
}

// A hierarchy node (group or subgroup) not yet resolved into the merged tree.
interface PendingHierarchyNode {
  slug: string;
  name: string;
  parentSlug: string | null;
  direction: Direction | null;
}

async function fetchAllFromSupabase() {
  const [catsRes, groupsRes, subsRes, skillsRes] = await Promise.all([
    supabase.from('categories').select('id, slug, name, direction'),
    supabase.from('groups').select('id, slug, name, category_id'),
    supabase.from('subgroups').select('id, slug, name, group_id'),
    supabase.from('skills').select('id, slug, name, is_key_skill, direction, link, description, connects_to, subgroup_id'),
  ]);

  if (catsRes.error)   throw catsRes.error;
  if (groupsRes.error) throw groupsRes.error;
  if (subsRes.error)   throw subsRes.error;
  if (skillsRes.error) throw skillsRes.error;

  const categories = (catsRes.data   ?? []) as CategoryRow[];
  const groups     = (groupsRes.data ?? []) as GroupRow[];
  const subgroups  = (subsRes.data   ?? []) as SubgroupRow[];
  const skillRows  = (skillsRes.data ?? []) as SkillRow[];

  const categoryById = new Map(categories.map(c => [c.id, c]));
  const groupById    = new Map(groups.map(g => [g.id, g]));
  const subgroupById = new Map(subgroups.map(s => [s.id, s]));

  // slug → name map across all hierarchy tables (L1/L2/L3), used to rename
  // hierarchy nodes that already exist locally.
  const slugToName = new Map<string, string>();
  categories.forEach(c => slugToName.set(c.slug, c.name));
  groups.forEach(g => slugToName.set(g.slug, g.name));
  subgroups.forEach(s => slugToName.set(s.slug, s.name));

  // Groups/subgroups have no direction column of their own — the whole
  // branch inherits its root category's direction (confirmed by the
  // existing layout: every node under "Two Arm" flows Right, etc).
  const groupDirection = (g: GroupRow): Direction | null =>
    categoryById.get(g.category_id)?.direction ?? null;
  const subgroupDirection = (s: SubgroupRow): Direction | null => {
    const g = groupById.get(s.group_id);
    return g ? groupDirection(g) : null;
  };

  const pendingGroups: PendingHierarchyNode[] = groups.map(g => ({
    slug: g.slug,
    name: g.name,
    parentSlug: categoryById.get(g.category_id)?.slug ?? null,
    direction: groupDirection(g),
  }));

  const pendingSubgroups: PendingHierarchyNode[] = subgroups.map(s => ({
    slug: s.slug,
    name: s.name,
    parentSlug: groupById.get(s.group_id)?.slug ?? null,
    direction: subgroupDirection(s),
  }));

  // id → slug maps for resolving skill FKs to stable identifiers
  const idToSlug = new Map<number, string>();
  skillRows.forEach(r => idToSlug.set(r.id, r.slug));

  const skills: SkillRecord[] = skillRows.map(row => ({
    slug: row.slug,
    name: row.name,
    isKey: row.is_key_skill,
    direction: row.direction,
    videoUrl: row.link ?? '',
    description: row.description ?? '',
    connectsToSlug: row.connects_to != null ? idToSlug.get(row.connects_to) ?? null : null,
    subgroupSlug: subgroupById.get(row.subgroup_id)?.slug ?? null,
  }));

  return { skills, slugToName, pendingGroups, pendingSubgroups };
}

// Step along the branch's main axis (the direction it flows away from its
// parent), and the gap used to stack siblings along the perpendicular axis.
// Picked from the observed hand-placed spacing in skillTreeData.ts — this is
// a heuristic for "visually sane, non-overlapping-in-the-common-case"
// placement, not a pixel-perfect match to the original hand-tuned layout.
const SKILL_AXIS_STEP = 150;
const SUBGROUP_AXIS_STEP = 250;
const SUBGROUP_SIBLING_GAP = 150;
const GROUP_AXIS_STEP = 250;
const GROUP_SIBLING_GAP = 300;

function axisOffset(direction: Direction, step: number): { dx: number; dy: number } {
  switch (direction) {
    case 'Left':  return { dx: -step, dy: 0 };
    case 'Right': return { dx: step, dy: 0 };
    case 'Down':  return { dx: 0, dy: step };
    case 'Up':    return { dx: 0, dy: -step };
  }
}

// Stacks a new sibling after the furthest existing sibling along the
// perpendicular axis, so it never lands on top of a hand-placed node
// regardless of how irregular the existing spacing is.
function siblingOffset(
  parent: Skill,
  direction: Direction,
  gap: number,
  mergedBySlug: Map<string, Skill>
): { dx: number; dy: number } {
  const axis: 'x' | 'y' = direction === 'Left' || direction === 'Right' ? 'y' : 'x';
  const base = parent[axis];
  const existingCoords = parent.connections
    .map(id => mergedBySlug.get(id)?.[axis])
    .filter((v): v is number => typeof v === 'number');
  const next = existingCoords.length ? Math.max(...existingCoords) + gap : base;
  return axis === 'y' ? { dx: 0, dy: next - base } : { dx: next - base, dy: 0 };
}

function attachChild(parent: Skill, childId: string) {
  if (!parent.connections.includes(childId)) {
    parent.connections = [...parent.connections, childId];
  }
}

export async function fetchAndMerge(): Promise<Skill[]> {
  const { skills, slugToName, pendingGroups, pendingSubgroups } = await fetchAllFromSupabase();

  // First pass: merge DB data onto local nodes
  const skillMap = new Map<string, SkillRecord>();
  skills.forEach(r => skillMap.set(r.slug, r));

  // Forward chain map: parent slug → [child slugs] (inverse of DB connects_to)
  const forwardMap = new Map<string, string[]>();
  skills.forEach(s => {
    if (!s.connectsToSlug) return;
    const arr = forwardMap.get(s.connectsToSlug) ?? [];
    arr.push(s.slug);
    forwardMap.set(s.connectsToSlug, arr);
  });

  const merged: Skill[] = skillTreeData.map(skill => {
    // Hierarchy nodes (L1/L2/L3) — match by slug, override name from DB.
    if (skill.type === 'category') {
      const dbName = slugToName.get(skill.id);
      return dbName ? { ...skill, name: dbName } : skill;
    }

    // Skill nodes (L4) — match by slug (= local id).
    const match = skillMap.get(skill.id);
    const children = forwardMap.get(skill.id);
    if (!match) {
      return children ? { ...skill, connections: children } : skill;
    }
    return {
      ...skill,
      name:        match.name,
      description: match.description,
      videoUrl:    match.videoUrl || skill.videoUrl,
      ...(children ? { connections: children } : {}),
      ...(match.isKey && skill.type === 'regular'
        ? { type: 'key' as const, isGoldBorder: true }
        : {}),
    };
  });

  // Second pass: append DB-only nodes — groups, then subgroups, then skills —
  // positioning each relative to its resolved parent. Re-loop until nothing
  // new gets added so a subgroup under a brand-new group, or a skill under a
  // brand-new subgroup, resolves once its parent lands in the tree.
  const localSlugs = new Set(skillTreeData.map(s => s.id));
  const mergedBySlug = new Map<string, Skill>(merged.map(s => [s.id, s]));

  let added = true;
  while (added) {
    added = false;

    for (const group of pendingGroups) {
      if (mergedBySlug.has(group.slug) || !group.parentSlug) continue;
      const parent = mergedBySlug.get(group.parentSlug);
      if (!parent) continue;
      const direction = group.direction ?? 'Right';
      const along = axisOffset(direction, GROUP_AXIS_STEP);
      const perp = siblingOffset(parent, direction, GROUP_SIBLING_GAP, mergedBySlug);
      const newNode: Skill = {
        id: group.slug,
        name: group.name,
        prerequisites: [parent.id],
        type: 'category',
        state: 'active',
        isBlue: parent.isBlue,
        x: parent.x + along.dx + perp.dx,
        y: parent.y + along.dy + perp.dy,
        connections: [],
      };
      merged.push(newNode);
      mergedBySlug.set(newNode.id, newNode);
      attachChild(parent, newNode.id);
      added = true;
    }

    for (const subgroup of pendingSubgroups) {
      if (mergedBySlug.has(subgroup.slug) || !subgroup.parentSlug) continue;
      const parent = mergedBySlug.get(subgroup.parentSlug);
      if (!parent) continue;
      const direction = subgroup.direction ?? 'Right';
      const along = axisOffset(direction, SUBGROUP_AXIS_STEP);
      const perp = siblingOffset(parent, direction, SUBGROUP_SIBLING_GAP, mergedBySlug);
      const newNode: Skill = {
        id: subgroup.slug,
        name: subgroup.name,
        prerequisites: [parent.id],
        type: 'category',
        state: 'active',
        isBlue: parent.isBlue,
        x: parent.x + along.dx + perp.dx,
        y: parent.y + along.dy + perp.dy,
        connections: [],
      };
      merged.push(newNode);
      mergedBySlug.set(newNode.id, newNode);
      attachChild(parent, newNode.id);
      added = true;
    }

    for (const dbSkill of skills) {
      if (localSlugs.has(dbSkill.slug) || mergedBySlug.has(dbSkill.slug)) continue;
      // A skill with no connects_to is the first in its subgroup — attach it
      // to the subgroup node itself instead of a sibling skill.
      const parentSlug = dbSkill.connectsToSlug ?? dbSkill.subgroupSlug;
      if (!parentSlug) continue;
      const parent = mergedBySlug.get(parentSlug);
      if (!parent) continue;
      const offset = axisOffset(dbSkill.direction, SKILL_AXIS_STEP);
      const newNode: Skill = {
        id: dbSkill.slug,
        name: dbSkill.name,
        description: dbSkill.description,
        videoUrl: dbSkill.videoUrl || undefined,
        prerequisites: parent.prerequisites,
        type: dbSkill.isKey ? 'key' : 'regular',
        state: 'inactive',
        isBlue: parent.isBlue,
        isGoldBorder: dbSkill.isKey || undefined,
        x: parent.x + offset.dx,
        y: parent.y + offset.dy,
        connections: [],
      };
      merged.push(newNode);
      mergedBySlug.set(newNode.id, newNode);
      attachChild(parent, newNode.id);
      added = true;
    }
  }

  return merged;
}

export const useSheetSkills = () => {
  return useQuery({
    queryKey: ['supabase-skills'],
    queryFn: fetchAndMerge,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
};
