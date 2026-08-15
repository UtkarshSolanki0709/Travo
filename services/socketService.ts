import { io, Socket } from "socket.io-client";

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

let socket: Socket | null = null;
let currentConnectedUserId: string | null = null;

export const socketService = {
  connect(userId: string) {
    if (!userId) return;

    if (socket && socket.connected && currentConnectedUserId === userId) {
      return;
    }

    if (socket) {
      socket.disconnect();
    }

    currentConnectedUserId = userId;

    socket = io(BACKEND_URL, {
      auth: { token: userId, userId },
      query: { userId },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      console.log("Connected to Convo real-time chat server:", BACKEND_URL);
    });

    socket.on("connect_error", (error) => {
      console.warn("Socket connection error:", error.message);
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });
  },

  disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
      currentConnectedUserId = null;
    }
  },

  getSocket() {
    return socket;
  },

  onNewMessage(callback: (message: any) => void) {
    if (!socket) return () => {};
    socket.on("newMessage", callback);
    return () => {
      socket?.off("newMessage", callback);
    };
  },

  onMessagesMarkedAsSeen(callback: (data: any) => void) {
    if (!socket) return () => {};
    socket.on("messagesMarkedAsSeen", callback);
    return () => {
      socket?.off("messagesMarkedAsSeen", callback);
    };
  },

  onMessageEdited(callback: (message: any) => void) {
    if (!socket) return () => {};
    socket.on("messageEdited", callback);
    return () => {
      socket?.off("messageEdited", callback);
    };
  },

  onMessageDeleted(callback: (data: any) => void) {
    if (!socket) return () => {};
    socket.on("messageDeleted", callback);
    return () => {
      socket?.off("messageDeleted", callback);
    };
  },

  onTypingStatus(
    callback: (data: {
      conversationId: string;
      userId: string;
      isTyping: boolean;
    }) => void,
  ) {
    if (!socket) return () => {};
    socket.on("typingStatus", callback);
    return () => {
      socket?.off("typingStatus", callback);
    };
  },

  onGetOnlineUsers(callback: (onlineUserIds: string[]) => void) {
    if (!socket) return () => {};
    socket.on("getOnlineUsers", callback);
    return () => {
      socket?.off("getOnlineUsers", callback);
    };
  },

  emitSendMessage(message: any) {
    if (socket && socket.connected) {
      socket.emit("sendMessage", message);
    }
  },

  emitEditMessage(message: any) {
    if (socket && socket.connected) {
      socket.emit("editMessage", message);
    }
  },

  emitDeleteMessage(data: {
    messageId: string;
    conversationId: string;
    deleteForEveryone: boolean;
    deletedMessage?: any;
  }) {
    if (socket && socket.connected) {
      socket.emit("deleteMessage", data);
    }
  },

  emitTyping(data: {
    conversationId: string;
    userId: string;
    isTyping: boolean;
  }) {
    if (socket && socket.connected) {
      socket.emit("typing", data);
    }
  },

  emitMarkAsSeen(data: {
    conversationId: string;
    userId: string;
    messageIds?: string[];
  }) {
    if (socket && socket.connected) {
      socket.emit("markAsSeen", data);
    }
  },

  joinConversation(conversationId: string) {
    if (socket && socket.connected && conversationId) {
      socket.emit("join_conversation", conversationId);
      socket.emit("joinRoom", conversationId);
      socket.emit("join", conversationId);
    }
  },

  leaveConversation(conversationId: string) {
    if (socket && socket.connected && conversationId) {
      socket.emit("leave_conversation", conversationId);
      socket.emit("leaveRoom", conversationId);
      socket.emit("leave", conversationId);
    }
  },
};
