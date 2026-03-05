-- Separate social/client details from proposals (non-breaking)
create table if not exists public.client_profiles (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default '',
  email text not null default '',
  country text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists client_profiles_user_email_uq on public.client_profiles(user_id, email);
create index if not exists client_profiles_user_id_idx on public.client_profiles(user_id);

create table if not exists public.client_socials (
  id bigint generated always as identity primary key,
  client_id bigint not null references public.client_profiles(id) on delete cascade,
  linkedin text not null default '',
  twitter text not null default '',
  upwork text not null default '',
  website text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists client_socials_client_uq on public.client_socials(client_id);

alter table public.proposals
  add column if not exists client_id bigint references public.client_profiles(id) on delete set null;

alter table public.client_profiles enable row level security;
alter table public.client_socials enable row level security;

drop policy if exists "client_profiles_select_own" on public.client_profiles;
create policy "client_profiles_select_own"
on public.client_profiles for select using (auth.uid() = user_id);

drop policy if exists "client_profiles_insert_own" on public.client_profiles;
create policy "client_profiles_insert_own"
on public.client_profiles for insert with check (auth.uid() = user_id);

drop policy if exists "client_profiles_update_own" on public.client_profiles;
create policy "client_profiles_update_own"
on public.client_profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "client_profiles_delete_own" on public.client_profiles;
create policy "client_profiles_delete_own"
on public.client_profiles for delete using (auth.uid() = user_id);

drop policy if exists "client_socials_select_own" on public.client_socials;
create policy "client_socials_select_own"
on public.client_socials for select
using (
  exists (
    select 1 from public.client_profiles p
    where p.id = client_socials.client_id and p.user_id = auth.uid()
  )
);

drop policy if exists "client_socials_insert_own" on public.client_socials;
create policy "client_socials_insert_own"
on public.client_socials for insert
with check (
  exists (
    select 1 from public.client_profiles p
    where p.id = client_socials.client_id and p.user_id = auth.uid()
  )
);

drop policy if exists "client_socials_update_own" on public.client_socials;
create policy "client_socials_update_own"
on public.client_socials for update
using (
  exists (
    select 1 from public.client_profiles p
    where p.id = client_socials.client_id and p.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.client_profiles p
    where p.id = client_socials.client_id and p.user_id = auth.uid()
  )
);

drop policy if exists "client_socials_delete_own" on public.client_socials;
create policy "client_socials_delete_own"
on public.client_socials for delete
using (
  exists (
    select 1 from public.client_profiles p
    where p.id = client_socials.client_id and p.user_id = auth.uid()
  )
);
