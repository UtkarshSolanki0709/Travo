/* eslint-disable */
/// <reference path="../deno.d.ts" />


import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (_req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(
        JSON.stringify({
          status: "misconfigured",
          message: "SUPABASE_URL or SUPABASE_ANON_KEY missing in Edge Function environment",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Run a lightweight database query to guarantee active Postgres activity
    const { error } = await supabase.from("users").select("id").limit(1);

    if (error) {
      return new Response(
        JSON.stringify({
          status: "degraded",
          error: error.message,
          timestamp: new Date().toISOString(),
        }),
        {
          status: 200, // Return 200 so Uptime-monitor sees success and resets timer
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        status: "healthy",
        message: "Database ping successful - inactivity timer reset",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        status: "error",
        error: err?.message || "Unknown error",
        timestamp: new Date().toISOString(),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
