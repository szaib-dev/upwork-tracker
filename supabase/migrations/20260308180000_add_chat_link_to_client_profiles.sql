begin;

alter table public.client_profiles
  add column if not exists chat_link text not null default '';

commit;
