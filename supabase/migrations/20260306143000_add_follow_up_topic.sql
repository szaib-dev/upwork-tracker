begin;

alter table public.proposals
  add column if not exists follow_up_topic text not null default '';

commit;

