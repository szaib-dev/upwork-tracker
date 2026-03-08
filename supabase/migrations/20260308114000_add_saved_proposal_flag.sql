begin;

alter table public.proposals
  add column if not exists is_saved boolean not null default false;

commit;
