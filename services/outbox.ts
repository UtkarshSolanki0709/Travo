import { chatService } from "./chatService";
import { messageStore } from "./messageStore";
import { socketService } from "./socketService";

// Retries unsent messages ('sending' rows in the message cache) in order.
// ponytail: no backoff — flushes are triggered by foreground/reconnect only.
let flushing = false;

export const flushOutbox = async (userId: string): Promise<void> => {
  if (flushing) return;
  flushing = true;
  try {
    const pending = await messageStore.pendingOutbox(userId);
    for (const m of pending) {
      try {
        const sent = await chatService.sendMessage(
          m.conversation_id,
          m.sender_id,
          m.text || "",
          m.media_url || undefined,
          m.media_type || undefined,
          m.client_temp_id,
          m.reply_to_message_id,
          m.reply_to_message,
        );
        socketService.emitSendMessage(sent);
        await messageStore.saveMessage(sent);
      } catch (err) {
        // Still offline — keep the queue and wait for the next trigger
        console.warn("Outbox flush stopped (send failed):", err);
        break;
      }
    }
  } finally {
    flushing = false;
  }
};
