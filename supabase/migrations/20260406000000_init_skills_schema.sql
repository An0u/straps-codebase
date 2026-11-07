-- ============================================================================
-- Straps skills schema
-- ============================================================================
-- Hierarchy: category (L1) -> group (L2) -> subgroup (L3) -> skill (L4)
-- Direction is an enum since it's a small fixed set tied to the rhombus layout.
-- ============================================================================

create type public.skill_direction as enum ('Left', 'Right', 'Down', 'Up');

-- slug is a stable identifier shared with the frontend skillTreeData ids,
-- so renaming `name` in the DB does not break frontend matching.
create table public.categories (
  id          smallint generated always as identity primary key,
  slug        text not null unique,
  name        text not null unique,
  direction   public.skill_direction not null
);

create table public.groups (
  id          smallint generated always as identity primary key,
  category_id smallint not null references public.categories(id) on delete cascade,
  slug        text not null unique,
  name        text not null,
  unique (category_id, name)
);

create table public.subgroups (
  id          smallint generated always as identity primary key,
  group_id    smallint not null references public.groups(id) on delete cascade,
  slug        text not null unique,
  name        text not null,
  unique (group_id, name)
);

create table public.skills (
  id           bigint generated always as identity primary key,
  subgroup_id  smallint not null references public.subgroups(id) on delete restrict,
  slug         text not null unique,
  name         text not null,
  is_key_skill boolean not null default false,
  direction    public.skill_direction not null,
  link         text,
  description  text,
  connects_to  bigint references public.skills(id) on delete set null,
  created_at   timestamptz not null default now()
);

create index skills_subgroup_id_idx on public.skills(subgroup_id);
create index skills_is_key_skill_idx on public.skills(is_key_skill) where is_key_skill;
create index skills_connects_to_idx on public.skills(connects_to);

-- Enable RLS with public read (skills catalogue is public data).
alter table public.categories enable row level security;
alter table public.groups     enable row level security;
alter table public.subgroups  enable row level security;
alter table public.skills     enable row level security;

create policy "public read categories" on public.categories for select using (true);
create policy "public read groups"     on public.groups     for select using (true);
create policy "public read subgroups"  on public.subgroups  for select using (true);
create policy "public read skills"     on public.skills     for select using (true);
