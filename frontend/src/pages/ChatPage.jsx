import { useState } from "react";
import BorderAnimatedContainer from "../components/BorderAnimatedContainer";
import { useChatStore } from "../store/useChatStore";
import ProfileHeader from "../components/ProfileHeader";
import ActiveTabSwitch from "../components/ActiveTabSwitch";
import ChatsList from "../components/ChatsList";
import ContactList from "../components/ContactList";
import ChatContainer from "../components/ChatContainer";
import NoConversationPlaceholder from "../components/NoConversationPlaceholder";
import { Menu } from "lucide-react";

function ChatPage() {
  const { activeTab, selectedUser } = useChatStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="relative w-full max-w-6xl h-[800px]">
      <BorderAnimatedContainer>
        {/* Sidebar - toggleable on mobile */}
        <div
          className={`w-80 bg-slate-900/50 backdrop-blur-sm flex flex-col md:relative absolute inset-y-0 left-0 z-20 ${
            isSidebarOpen ? "block" : "hidden"
          } md:block`}
        >
          <ProfileHeader />
          <ActiveTabSwitch />
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {activeTab === "chats" ? <ChatsList /> : <ContactList />}
          </div>
        </div>

        {/* Backdrop for mobile sidebar */}
        {isSidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-10"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Chat Container */}
        <div className="flex-1 flex flex-col bg-zinc-900/50 backdrop-blur-sm relative">
          {/* Hamburger button for mobile */}
          <button
            className="md:hidden absolute top-4 left-4 z-10 bg-slate-800/50 p-2 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <Menu className="w-6 h-6" />
          </button>

          {selectedUser ? <ChatContainer /> : <NoConversationPlaceholder />}
        </div>
      </BorderAnimatedContainer>
    </div>
  );
}

export default ChatPage;
