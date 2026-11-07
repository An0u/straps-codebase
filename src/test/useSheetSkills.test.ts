import { describe, it, expect, vi } from 'vitest';

// Mutable fixture read by the mocked Supabase client — each test sets only
// the rows it needs; everything else defaults to empty.
let fixture: {
  categories: unknown[];
  groups: unknown[];
  subgroups: unknown[];
  skills: unknown[];
};

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: keyof typeof fixture) => ({
      select: () => ({
        range: (from: number, to: number) =>
          Promise.resolve({ data: (fixture[table] as unknown[]).slice(from, to + 1), error: null }),
      }),
    }),
  },
}));

import { fetchAndMerge, PAGE_SIZE } from '@/hooks/useSheetSkills';

function resetFixture() {
  fixture = { categories: [], groups: [], subgroups: [], skills: [] };
}

describe('fetchAndMerge', () => {
  it('appends a new skill under an existing subgroup, chained off an existing skill', async () => {
    resetFixture();
    // 'two-spin-normal' is an existing local subgroup whose only child is
    // the existing local skill 'flare'. Seed a DB row for 'flare' itself
    // (mirrors how the real seed mirrors every local skill), then chain a
    // brand-new skill off it.
    fixture.subgroups = [{ id: 1, slug: 'two-spin-normal', name: 'Normal', group_id: 1 }];
    fixture.skills = [
      { id: 100, slug: 'flare', name: 'Flare', is_key_skill: false, direction: 'Right', link: null, description: null, connects_to: null, subgroup_id: 1 },
      { id: 101, slug: 'flare-super', name: 'Flare Super', is_key_skill: false, direction: 'Right', link: 'https://example.com/v', description: 'super flare', connects_to: 100, subgroup_id: 1 },
    ];

    const merged = await fetchAndMerge();
    const parent = merged.find(s => s.id === 'flare')!;
    const child = merged.find(s => s.id === 'flare-super')!;

    expect(child).toBeDefined();
    expect(child.name).toBe('Flare Super');
    expect(child.videoUrl).toBe('https://example.com/v');
    expect(child.x).toBe(parent.x + 150);
    expect(child.y).toBe(parent.y);
    expect(parent.connections).toContain('flare-super');
  });

  it('appends a new skill that is first in its subgroup (connects_to null) to the subgroup node', async () => {
    resetFixture();
    // 'one-spin-center' is an existing local subgroup with no DB-seeded
    // skills in this fixture — the new skill should attach directly to it.
    fixture.subgroups = [{ id: 2, slug: 'one-spin-center', name: 'Center', group_id: 2 }];
    fixture.skills = [
      { id: 200, slug: 'first-skill', name: 'First Skill', is_key_skill: false, direction: 'Left', link: null, description: 'first', connects_to: null, subgroup_id: 2 },
    ];

    const merged = await fetchAndMerge();
    const subgroup = merged.find(s => s.id === 'one-spin-center')!;
    const child = merged.find(s => s.id === 'first-skill')!;

    expect(child).toBeDefined();
    expect(child.x).toBe(subgroup.x - 150);
    expect(child.y).toBe(subgroup.y);
    expect(subgroup.connections).toContain('first-skill');
  });

  it('appends a brand-new subgroup under an existing group', async () => {
    resetFixture();
    fixture.categories = [{ id: 1, slug: 'two-arm', name: 'Two Arm', direction: 'Right' }];
    fixture.groups = [{ id: 1, slug: 'two-spin', name: 'Spin', category_id: 1 }];
    fixture.subgroups = [{ id: 3, slug: 'two-spin-extra', name: 'Extra', group_id: 1 }];

    const merged = await fetchAndMerge();
    const group = merged.find(s => s.id === 'two-spin')!;
    const subgroup = merged.find(s => s.id === 'two-spin-extra')!;

    expect(subgroup).toBeDefined();
    expect(subgroup.type).toBe('category');
    expect(subgroup.x).toBe(group.x + 250);
    expect(group.connections).toContain('two-spin-extra');
  });

  it('cascades a brand-new group → subgroup → skill under an existing category', async () => {
    resetFixture();
    fixture.categories = [{ id: 2, slug: 'one-arm', name: 'One Arm', direction: 'Left' }];
    fixture.groups = [{ id: 10, slug: 'one-extra-group', name: 'Extra Group', category_id: 2 }];
    fixture.subgroups = [{ id: 20, slug: 'one-extra-subgroup', name: 'Extra Subgroup', group_id: 10 }];
    fixture.skills = [
      { id: 300, slug: 'one-extra-skill', name: 'Extra Skill', is_key_skill: true, direction: 'Left', link: 'https://example.com/v2', description: 'cascaded', connects_to: null, subgroup_id: 20 },
    ];

    const merged = await fetchAndMerge();
    const category = merged.find(s => s.id === 'one-arm')!;
    const group = merged.find(s => s.id === 'one-extra-group')!;
    const subgroup = merged.find(s => s.id === 'one-extra-subgroup')!;
    const skill = merged.find(s => s.id === 'one-extra-skill')!;

    expect(group).toBeDefined();
    expect(subgroup).toBeDefined();
    expect(skill).toBeDefined();
    expect(category.connections).toContain('one-extra-group');
    expect(group.connections).toContain('one-extra-subgroup');
    expect(subgroup.connections).toContain('one-extra-skill');
    expect(skill.type).toBe('key');
    expect(skill.isGoldBorder).toBe(true);
  });

  it('paginates past the Supabase page-size cap instead of truncating', async () => {
    resetFixture();
    // A chain of PAGE_SIZE + 1 skills under an existing subgroup — if
    // pagination weren't working, only the first PAGE_SIZE would come back.
    fixture.subgroups = [{ id: 1, slug: 'two-spin-normal', name: 'Normal', group_id: 1 }];
    fixture.skills = [
      { id: 0, slug: 'flare', name: 'Flare', is_key_skill: false, direction: 'Right', link: null, description: null, connects_to: null, subgroup_id: 1 },
    ];
    // All chain directly off the already-local 'flare' node (id 0) so the
    // merge resolves in one pass — this test is about pagination, not the
    // resolution loop's convergence.
    for (let i = 1; i <= PAGE_SIZE; i++) {
      fixture.skills.push({
        id: i,
        slug: `chain-${i}`,
        name: `Chain ${i}`,
        is_key_skill: false,
        direction: 'Right',
        link: null,
        description: null,
        connects_to: 0,
        subgroup_id: 1,
      });
    }

    const merged = await fetchAndMerge();
    expect(merged.find(s => s.id === `chain-${PAGE_SIZE}`)).toBeDefined();
  });

  it('logs a warning instead of silently dropping an unresolvable skill', async () => {
    resetFixture();
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    fixture.subgroups = [{ id: 1, slug: 'two-spin-normal', name: 'Normal', group_id: 1 }];
    fixture.skills = [
      // connects_to references an id that doesn't exist in this fixture —
      // can never resolve to a parent.
      { id: 1, slug: 'orphan-skill', name: 'Orphan', is_key_skill: false, direction: 'Right', link: null, description: null, connects_to: 999, subgroup_id: 1 },
    ];

    const merged = await fetchAndMerge();

    expect(merged.find(s => s.id === 'orphan-skill')).toBeUndefined();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[useSheetSkills]'),
      expect.objectContaining({ skills: ['orphan-skill'] })
    );
    warnSpy.mockRestore();
  });
});
