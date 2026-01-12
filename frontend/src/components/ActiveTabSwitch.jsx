import { useChatStore } from "../store/useChatStore";

function ActiveTabSwitch() {
  const { activeTab, setActiveTab } = useChatStore();

  return (
    <div className="tabs tabs-boxed bg-transparent p-1 md:p-2 m-1 md:m-2">
      <button
        onClick={() => setActiveTab("chats")}
        className={`tab text-xs md:text-sm min-h-[36px] md:min-h-[40px] px-2 md:px-4 ${
          activeTab === "chats"
            ? "bg-cyan-500/20 text-cyan-400"
            : "text-slate-400"
        }`}
      >
        Chats
      </button>

      <button
        onClick={() => setActiveTab("contacts")}
        className={`tab text-xs md:text-sm min-h-[36px] md:min-h-[40px] px-2 md:px-4 ${
          activeTab === "contacts"
            ? "bg-cyan-500/20 text-cyan-400"
            : "text-slate-400"
        }`}
      >
        Contacts
      </button>
    </div>
  );
}
export default ActiveTabSwitch;
