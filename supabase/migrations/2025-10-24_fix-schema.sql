-- Drop existing tables if they exist (safe re-run)
drop table if exists public.purchases cascade;
drop table if exists public.profiles cascade;

-- ======================================
-- PROFILES TABLE
-- ======================================
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  onboarding_complete boolean default false,
  city text,
  lat numeric,
  lng numeric,
  bio text,
  photos text[] default '{}', -- Array of photo URLs
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='Profiles are readable by everyone'
  ) then
    create policy "Profiles are readable by everyone"
    on public.profiles
    for select
    using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='Users can insert/update their own profile'
  ) then
    create policy "Users can insert/update their own profile"
    on public.profiles
    for all
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
  end if;
end$$;

-- ======================================
-- PURCHASES TABLE
-- ======================================
create table if not exists public.purchases (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade,
  product_id text not null,
  metadata jsonb,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.purchases enable row level security;

-- Policies
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='purchases' and policyname='Users manage their own purchases'
  ) then
    create policy "Users manage their own purchases"
    on public.purchases
    for all
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
  end if;
end$$;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';