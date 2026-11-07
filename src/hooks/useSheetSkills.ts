import { useQuery } from '@tanstack/react-query';
import { skillTreeData, Skill } from '@/data/skillTreeData';
import { supabase } from '@/lib/supabase';

type Direction = 'Left' | 'Right' | 'Down' | 'Up';

interface SkillRow {
  id: number;
  slug: string;
  name: string;
  is_key_skill: boolean;
  direction: Direction;
  link: string | null;
  description: string | null;
  connects_to: number | null;
}

interface SkillRecord {
  slug: string;
  name: string;
  isKey: boolean;
  direction: Direction;
  videoUrl: string;
  description: string;
  connectsToSlug: string | null;
}

interface HierarchyRow { slug: string; name: string }

async function fetchAllFromSupabase() {
  const [skillsRes, catsRes, groupsRes, subsRes] = await Promise.all([
    supabase.from('skills').select('id, slug, name, is_key_skill, direction, link, description, connects_to'),
    supabase.from('categories').select('slug, name'),
    supabase.from('groups').select('slug, name'),
    supabase.from('subgroups').select('slug, name'),
  ]);

  if (skillsRes.error) throw skillsRes.error;
  if (catsRes.error)   throw catsRes.error;
  if (groupsRes.error) throw groupsRes.error;
  if (subsRes.error)   throw subsRes.error;

  const skillRows = (skillsRes.data ?? []) as SkillRow[];

  // id → slug map for resolving the connects_to FK to a stable identifier
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
  }));

  // slug → name map across all hierarchy tables (L1/L2/L3)
  const slugToName = new Map<string, string>();
  ((catsRes.data   ?? []) as HierarchyRow[]).forEach(r => slugToName.set(r.slug, r.name));
  ((groupsRes.data ?? []) as HierarchyRow[]).forEach(r => slugToName.set(r.slug, r.name));
  ((subsRes.data   ?? []) as HierarchyRow[]).forEach(r => slugToName.set(r.slug, r.name));

  return { skills, slugToName };
}

const DIRECTION_OFFSET: Record<Direction, { dx: number; dy: number }> = {
  Left:  { dx: -150, dy: 0 },
  Right: { dx:  150, dy: 0 },
  Down:  { dx: 0, dy:  150 },
  Up:    { dx: 0, dy: -150 },
};

async function fetchAndMerge(): Promise<Skill[]> {
  const { skills, slugToName } = await fetchAllFromSupabase();

  // slug → skill record
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

  // First pass: merge DB data onto local nodes
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

  // Second pass: append DB-only skills, positioning them relative to their parent.
  const localSlugs = new Set(skillTreeData.map(s => s.id));
  const mergedBySlug = new Map<string, Skill>(merged.map(s => [s.id, s]));

  // Iterate in connects_to order: a chain of new skills must resolve in topological order.
  // Re-loop until nothing new gets added (handles long chains).
  let added = true;
  while (added) {
    added = false;
    for (const dbSkill of skills) {
      if (localSlugs.has(dbSkill.slug) || mergedBySlug.has(dbSkill.slug)) continue;
      const parentSlug = dbSkill.connectsToSlug;
      if (!parentSlug) continue;
      const parent = mergedBySlug.get(parentSlug);
      if (!parent) continue;
      const offset = DIRECTION_OFFSET[dbSkill.direction] ?? DIRECTION_OFFSET.Right;
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
      // Make sure the parent connects forward to this new node
      if (!parent.connections.includes(newNode.id)) {
        parent.connections = [...parent.connections, newNode.id];
      }
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
