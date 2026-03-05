-- Seed demo proposals for szaib.dev@gmail.com
insert into public.proposals (
  user_id, date_sent, job_title, job_url, budget, connects, status,
  client_name, client_email, proposal_text, follow_up_at
)
select
  u.id,
  current_date - 4,
  'Next.js SaaS Dashboard Build',
  'https://www.upwork.com/jobs/nextjs-saas-dashboard',
  1200,
  10,
  'Interview',
  'Alex',
  'alex@acme.com',
  'I can deliver the dashboard with auth, analytics and billing in 2 weeks.',
  now() + interval '8 hours'
from auth.users u
where lower(u.email) = 'szaib.dev@gmail.com'
on conflict do nothing;

insert into public.proposals (
  user_id, date_sent, job_title, job_url, budget, connects, status,
  client_name, client_email, proposal_text, follow_up_at
)
select
  u.id,
  current_date - 11,
  'React Admin UI Polish',
  'https://www.upwork.com/jobs/react-admin-polish',
  500,
  8,
  'Viewed',
  'Nora',
  'nora@orbit.io',
  'Focused on UX cleanup, responsive components and performance fixes.',
  now() + interval '30 hours'
from auth.users u
where lower(u.email) = 'szaib.dev@gmail.com'
on conflict do nothing;

