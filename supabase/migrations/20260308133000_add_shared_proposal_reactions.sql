begin;

create table if not exists public.analytics_share_proposal_reactions (
  id bigint generated always as identity primary key,
  share_id uuid not null references public.analytics_shares(id) on delete cascade,
  proposal_id bigint not null,
  reactor_id text not null,
  emoji text not null,
  created_at timestamptz not null default now(),
  constraint analytics_share_proposal_reaction_unique unique (share_id, proposal_id, reactor_id, emoji)
);

create index if not exists analytics_share_proposal_reactions_share_proposal_idx
  on public.analytics_share_proposal_reactions(share_id, proposal_id);

alter table public.analytics_share_proposal_reactions enable row level security;

create or replace function public.get_shared_proposal_reactions(
  p_token text,
  p_proposal_id bigint
)
returns table (
  emoji text,
  reaction_count integer
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
    r.emoji,
    count(*)::int as reaction_count
  from public.analytics_share_proposal_reactions r
  where r.share_id = v_share_id
    and r.proposal_id = p_proposal_id
  group by r.emoji;
end;
$$;

create or replace function public.toggle_shared_proposal_reaction(
  p_token text,
  p_proposal_id bigint,
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
  v_owner_user_id uuid;
  v_can_access boolean;
begin
  select s.share_id, s.owner_user_id, s.can_access
  into v_share_id, v_owner_user_id, v_can_access
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

  if not exists (
    select 1
    from public.proposals p
    where p.id = p_proposal_id
      and p.user_id = v_owner_user_id
  ) then
    raise exception 'Proposal not found';
  end if;

  if exists (
    select 1
    from public.analytics_share_proposal_reactions r
    where r.share_id = v_share_id
      and r.proposal_id = p_proposal_id
      and r.reactor_id = trim(p_reactor_id)
      and r.emoji = trim(p_emoji)
  ) then
    delete from public.analytics_share_proposal_reactions
    where share_id = v_share_id
      and proposal_id = p_proposal_id
      and reactor_id = trim(p_reactor_id)
      and emoji = trim(p_emoji);

    return query
    select
      false,
      (
        select count(*)::int
        from public.analytics_share_proposal_reactions rr
        where rr.share_id = v_share_id
          and rr.proposal_id = p_proposal_id
          and rr.emoji = trim(p_emoji)
      );
    return;
  end if;

  insert into public.analytics_share_proposal_reactions (
    share_id,
    proposal_id,
    reactor_id,
    emoji
  ) values (
    v_share_id,
    p_proposal_id,
    trim(p_reactor_id),
    trim(p_emoji)
  );

  return query
  select
    true,
    (
      select count(*)::int
      from public.analytics_share_proposal_reactions rr
      where rr.share_id = v_share_id
        and rr.proposal_id = p_proposal_id
        and rr.emoji = trim(p_emoji)
    );
end;
$$;

grant execute on function public.get_shared_proposal_reactions(text, bigint) to anon, authenticated;
grant execute on function public.toggle_shared_proposal_reaction(text, bigint, text, text) to anon, authenticated;

commit;
