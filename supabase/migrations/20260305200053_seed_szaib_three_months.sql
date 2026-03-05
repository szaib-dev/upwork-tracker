-- Seed 3 months of proposal data for szaib.dev@gmail.com
with target_user as (
  select id as user_id
  from auth.users
  where lower(email) = 'szaib.dev@gmail.com'
), seed_rows as (
  select * from (values
    (90, 'Shopify Theme Performance Fixes', 'https://www.upwork.com/jobs/shopify-theme-performance', 650, 8, 'Sent',      'Harper',  'harper@northlane.io', 'Optimize storefront speed, media loading, and Core Web Vitals for a high-traffic store.', 120),
    (84, 'Node.js API Refactor for SaaS', 'https://www.upwork.com/jobs/node-api-refactor', 1400, 12, 'Viewed',     'James',   'james@atlasops.com', 'Refactor REST API modules, improve response times, and add observability with logs/metrics.', 96),
    (79, 'WordPress to Next.js Migration', 'https://www.upwork.com/jobs/wp-to-next-migration', 2200, 16, 'Replied',    'Mia',     'mia@brightshore.co', 'Migrate marketing pages from WordPress to Next.js with SEO-safe redirects and schema.', 72),
    (73, 'Admin Dashboard UI Overhaul', 'https://www.upwork.com/jobs/admin-ui-overhaul', 900, 10, 'Interview',  'Noah',    'noah@runstack.dev', 'Redesign admin screens with reusable components and responsive behavior.', 56),
    (68, 'Laravel Bug Fix Sprint', 'https://www.upwork.com/jobs/laravel-bug-fix', 500, 6, 'Rejected',   'Avery',   'avery@stonelabs.io', 'Resolve queue failures and email notification bugs in an existing Laravel app.', 48),
    (63, 'B2B Landing Page Build', 'https://www.upwork.com/jobs/b2b-landing-page-build', 750, 7, 'Hired',      'Elena',   'elena@signalpath.ai', 'Build conversion-focused landing page with forms, analytics, and CRM hooks.', 36),
    (58, 'React Table and Filters Module', 'https://www.upwork.com/jobs/react-table-filters', 820, 9, 'Sent',      'Owen',    'owen@pivotalhq.com', 'Implement data table with sorting, server filters, and saved views.', 84),
    (53, 'Stripe Subscription Debugging', 'https://www.upwork.com/jobs/stripe-subscription-debugging', 680, 8, 'Viewed',     'Ivy',     'ivy@capstoneapp.io', 'Fix subscription state mismatch and webhook retry edge cases.', 70),
    (47, 'Express + PostgreSQL Optimization', 'https://www.upwork.com/jobs/express-postgres-optimization', 1300, 12, 'Replied',    'Lucas',   'lucas@bloommetric.com', 'Tune SQL queries, add indexes, and optimize API endpoints under load.', 60),
    (42, 'Frontend Accessibility Audit', 'https://www.upwork.com/jobs/frontend-accessibility-audit', 560, 6, 'Interview',  'Sofia',   'sofia@zenbyte.co', 'Audit accessibility issues and remediate keyboard navigation and semantics.', 40),
    (37, 'Python Scraper Stabilization', 'https://www.upwork.com/jobs/python-scraper-stabilization', 710, 8, 'Rejected',   'Ethan',   'ethan@harborworks.io', 'Stabilize scraper jobs with retries, rotating headers, and failure alerts.', 28),
    (32, 'Firebase Auth + Roles Setup', 'https://www.upwork.com/jobs/firebase-auth-roles', 980, 10, 'Hired',      'Aria',    'aria@neonloop.app', 'Implement auth flows and role-based permissions across app sections.', 24),
    (27, 'Next.js SEO and Metadata Pass', 'https://www.upwork.com/jobs/nextjs-seo-metadata', 540, 6, 'Sent',      'Caleb',   'caleb@novagrid.ai', 'Improve metadata, sitemap, canonical URLs, and social sharing previews.', 20),
    (22, 'TypeScript Strict Mode Cleanup', 'https://www.upwork.com/jobs/ts-strict-cleanup', 880, 9, 'Viewed',     'Grace',   'grace@orbitlane.dev', 'Remove any-types, fix type safety gaps, and enforce strict mode in CI.', 16),
    (18, 'Prisma Schema Update and Migrations', 'https://www.upwork.com/jobs/prisma-schema-migrations', 1500, 12, 'Replied',    'Leo',     'leo@vectraflow.io', 'Update data model, ship safe migrations, and patch breaking queries.', 12),
    (14, 'Customer Portal Feature Additions', 'https://www.upwork.com/jobs/customer-portal-features', 1700, 14, 'Interview',  'Nina',    'nina@peakcommerce.co', 'Add billing history, usage graphs, and notification preferences.', 10),
    (10, 'CRM Integration with Webhooks', 'https://www.upwork.com/jobs/crm-webhook-integration', 1200, 11, 'Sent',      'Zane',    'zane@anchorbridge.io', 'Integrate CRM lead sync with signed webhooks and retry queue.', 8),
    (6,  'Analytics Tracking Cleanup', 'https://www.upwork.com/jobs/analytics-tracking-cleanup', 600, 7, 'Viewed',     'Piper',   'piper@fluxforge.app', 'Normalize analytics events and repair attribution on key conversion flows.', 6),
    (3,  'GraphQL Resolver Performance', 'https://www.upwork.com/jobs/graphql-resolver-performance', 1350, 12, 'Replied',    'Miles',   'miles@threadline.ai', 'Reduce N+1 query issues and optimize resolver path performance.', 4),
    (1,  'Admin Notifications Center', 'https://www.upwork.com/jobs/admin-notifications-center', 980, 9, 'Sent',      'Riley',   'riley@northpeak.io', 'Build notifications center with real-time updates and read-state sync.', 2)
  ) as t(days_back, job_title, job_url, budget, connects, status, client_name, client_email, proposal_text, follow_up_hours)
)
insert into public.proposals (
  user_id,
  date_sent,
  job_title,
  job_url,
  budget,
  connects,
  boosted,
  loom,
  viewed,
  lead,
  status,
  reply_date,
  follow_up_at,
  client_country,
  client_name,
  client_email,
  proposal_text,
  socials
)
select
  u.user_id,
  current_date - (s.days_back || ' days')::interval,
  s.job_title,
  s.job_url,
  s.budget,
  s.connects,
  (s.connects >= 11),
  (s.days_back % 2 = 0),
  (s.status in ('Viewed','Replied','Interview','Hired')),
  (s.status in ('Interview','Hired')),
  s.status,
  case when s.status in ('Replied','Interview','Hired') then current_date - ((s.days_back - 2) || ' days')::interval else null end,
  now() + (s.follow_up_hours || ' hours')::interval,
  'USA',
  s.client_name,
  s.client_email,
  s.proposal_text,
  jsonb_build_object('linkedin','', 'twitter','', 'upwork','', 'website','')
from target_user u
cross join seed_rows s;
