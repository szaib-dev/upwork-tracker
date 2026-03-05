begin;

create table if not exists public.analytics_shares (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique default md5(random()::text || clock_timestamp()::text || random()::text),
  title text not null default 'Shared Analytics',
  visibility text not null default 'private' check (visibility in ('public', 'private')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists analytics_shares_owner_idx on public.analytics_shares(owner_user_id, created_at desc);
create index if not exists analytics_shares_token_idx on public.analytics_shares(token);

create table if not exists public.analytics_share_members (
  share_id uuid not null references public.analytics_shares(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now(),
  primary key (share_id, email)
);

create unique index if not exists analytics_share_members_share_email_lc_uq
  on public.analytics_share_members(share_id, lower(email));

create index if not exists analytics_share_members_email_idx on public.analytics_share_members(lower(email));

drop trigger if exists trg_analytics_shares_updated_at on public.analytics_shares;
create trigger trg_analytics_shares_updated_at
before update on public.analytics_shares
for each row
execute function public.set_updated_at();

alter table public.analytics_shares enable row level security;
alter table public.analytics_share_members enable row level security;

drop policy if exists "analytics_shares_select_own" on public.analytics_shares;
create policy "analytics_shares_select_own"
on public.analytics_shares for select
using (auth.uid() = owner_user_id);

drop policy if exists "analytics_shares_insert_own" on public.analytics_shares;
create policy "analytics_shares_insert_own"
on public.analytics_shares for insert
with check (auth.uid() = owner_user_id);

drop policy if exists "analytics_shares_update_own" on public.analytics_shares;
create policy "analytics_shares_update_own"
on public.analytics_shares for update
using (auth.uid() = owner_user_id)
with check (auth.uid() = owner_user_id);

drop policy if exists "analytics_shares_delete_own" on public.analytics_shares;
create policy "analytics_shares_delete_own"
on public.analytics_shares for delete
using (auth.uid() = owner_user_id);

drop policy if exists "analytics_share_members_select_own" on public.analytics_share_members;
create policy "analytics_share_members_select_own"
on public.analytics_share_members for select
using (
  exists (
    select 1
    from public.analytics_shares s
    where s.id = analytics_share_members.share_id
      and s.owner_user_id = auth.uid()
  )
);

drop policy if exists "analytics_share_members_insert_own" on public.analytics_share_members;
create policy "analytics_share_members_insert_own"
on public.analytics_share_members for insert
with check (
  exists (
    select 1
    from public.analytics_shares s
    where s.id = analytics_share_members.share_id
      and s.owner_user_id = auth.uid()
  )
);

drop policy if exists "analytics_share_members_delete_own" on public.analytics_share_members;
create policy "analytics_share_members_delete_own"
on public.analytics_share_members for delete
using (
  exists (
    select 1
    from public.analytics_shares s
    where s.id = analytics_share_members.share_id
      and s.owner_user_id = auth.uid()
  )
);

grant select, insert, update, delete on public.analytics_shares to authenticated;
grant select, insert, delete on public.analytics_share_members to authenticated;

create or replace function public.get_analytics_share_access(p_token text)
returns table (
  share_exists boolean,
  visibility text,
  title text,
  can_access boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_share public.analytics_shares%rowtype;
  v_email text;
  v_uid uuid;
begin
  select *
  into v_share
  from public.analytics_shares
  where token = p_token
    and is_active = true
  limit 1;

  if not found then
    return query select false, null::text, null::text, false;
    return;
  end if;

  v_uid := auth.uid();
  v_email := lower(coalesce(auth.jwt() ->> 'email', ''));

  if v_share.visibility = 'public' then
    return query select true, v_share.visibility, v_share.title, true;
    return;
  end if;

  return query
  select
    true,
    v_share.visibility,
    v_share.title,
    (
      v_uid = v_share.owner_user_id
      or (
        v_email <> ''
        and exists (
          select 1
          from public.analytics_share_members m
          where m.share_id = v_share.id
            and lower(m.email) = v_email
        )
      )
    );
end;
$$;

create or replace function public.get_shared_proposals(p_token text)
returns table (
  id bigint,
  user_id uuid,
  date_sent date,
  job_title text,
  job_url text,
  budget numeric,
  connects integer,
  boosted boolean,
  loom boolean,
  viewed boolean,
  lead boolean,
  status text,
  reply_date date,
  follow_up_at timestamptz,
  follow_up_topic text,
  client_country text,
  client_name text,
  client_email text,
  proposal_text text,
  socials jsonb,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_share public.analytics_shares%rowtype;
  v_email text;
  v_uid uuid;
  v_allowed boolean;
begin
  select *
  into v_share
  from public.analytics_shares
  where token = p_token
    and is_active = true
  limit 1;

  if not found then
    return;
  end if;

  v_allowed := false;

  if v_share.visibility = 'public' then
    v_allowed := true;
  else
    v_uid := auth.uid();
    v_email := lower(coalesce(auth.jwt() ->> 'email', ''));

    if v_uid = v_share.owner_user_id then
      v_allowed := true;
    elsif v_email <> '' and exists (
      select 1
      from public.analytics_share_members m
      where m.share_id = v_share.id
        and lower(m.email) = v_email
    ) then
      v_allowed := true;
    end if;
  end if;

  if not v_allowed then
    return;
  end if;

  return query
  select
    p.id,
    p.user_id,
    p.date_sent,
    p.job_title,
    p.job_url,
    p.budget,
    p.connects,
    p.boosted,
    p.loom,
    p.viewed,
    p.lead,
    p.status,
    p.reply_date,
    p.follow_up_at,
    p.follow_up_topic,
    p.client_country,
    p.client_name,
    p.client_email,
    p.proposal_text,
    p.socials,
    p.created_at
  from public.proposals p
  where p.user_id = v_share.owner_user_id
  order by p.date_sent desc, p.id desc;
end;
$$;

grant execute on function public.get_analytics_share_access(text) to anon, authenticated;
grant execute on function public.get_shared_proposals(text) to anon, authenticated;

commit;
