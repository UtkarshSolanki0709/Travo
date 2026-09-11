import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    // Perform a lightweight database query to ensure Supabase is awake and active
    const { error } = await supabase.from("users").select("id").limit(1);

    if (error) {
      return Response.json(
        {
          status: "database_error",
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    return Response.json(
      {
        status: "ok",
        message: "Supabase connection active",
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (err: any) {
    return Response.json(
      {
        status: "error",
        error: err?.message || "Internal server error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
