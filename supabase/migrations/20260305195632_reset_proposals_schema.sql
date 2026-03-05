-- WARNING: destructive reset
begin;

drop table if exists public.proposals cascade;

create table public.proposals (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  date_sent date default current_date,
  job_title text default '',
  job_url text default '',
  budget numeric(12,2) default 0,
  connects integer default 0,
  boosted boolean default false,
  loom boolean default false,
  viewed boolean default false,
  lead boolean default false,
  status text default 'Sent' check (status in ('Sent','Viewed','Replied','Interview','Hired','Rejected')),
  reply_date date,
  follow_up_at timestamptz,
  client_country text default '',
  client_name text default '',
  client_email text default '',
  proposal_text text default '',
  socials jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index proposals_user_id_idx on public.proposals(user_id);
create index proposals_date_sent_idx on public.proposals(date_sent desc);
create index proposals_follow_up_at_idx on public.proposals(follow_up_at);
create index proposals_status_idx on public.proposals(status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_proposals_updated_at
before update on public.proposals
for each row
execute function public.set_updated_at();

alter table public.proposals enable row level security;

create policy "proposal_select_own" on public.proposals for select using (auth.uid() = user_id);
create policy "proposal_insert_own" on public.proposals for insert with check (auth.uid() = user_id);
create policy "proposal_update_own" on public.proposals for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "proposal_delete_own" on public.proposals for delete using (auth.uid() = user_id);

commit;

