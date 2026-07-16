
-- Enum for lesson categories
create type public.lesson_category as enum
  ('phonetics_basics','nasal_vowels','french_r_silent','liaison','minimal_pairs','custom');

-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  daily_goal_minutes int not null default 10,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile r" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "own profile u" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "own profile i" on public.profiles for insert to authenticated with check (auth.uid() = id);

-- lessons (public catalog)
create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  category public.lesson_category not null,
  order_index int not null default 0,
  title text not null,
  french_text text not null check (char_length(french_text) between 1 and 500),
  translation text,
  audio_example_url text check (audio_example_url is null or audio_example_url ~* '^https?://'),
  hints text[] not null default '{}',
  created_at timestamptz not null default now()
);
grant select on public.lessons to anon, authenticated;
grant all on public.lessons to service_role;
alter table public.lessons enable row level security;
create policy "lessons public read" on public.lessons for select to anon, authenticated using (true);
create index lessons_category_order_idx on public.lessons (category, order_index);

-- user_attempts (private)
create table public.user_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete set null,
  expected_text text not null check (char_length(expected_text) <= 1000),
  transcript text not null check (char_length(transcript) <= 1000),
  score numeric(4,3) not null check (score >= 0 and score <= 1),
  duration_ms int check (duration_ms between 0 and 300000),
  created_at timestamptz not null default now()
);
grant select, insert on public.user_attempts to authenticated;
grant all on public.user_attempts to service_role;
alter table public.user_attempts enable row level security;
create policy "attempts own r" on public.user_attempts for select to authenticated using (auth.uid() = user_id);
create policy "attempts own i" on public.user_attempts for insert to authenticated with check (auth.uid() = user_id);
create index user_attempts_user_created_idx on public.user_attempts (user_id, created_at desc);

-- Auto-create profile on new user
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Seed lessons
insert into public.lessons (category, order_index, title, french_text, translation, hints) values
  ('phonetics_basics', 1, 'Bonjour', 'Bonjour, comment allez-vous ?', 'Hello, how are you?', array['Nasal "on" in "bonjour"', 'Silent final "s" in "vous"']),
  ('phonetics_basics', 2, 'Merci', 'Merci beaucoup, madame.', 'Thank you very much, madam.', array['Rolled/uvular "r"', 'Nasal "an" in "beaucoup"? no — "eau" = "o"']),
  ('phonetics_basics', 3, 'Café', 'Je voudrais un café, s''il vous plaît.', 'I would like a coffee, please.', array['Liaison: "vous_plaît"', 'Silent "s" in "plaît"']),
  ('phonetics_basics', 4, 'Croissant', 'Un croissant et un jus d''orange.', 'A croissant and an orange juice.', array['Nasal "un"', 'Liaison "un_jus"']),
  ('phonetics_basics', 5, 'Au revoir', 'Au revoir et à bientôt !', 'Goodbye and see you soon!', array['"oi" sounds like "wah"', 'Nasal "en" in "bientôt"']),

  ('nasal_vowels', 1, 'Un bon vin blanc', 'Un bon vin blanc', 'A good white wine', array['Four different nasal vowels in a row: un / on / in / an']),
  ('nasal_vowels', 2, 'Enfant', 'L''enfant chante une chanson.', 'The child sings a song.', array['Nasal "en" and "an"']),
  ('nasal_vowels', 3, 'Pain', 'Je mange du pain.', 'I eat bread.', array['"ain" = nasal "in"']),
  ('nasal_vowels', 4, 'Onze', 'Il y a onze ballons.', 'There are eleven balloons.', array['Nasal "on"']),

  ('french_r_silent', 1, 'Paris', 'Paris est très grand.', 'Paris is very big.', array['Uvular "r" from the back of the throat', 'Silent final "s" in "Paris"']),
  ('french_r_silent', 2, 'Restaurant', 'Le restaurant est ouvert.', 'The restaurant is open.', array['Silent final "t"', 'Two "r" sounds']),
  ('french_r_silent', 3, 'Beaucoup', 'Beaucoup de gens parlent.', 'Many people are talking.', array['Silent "p" in "beaucoup"', 'Uvular "r" in "parlent"']),
  ('french_r_silent', 4, 'Toujours', 'Il pleut toujours ici.', 'It always rains here.', array['Silent final "s" in "toujours"']),

  ('liaison', 1, 'Les amis', 'Les amis arrivent.', 'The friends arrive.', array['Liaison "les_amis" — pronounce the "s" as /z/']),
  ('liaison', 2, 'Vous êtes', 'Vous êtes en retard.', 'You are late.', array['Liaison "vous_êtes" — /z/ sound', 'Liaison "en_retard"']),
  ('liaison', 3, 'Un homme', 'C''est un homme intelligent.', 'He is an intelligent man.', array['Liaison "un_homme" — /n/', 'Liaison "homme_intelligent"']),
  ('liaison', 4, 'Grand ami', 'Un grand ami à moi.', 'A great friend of mine.', array['Liaison "grand_ami" — "d" becomes /t/']),

  ('minimal_pairs', 1, 'Dessus / Dessous', 'Le livre est dessus, pas dessous.', 'The book is on top, not underneath.', array['"dessus" /dəsy/ vs "dessous" /dəsu/']),
  ('minimal_pairs', 2, 'Poule / Pull', 'La poule porte un pull.', 'The hen wears a sweater.', array['"poule" /pul/ vs "pull" /pyl/']),
  ('minimal_pairs', 3, 'Tu / Tout', 'Tu manges tout.', 'You eat everything.', array['"tu" /ty/ vs "tout" /tu/']),
  ('minimal_pairs', 4, 'Sûr / Sourd', 'Je suis sûr qu''il est sourd.', 'I am sure he is deaf.', array['"sûr" /syʁ/ vs "sourd" /suʁ/']);
