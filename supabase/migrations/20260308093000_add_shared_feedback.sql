begin;

create table if not exists public.analytics_share_feedback (
  id bigint generated always as identity primary key,
  share_id uuid not null references public.analytics_shares(id) on delete cascade,
  proposal_id bigint not null,
  parent_feedback_id bigint references public.analytics_share_feedback(id) on delete cascade,
  author_name text not null default 'Anonymous',
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists analytics_share_feedback_share_proposal_idx
  on public.analytics_share_feedback(share_id, proposal_id, created_at asc);

create index if not exists analytics_share_feedback_parent_idx
  on public.analytics_share_feedback(parent_feedback_id);

create table if not exists public.analytics_share_feedback_reactions (
  id bigint generated always as identity primary key,
  feedback_id bigint not null references public.analytics_share_feedback(id) on delete cascade,
  reactor_id text not null,
  emoji text not null,
  created_at timestamptz not null default now(),
  constraint analytics_share_feedback_reaction_unique unique (feedback_id, reactor_id, emoji)
);

create index if not exists analytics_share_feedback_reactions_feedback_idx
  on public.analytics_share_feedback_reactions(feedback_id);

alter table public.analytics_share_feedback enable row level security;
alter table public.analytics_share_feedback_reactions enable row level security;

drop trigger if exists trg_analytics_share_feedback_updated_at on public.analytics_share_feedback;
create trigger trg_analytics_share_feedback_updated_at
before update on public.analytics_share_feedback
for each row
execute function public.set_updated_at();

create or replace function public.resolve_share_access(p_token text)
returns table (
  share_id uuid,
  owner_user_id uuid,
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
  v_allowed boolean := false;
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

  return query select v_share.id, v_share.owner_user_id, v_allowed;
end;
$$;

create or replace function public.get_shared_proposal_feedback(
  p_token text,
  p_proposal_id bigint
)
returns table (
  id bigint,
  parent_feedback_id bigint,
  author_name text,
  content text,
  created_at timestamptz,
  reactions jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_share_id uuid;
  v_owner_user_id uuid;
  v_can_access boolean;
begin
  select s.share_id, s.owner_user_id, s.can_access
  into v_share_id, v_owner_user_id, v_can_access
  from public.resolve_share_access(p_token) s
  limit 1;

  if v_share_id is null or not v_can_access then
    return;
  end if;

  if not exists (
    select 1
    from public.proposals p
    where p.id = p_proposal_id
      and p.user_id = v_owner_user_id
  ) then
    return;
  end if;

  return query
  select
    f.id,
    f.parent_feedback_id,
    f.author_name,
    f.content,
    f.created_at,
    coalesce(
      (
        select jsonb_object_agg(r.emoji, r.cnt)
        from (
          select rr.emoji, count(*)::int as cnt
          from public.analytics_share_feedback_reactions rr
          where rr.feedback_id = f.id
          group by rr.emoji
        ) r
      ),
      '{}'::jsonb
    ) as reactions
  from public.analytics_share_feedback f
  where f.share_id = v_share_id
    and f.proposal_id = p_proposal_id
  order by f.created_at asc, f.id asc;
end;
$$;

create or replace function public.add_shared_proposal_feedback(
  p_token text,
  p_proposal_id bigint,
  p_author_name text,
  p_content text,
  p_parent_feedback_id bigint default null
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_share_id uuid;
  v_owner_user_id uuid;
  v_can_access boolean;
  v_id bigint;
begin
  select s.share_id, s.owner_user_id, s.can_access
  into v_share_id, v_owner_user_id, v_can_access
  from public.resolve_share_access(p_token) s
  limit 1;

  if v_share_id is null or not v_can_access then
    raise exception 'Access denied';
  end if;

  if trim(coalesce(p_content, '')) = '' then
    raise exception 'Feedback content is required';
  end if;

  if not exists (
    select 1
    from public.proposals p
    where p.id = p_proposal_id
      and p.user_id = v_owner_user_id
  ) then
    raise exception 'Proposal not found';
  end if;

  if p_parent_feedback_id is not null and not exists (
    select 1
    from public.analytics_share_feedback f
    where f.id = p_parent_feedback_id
      and f.share_id = v_share_id
      and f.proposal_id = p_proposal_id
  ) then
    raise exception 'Parent feedback does not belong to this proposal';
  end if;

  insert into public.analytics_share_feedback (
    share_id,
    proposal_id,
    parent_feedback_id,
    author_name,
    content
  ) values (
    v_share_id,
    p_proposal_id,
    p_parent_feedback_id,
    coalesce(nullif(trim(p_author_name), ''), 'Anonymous'),
    trim(p_content)
  )
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.toggle_shared_proposal_feedback_reaction(
  p_token text,
  p_feedback_id bigint,
  p_reactor_id text,
  p_emoji text
)
returns table (
  active boolean,
  reaction_count integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_share_id uuid;
  v_can_access boolean;
  v_feedback_share_id uuid;
begin
  select s.share_id, s.can_access
  into v_share_id, v_can_access
  from public.resolve_share_access(p_token) s
  limit 1;

  if v_share_id is null or not v_can_access then
    raise exception 'Access denied';
  end if;

  if trim(coalesce(p_reactor_id, '')) = '' then
    raise exception 'Reactor id is required';
  end if;

  if trim(coalesce(p_emoji, '')) = '' then
    raise exception 'Emoji is required';
  end if;

  select f.share_id
  into v_feedback_share_id
  from public.analytics_share_feedback f
  where f.id = p_feedback_id
  limit 1;

  if v_feedback_share_id is null or v_feedback_share_id <> v_share_id then
    raise exception 'Feedback not found';
  end if;

  if exists (
    select 1
    from public.analytics_share_feedback_reactions r
    where r.feedback_id = p_feedback_id
      and r.reactor_id = trim(p_reactor_id)
      and r.emoji = trim(p_emoji)
  ) then
    delete from public.analytics_share_feedback_reactions
    where feedback_id = p_feedback_id
      and reactor_id = trim(p_reactor_id)
      and emoji = trim(p_emoji);

    return query
    select
      false,
      (
        select count(*)::int
        from public.analytics_share_feedback_reactions rr
        where rr.feedback_id = p_feedback_id
          and rr.emoji = trim(p_emoji)
      );
    return;
  end if;

  insert into public.analytics_share_feedback_reactions (feedback_id, reactor_id, emoji)
  values (p_feedback_id, trim(p_reactor_id), trim(p_emoji));

  return query
  select
    true,
    (
      select count(*)::int
      from public.analytics_share_feedback_reactions rr
      where rr.feedback_id = p_feedback_id
        and rr.emoji = trim(p_emoji)
    );
end;
$$;

grant execute on function public.resolve_share_access(text) to anon, authenticated;
grant execute on function public.get_shared_proposal_feedback(text, bigint) to anon, authenticated;
grant execute on function public.add_shared_proposal_feedback(text, bigint, text, text, bigint) to anon, authenticated;
grant execute on function public.toggle_shared_proposal_feedback_reaction(text, bigint, text, text) to anon, authenticated;

commit;
