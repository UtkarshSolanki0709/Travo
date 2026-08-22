-- Travo analytics events table.
-- Run once in the Supabase dashboard SQL editor.
-- The app queues events in local SQLite and batch-inserts them here;
-- until this table exists, flushes silently fail and events stay queued.

create table if not exists public.analytics_events (
  id bigint generated always as identity primary key,
  user_id text,
  name text not null,
  props jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_analytics_events_name_created
  on public.analytics_events (name, created_at desc);

alter table public.analytics_events enable row level security;

-- Insert-only for API clients. No select/update/delete policies:
-- reads stay limited to the dashboard (service role).
create policy "insert analytics events"
  on public.analytics_events
  for insert
  to anon, authenticated
  with check (true);
