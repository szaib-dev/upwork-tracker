begin;

with test_user as (
  select id
  from auth.users
  where lower(email) = 'test@test.com'
  limit 1
),
clear_existing as (
  delete from public.proposals p
  using test_user t
  where p.user_id = t.id
  returning p.id
),
seed_rows as (
  select
    t.id as user_id,
    gs.n as idx,
    (current_date - ((gs.n * 2) % 120))::date as date_sent,
    format('Full-Stack Project %s', gs.n) as job_title,
    format('https://www.upwork.com/jobs/test-project-%s', gs.n) as job_url,
    (250 + (gs.n * 35))::numeric(12,2) as budget,
    4 + (gs.n % 12) as connects,
    (array['Sent','Viewed','Replied','Interview','Hired','Rejected'])[(gs.n % 6) + 1]::text as status,
    format('Client %s', gs.n) as client_name,
    format('client%1$s@example.com', gs.n) as client_email,
    format(
      'Proposal #%1$s for test@test.com. Includes discovery, implementation, QA, and handover docs.',
      gs.n
    ) as proposal_text,
    case
      when gs.n % 5 = 0 then null
      else now() + make_interval(hours => gs.n + 6)
    end as follow_up_at,
    case when gs.n % 2 = 0 then true else false end as viewed,
    case when gs.n % 7 = 0 then true else false end as boosted,
    case when gs.n % 4 = 0 then true else false end as loom,
    case when gs.n % 6 in (0, 3) then true else false end as lead,
    (array['United States','Canada','United Kingdom','Germany','Australia'])[(gs.n % 5) + 1]::text as client_country,
    jsonb_build_object(
      'linkedin', format('https://linkedin.com/in/client-%s', gs.n),
      'twitter', format('https://x.com/client_%s', gs.n),
      'upwork', format('https://www.upwork.com/freelancers/client%s', gs.n),
      'website', format('https://client%s.dev', gs.n)
    ) as socials,
    (array['Pricing follow-up','Portfolio share','Availability check','Technical clarification'])[(gs.n % 4) + 1]::text as follow_up_topic
  from test_user t
  cross join generate_series(1, 50) as gs(n)
)
insert into public.proposals (
  user_id, date_sent, job_title, job_url, budget, connects, status,
  client_name, client_email, proposal_text, follow_up_at,
  viewed, boosted, loom, lead, client_country, socials, follow_up_topic
)
select
  user_id, date_sent, job_title, job_url, budget, connects, status,
  client_name, client_email, proposal_text, follow_up_at,
  viewed, boosted, loom, lead, client_country, socials, follow_up_topic
from seed_rows;

commit;
