create table if not exists public.waitlist (
  id bigint generated always as identity primary key,
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table public.waitlist add column if not exists utm_source text;
alter table public.waitlist add column if not exists utm_medium text;
alter table public.waitlist add column if not exists utm_campaign text;
alter table public.waitlist add column if not exists utm_term text;
alter table public.waitlist add column if not exists utm_content text;
alter table public.waitlist add column if not exists referrer text;
alter table public.waitlist add column if not exists landing_path text;
alter table public.waitlist add column if not exists device_type text;
alter table public.waitlist add column if not exists user_agent text;

alter table public.waitlist enable row level security;

drop policy if exists "Allow service role full access on waitlist"
on public.waitlist;

create policy "Allow service role full access on waitlist"
on public.waitlist
as permissive
for all
to service_role
using (true)
with check (true);

create table if not exists public.waitlist_events (
  id bigint generated always as identity primary key,
  event_name text not null,
  email text,
  path text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  device_type text,
  user_agent text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

alter table public.waitlist_events enable row level security;

drop policy if exists "Allow service role full access on waitlist events"
on public.waitlist_events;

create policy "Allow service role full access on waitlist events"
on public.waitlist_events
as permissive
for all
to service_role
using (true)
with check (true);
