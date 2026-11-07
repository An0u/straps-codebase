import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !anonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY env vars');
}

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false },
});

export type SkillRow = {
  id: number;
  name: string;
  is_key_skill: boolean;
  direction: 'Left' | 'Right' | 'Down' | 'Up';
  link: string | null;
  description: string | null;
  connects_to: number | null;
  subgroups: {
    name: string;
    groups: {
      name: string;
      categories: { name: string };
    };
  } | null;
};
