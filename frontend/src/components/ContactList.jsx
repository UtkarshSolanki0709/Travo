import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import { useAuthStore } from "../store/useAuthStore";

function ContactList() {
  const { getAllContacts, allContacts, setSelectedUser, isUsersLoading } =
    useChatStore();
  const { onlineUsers } = useAuthStore();

  useEffect(() => {
    getAllContacts();
  }, [getAllContacts]);

  if (isUsersLoading) return <UsersLoadingSkeleton />;

  return (
    <>
      {allContacts.map((contact) => (
        <div
          key={contact._id}
          className="bg-cyan-500/10 p-3 md:p-4 rounded-lg cursor-pointer hover:bg-cyan-500/20 transition-colors min-h-[60px] flex items-center"
          onClick={() => setSelectedUser(contact)}
        >
          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
            <div
              className={`avatar ${
                onlineUsers.includes(contact._id.toString())
                  ? "online"
                  : "offline"
              }`}
            >
              <div className="size-10 md:size-12 rounded-full">
                <img
                  src={contact.profilePic || "/avatar.png"}
                  alt={contact.fullName}
                  onError={(e) => {
                    e.currentTarget.src = "/avatar.png";
                  }}
                />
              </div>
            </div>
            <h4 className="text-slate-200 font-medium truncate text-sm md:text-base">
              {contact.fullName}
            </h4>
          </div>
        </div>
      ))}
    </>
  );
}
export default ContactList;
