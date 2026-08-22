import * as SQLite from "expo-sqlite";

// Local cache database (chat messages, conversation list, analytics events).
// Every runtime query in this module tree uses ? parameter binding — no
// string interpolation of external input into SQL (Mimosa constraint).

const MIGRATIONS: string[] = [
  // v1 — initial schema
  `
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY NOT NULL,
    conversation_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    text TEXT,
    media_url TEXT,
    media_type TEXT,
    client_temp_id TEXT,
    created_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'sent',
    is_edited INTEGER NOT NULL DEFAULT 0,
    edited_at TEXT,
    is_deleted INTEGER NOT NULL DEFAULT 0,
    deleted_for_user_ids TEXT,
    sender_json TEXT,
    reply_to_json TEXT,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_messages_conv
    ON messages (conversation_id, created_at);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_client_temp
    ON messages (client_temp_id) WHERE client_temp_id IS NOT NULL;
  `,
  `
  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY NOT NULL,
    type TEXT NOT NULL,
    title TEXT,
    avatar_url TEXT,
    last_message_text TEXT,
    last_message_at TEXT,
    unread_count INTEGER NOT NULL DEFAULT 0,
    other_user_json TEXT,
    updated_at TEXT NOT NULL
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    name TEXT NOT NULL,
    props TEXT,
    created_at TEXT NOT NULL
  );
  `,
];

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export const getDb = (): Promise<SQLite.SQLiteDatabase> => {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync("travo.db");
      await db.execAsync("PRAGMA journal_mode = WAL;");
      const row = await db.getFirstAsync<{ user_version: number }>(
        "PRAGMA user_version;",
      );
      let version = row?.user_version ?? 0;
      for (; version < MIGRATIONS.length; version++) {
        await db.withTransactionAsync(async () => {
          await db.execAsync(MIGRATIONS[version]);
          // version is a compile-time loop index, not external input
          await db.execAsync(`PRAGMA user_version = ${version + 1};`);
        });
      }
      return db;
    })();
  }
  return dbPromise;
};
