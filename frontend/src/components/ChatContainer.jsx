import { useEffect, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import ChatHeader from "./ChatHeader";
import NoChatHistoryPlaceholder from "./NoChatHistoryPlaceholder";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";
import MessageInput from "./MessageInput";
import { formatMessageTime } from "../lib/utils";
import { DownloadIcon } from "lucide-react";
import toast from "react-hot-toast";

const handleDownload = async (url, type) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    const ext = type === "video" ? "mp4" : type === "gif" ? "gif" : "jpg";
    link.download = `convo-media-${Date.now()}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
    toast.success("Download started!");
  } catch (error) {
    console.error("Error downloading file:", error);
    // Fallback: open in new tab
    window.open(url, "_blank");
  }
};

function ChatContainer() {
  const {
    selectedUser,
    getMessagesByUserId,
    messages,
    isMessagesLoading,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  useEffect(() => {
    getMessagesByUserId(selectedUser._id);
  }, [
    selectedUser,
    getMessagesByUserId,
  ]);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <>
      <ChatHeader />
      <div className="flex-1 overflow-y-auto px-6 py-8">
        {messages.length > 0 && !isMessagesLoading ? (
          <div className="max-w-3xl mx-auto space-y-6 ">
            {messages.map((msg) => (
              <div
                key={msg._id}
                className={`chat ${
                  msg.senderId === authUser._id ? "chat-end" : "chat-start"
                }`}
              >
                <div
                  className={`chat-bubble relative ${
                    msg.senderId === authUser._id
                      ? "bg-violet-600 text-white"
                      : "bg-zinc-800 text-zinc-100"
                  }`}
                >
                  {/* Media Attachments Grid */}
                  {msg.media && msg.media.length > 0 && (
                    <div className={`grid gap-2 mb-2 ${
                      msg.media.length === 1 ? "grid-cols-1" :
                      msg.media.length === 2 ? "grid-cols-2" :
                      "grid-cols-2 md:grid-cols-3"
                    }`}>
                      {msg.media.map((item, idx) => (
                        <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-700/50 bg-slate-950 flex items-center justify-center min-w-[120px] max-w-[300px]">
                          {item.type === "video" ? (
                            <video
                              src={item.url}
                              controls
                              className="max-h-60 w-full object-contain"
                              playsInline
                            />
                          ) : (
                            <img
                              src={item.url}
                              alt="Attachment"
                              className="max-h-60 w-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                          )}
                          
                          <button
                            onClick={() => handleDownload(item.url, item.type)}
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-slate-900 border border-slate-700/50 min-h-[30px] min-w-[30px] flex items-center justify-center shadow-lg z-10"
                            title="Download file"
                          >
                            <DownloadIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Fallback image (Legacy) */}
                  {!msg.media && msg.image && (
                    <div className="relative group rounded-lg overflow-hidden border border-slate-700/50 mb-2">
                      <img
                        src={msg.image}
                        alt="Shared Legacy"
                        className="rounded-lg h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <button
                        onClick={() => handleDownload(msg.image, "image")}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-slate-900 border border-slate-700/50 min-h-[30px] min-w-[30px] flex items-center justify-center shadow-lg z-10"
                        title="Download legacy image"
                      >
                        <DownloadIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {msg.text && <p className="mt-2">{msg.text}</p>}
                  <p className="text-xs mt-1 opacity-75 flex items-center justify-between gap-2">
                    <span>{formatMessageTime(msg.createdAt)}</span>
                    {msg.senderId === authUser._id && (
                      <span className="text-[10px] font-medium tracking-wide">
                        {msg.seen ? (
                          <span className="text-emerald-400 flex items-center gap-0.5" title="Seen">
                            ✓✓ Seen
                          </span>
                        ) : (
                          <span className="text-zinc-400 flex items-center gap-0.5" title="Sent">
                            ✓ Sent
                          </span>
                        )}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messageEndRef} />
          </div>
        ) : isMessagesLoading ? (
          <MessagesLoadingSkeleton />
        ) : (
          <NoChatHistoryPlaceholder name={selectedUser.fullName} />
        )}
      </div>
      <MessageInput />
    </>
  );
}

export default ChatContainer;
