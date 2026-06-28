import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import NoChatsFound from "./NoChatsFound";
import { useAuthStore } from "../store/useAuthStore";

function ChatsList() {
  const { getMyChatPartners, chats, isUsersLoading, setSelectedUser } =
    useChatStore();
  const { onlineUsers } = useAuthStore();

  useEffect(() => {
    getMyChatPartners();
  }, [getMyChatPartners]);

  if (isUsersLoading) return <UsersLoadingSkeleton />;
  if (chats.length === 0) return <NoChatsFound />;

  return (
    <>
      {chats.map((chat) => (
        <div
          key={chat._id}
          className="bg-cyan-500/10 p-3 md:p-4 rounded-lg cursor-pointer hover:bg-cyan-500/20 transition-colors min-h-[60px] flex items-center"
          onClick={() => setSelectedUser(chat)}
        >
          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
            <div
              className={`avatar ${
                onlineUsers.includes(chat._id.toString()) ? "online" : "offline"
              }`}
            >
              <div className="size-10 md:size-12 rounded-full">
                <img
                  src={chat.profilePic || "/avatar.png"}
                  alt={chat.fullName}
                  onError={(e) => {
                    e.currentTarget.src = "/avatar.png";
                  }}
                />
              </div>
            </div>
            <h4 className="text-slate-200 font-medium truncate text-sm md:text-base">
              {chat.fullName}
            </h4>
          </div>
          {chat.unseenCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-violet-600 px-1.5 text-[10px] font-bold text-white shadow-sm ring-1 ring-violet-400 ml-2 shrink-0">
              {chat.unseenCount}
            </span>
          )}
        </div>
      ))}
    </>
  );
}
export default ChatsList;
