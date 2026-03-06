begin;

drop index if exists public.client_profiles_user_email_uq;

create unique index if not exists client_profiles_user_email_unique_nonempty
on public.client_profiles(user_id, lower(email))
where length(trim(email)) > 0;

commit;

