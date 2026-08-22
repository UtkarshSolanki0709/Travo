import type { Conversation, Message } from "./chatService";
import { getDb } from "./localDb";

// SQLite-backed cache for chat. All writes are fire-and-forget from the UI's
// perspective: callers don't await these in render paths, and failures only
// log — the network remains the source of truth.

interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  text: string | null;
  media_url: string | null;
  media_type: string | null;
  client_temp_id: string | null;
  created_at: string;
  status: string;
  is_edited: number;
  edited_at: string | null;
  is_deleted: number;
  deleted_for_user_ids: string | null;
  sender_json: string | null;
  reply_to_json: string | null;
  updated_at: string;
}

interface ConversationRow {
  id: string;
  type: string;
  title: string | null;
  avatar_url: string | null;
  last_message_text: string | null;
  last_message_at: string | null;
  unread_count: number;
  other_user_json: string | null;
  updated_at: string;
}

const UPSERT_MESSAGE = `
  INSERT INTO messages (
    id, conversation_id, sender_id, text, media_url, media_type,
    client_temp_id, created_at, status, is_edited, edited_at, is_deleted,
    deleted_for_user_ids, sender_json, reply_to_json, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    text = excluded.text,
    media_url = excluded.media_url,
    media_type = excluded.media_type,
    client_temp_id = excluded.client_temp_id,
    status = excluded.status,
    is_edited = excluded.is_edited,
    edited_at = excluded.edited_at,
    is_deleted = excluded.is_deleted,
    deleted_for_user_ids = excluded.deleted_for_user_ids,
    sender_json = excluded.sender_json,
    reply_to_json = excluded.reply_to_json,
    updated_at = excluded.updated_at
`;

const toParams = (m: Message): (string | number | null)[] => [
  m.id,
  m.conversation_id,
  m.sender_id,
  m.text ?? null,
  m.media_url ?? null,
  m.media_type ?? null,
  m.client_temp_id ?? null,
  m.created_at,
  m.status ?? "sent",
  m.is_edited ? 1 : 0,
  m.edited_at ?? null,
  m.is_deleted ? 1 : 0,
  JSON.stringify(m.deleted_for_user_ids ?? []),
  m.sender ? JSON.stringify(m.sender) : null,
  m.reply_to_message ? JSON.stringify(m.reply_to_message) : null,
  new Date().toISOString(),
];

const fromRow = (r: MessageRow): Message => ({
  id: r.id,
  conversation_id: r.conversation_id,
  sender_id: r.sender_id,
  text: r.text ?? undefined,
  media_url: r.media_url ?? undefined,
  media_type: (r.media_type ?? undefined) as Message["media_type"],
  client_temp_id: r.client_temp_id ?? undefined,
  created_at: r.created_at,
  status: r.status as Message["status"],
  is_edited: Boolean(r.is_edited),
  edited_at: r.edited_at ?? undefined,
  is_deleted: Boolean(r.is_deleted),
  deleted_for_user_ids: r.deleted_for_user_ids
    ? JSON.parse(r.deleted_for_user_ids)
    : undefined,
  sender: r.sender_json ? JSON.parse(r.sender_json) : undefined,
  reply_to_message: r.reply_to_json ? JSON.parse(r.reply_to_json) : undefined,
});

export const messageStore = {
  async hydrateMessages(
    conversationId: string,
    currentUserId: string,
  ): Promise<Message[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<MessageRow>(
      "SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC",
      [conversationId],
    );
    return rows
      .map(fromRow)
      .filter(
        (m) => !(m.deleted_for_user_ids ?? []).includes(currentUserId),
      );
  },

  async saveMessages(messages: Message[]): Promise<void> {
    if (messages.length === 0) return;
    const db = await getDb();
    await db.withTransactionAsync(async () => {
      for (const m of messages) {
        // A server echo with the same client_temp_id replaces its temp row
        if (m.client_temp_id) {
          await db.runAsync(
            "DELETE FROM messages WHERE client_temp_id = ? AND id != ?",
            [m.client_temp_id, m.id],
          );
        }
        await db.runAsync(UPSERT_MESSAGE, toParams(m));
      }
    });
  },

  async saveMessage(message: Message): Promise<void> {
    return this.saveMessages([message]);
  },

  async updateStatus(messageId: string, status: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      "UPDATE messages SET status = ?, updated_at = ? WHERE id = ?",
      [status, new Date().toISOString(), messageId],
    );
  },

  async markDeleted(messageId: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `UPDATE messages SET is_deleted = 1, text = 'This message was deleted',
       media_url = NULL, media_type = NULL, updated_at = ? WHERE id = ?`,
      [new Date().toISOString(), messageId],
    );
  },

  async removeMessage(messageId: string): Promise<void> {
    const db = await getDb();
    await db.runAsync("DELETE FROM messages WHERE id = ?", [messageId]);
  },

  async clearOutboxEntry(clientTempId: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      "DELETE FROM messages WHERE client_temp_id = ? AND status = 'sending'",
      [clientTempId],
    );
  },

  /** Unsent optimistic messages waiting for a retry (the offline outbox). */
  async pendingOutbox(senderId: string): Promise<Message[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<MessageRow>(
      "SELECT * FROM messages WHERE status = 'sending' AND sender_id = ? ORDER BY created_at ASC",
      [senderId],
    );
    return rows.map(fromRow);
  },

  async hydrateConversations(): Promise<Conversation[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<ConversationRow>(
      "SELECT * FROM conversations ORDER BY COALESCE(last_message_at, updated_at) DESC",
    );
    return rows.map((r) => ({
      id: r.id,
      type: r.type as Conversation["type"],
      title: r.title ?? undefined,
      avatar_url: r.avatar_url ?? undefined,
      last_message_text: r.last_message_text ?? undefined,
      last_message_at: r.last_message_at ?? undefined,
      unread_count: r.unread_count,
      other_user: r.other_user_json ? JSON.parse(r.other_user_json) : undefined,
      created_at: r.updated_at,
    }));
  },

  async saveConversations(conversations: Conversation[]): Promise<void> {
    if (conversations.length === 0) return;
    const db = await getDb();
    const now = new Date().toISOString();
    await db.withTransactionAsync(async () => {
      for (const c of conversations) {
        await db.runAsync(
          `INSERT INTO conversations (
             id, type, title, avatar_url, last_message_text, last_message_at,
             unread_count, other_user_json, updated_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             type = excluded.type,
             title = excluded.title,
             avatar_url = excluded.avatar_url,
             last_message_text = excluded.last_message_text,
             last_message_at = excluded.last_message_at,
             unread_count = excluded.unread_count,
             other_user_json = excluded.other_user_json,
             updated_at = excluded.updated_at`,
          [
            c.id,
            c.type,
            c.title ?? null,
            c.avatar_url ?? null,
            c.last_message_text ?? null,
            c.last_message_at ?? null,
            c.unread_count ?? 0,
            c.other_user ? JSON.stringify(c.other_user) : null,
            now,
          ],
        );
      }
    });
  },

  /** Bump the cached conversation when a new message arrives in a chat room. */
  async touchConversation(
    conversationId: string,
    lastText: string | null,
  ): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `UPDATE conversations SET last_message_text = ?, last_message_at = ?,
       updated_at = ? WHERE id = ?`,
      [lastText, new Date().toISOString(), new Date().toISOString(), conversationId],
    );
  },
};
