-- Deleting a category or group previously cascaded into its groups/subgroups
-- but failed with a foreign-key violation if any skills existed underneath,
-- because skills.subgroup_id was ON DELETE RESTRICT while groups.category_id
-- and subgroups.group_id are ON DELETE CASCADE. Align it so deleting a
-- branch at any level cleanly removes everything beneath it.

alter table public.skills drop constraint skills_subgroup_id_fkey;

alter table public.skills
  add constraint skills_subgroup_id_fkey
  foreign key (subgroup_id) references public.subgroups(id) on delete cascade;
