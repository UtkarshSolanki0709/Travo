import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { X } from "lucide-react";
import { useEffect } from "react";

function ChatHeader() {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const isOnline = selectedUser
    ? onlineUsers.includes(selectedUser._id.toString())
    : false;
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") setSelectedUser(null);
    };
    window.addEventListener("keydown", handleEscKey);
    return () => window.removeEventListener("keydown", handleEscKey);
  }, [setSelectedUser]);

  return (
    <div className="flex items-center justify-between p-3 md:p-4 border-b bg-zinc-800/50 border-zinc-700/50 max-h-[60px] px-4 md:px-6 flex-1">
      <div className="flex items-center space-x-2 md:space-x-3">
        <div className={`avatar ${isOnline ? "online" : "offline"}`}>
          <div className="w-10 md:w-12 rounded-full">
            <img
              src={selectedUser?.profilePic || "/avatar.png"}
              alt={selectedUser?.fullName}
              onError={(e) => {
                e.currentTarget.src = "/avatar.png";
              }}
            />
          </div>
        </div>
        <div>
          <h3 className="font-medium text-zinc-100 text-sm md:text-base">
            {selectedUser.fullName}
          </h3>
          <p className="text-xs md:text-sm text-zinc-300">
            {isOnline ? "Online" : "Offline"}
          </p>
        </div>
      </div>
      <button
        onClick={() => setSelectedUser(null)}
        className="text-zinc-400 hover:text-zinc-200 transition-colors p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
      >
        <X className="w-5 md:w-6 h-5 md:h-6" />
      </button>
    </div>
  );
}

export default ChatHeader;
