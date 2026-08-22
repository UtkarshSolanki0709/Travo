import { supabase } from "@/lib/supabase";
import { getDb } from "./localDb";

// Local-first analytics: events are written to the SQLite `events` table and
// batch-uploaded to the Supabase `analytics_events` table. If the table
// doesn't exist yet or the device is offline, events simply stay queued.
// ponytail: no retry backoff — flushes run on foreground / every 20 events.

interface EventRow {
  id: number;
  name: string;
  props: string | null;
  created_at: string;
}

const BATCH_SIZE = 50;
const FLUSH_EVERY = 20;

let currentUserId: string | null = null;
let queuedSinceFlush = 0;
let flushing = false;

export const analytics = {
  setUser(userId: string | null) {
    currentUserId = userId;
  },

  async track(
    name: string,
    props?: Record<string, string | number | boolean | null>,
  ): Promise<void> {
    try {
      const db = await getDb();
      await db.runAsync(
        "INSERT INTO events (name, props, created_at) VALUES (?, ?, ?)",
        [name, props ? JSON.stringify(props) : null, new Date().toISOString()],
      );
      queuedSinceFlush += 1;
      if (queuedSinceFlush >= FLUSH_EVERY) {
        void this.flush();
      }
    } catch (e) {
      console.warn("analytics track failed:", e);
    }
  },

  async flush(): Promise<void> {
    if (flushing) return;
    flushing = true;
    try {
      const db = await getDb();
      for (;;) {
        const rows = await db.getAllAsync<EventRow>(
          "SELECT * FROM events ORDER BY id ASC LIMIT ?",
          [BATCH_SIZE],
        );
        if (rows.length === 0) break;

        const inserts = rows.map((r) => ({
          user_id: currentUserId,
          name: r.name,
          props: r.props ? JSON.parse(r.props) : null,
          created_at: r.created_at,
        }));
        const { error } = await supabase
          .from("analytics_events")
          .insert(inserts);
        if (error) throw error;

        const ids = rows.map((r) => r.id);
        const placeholders = ids.map(() => "?").join(",");
        await db.runAsync(
          `DELETE FROM events WHERE id IN (${placeholders})`,
          ids,
        );

        if (rows.length < BATCH_SIZE) break;
      }
      queuedSinceFlush = 0;
    } catch (e) {
      // Table missing or offline — events stay queued for the next flush
      console.warn("analytics flush deferred:", e);
    } finally {
      flushing = false;
    }
  },
};
