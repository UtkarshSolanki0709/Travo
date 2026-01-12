import { MessageCircleIcon } from "lucide-react";

const NoConversationPlaceholder = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6">
      <div className="size-20 bg-cyan-500/20 rounded-full flex items-center justify-center mb-6">
        <MessageCircleIcon className="size-10 text-cyan-400" />
      </div>
      <h3 className="text-lg md:text-xl font-semibold text-slate-200 mb-2">
        Select a conversation
      </h3>
      <p className="text-slate-400 max-w-md text-sm md:text-base">
        Tap the menu button to open the sidebar and choose a contact to start
        chatting or continue a previous conversation.
      </p>
    </div>
  );
};

export default NoConversationPlaceholder;
