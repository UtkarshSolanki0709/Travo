-- Health check function to keep Supabase database active and prevent pausing.
-- Run this once in the Supabase Dashboard SQL Editor: https://supabase.com/dashboard/project/_/sql
--
-- How to ping via Uptime-Monitor:
-- GET https://<your-project-id>.supabase.co/rest/v1/rpc/health_check?apikey=<your-anon-key>
-- OR with request headers:
--   apikey: <your-anon-key>
--   Authorization: Bearer <your-anon-key>

create or replace function public.health_check()
returns json
language sql
security definer
as $$
  select json_build_object(
    'status', 'ok',
    'message', 'Supabase database is alive and active',
    'timestamp', now()
  );
$$;

-- Allow public anonymous access via the publishable/anon key
grant execute on function public.health_check() to anon, authenticated, service_role;
