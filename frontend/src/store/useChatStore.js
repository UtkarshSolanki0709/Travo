import {create} from "zustand";
import { axiosInstance } from "../lib/axios";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";


export const useChatStore=create((set,get)=>({
    allContacts: [],
    chats: [],
    messages: [],
    activeTab: "chats",
    selectedUser: null,
    isUsersLoading: false,
    isMessagesLoading: false,
    isSoundEnabled: localStorage.getItem("isSoundEnabled") === "true",
    isUploadingMedia: false,
    uploadProgress: 0,
    
    toggleSound:()=>{
            localStorage.setItem("isSoundEnabled", String(!get().isSoundEnabled))
            set({isSoundEnabled:!get().isSoundEnabled})
    },

    setActiveTab:(tab)=>set({activeTab:tab}),
    setSelectedUser:async(selectedUser)=>{
        set({selectedUser});
        if(selectedUser){
            // Reset unseenCount locally
            const {chats,allContacts}=get();
            const updatedChats=chats.map(chat=>
                chat._id===selectedUser._id ? {...chat, unseenCount:0} : chat
            );
            const updatedContacts=allContacts.map(contact=>
                contact._id===selectedUser._id ? {...contact, unseenCount:0} : contact
            );
            set({chats:updatedChats, allContacts:updatedContacts});

            try {
                await axiosInstance.put(`/messages/mark-as-seen/${selectedUser._id}`);
            } catch (error) {
                console.error("Error marking messages as seen:", error);
            }
        }
    },
    
    getAllContacts:async()=>{
        set({isUsersLoading:true})
        try {
            const res=await axiosInstance.get("/messages/contacts");
            set({allContacts:res.data.users})
        } catch (error) {
            toast.error(error.response.data.message)
        }finally{
            set({isUsersLoading:false})
        }
    },
    getMyChatPartners:async()=>{
        set({isUsersLoading:true})
        try {
            const res=await axiosInstance.get("/messages/chats");
            set({chats:res.data.chatPartners})
        } catch (error) {
            toast.error(error.response.data.message)
        }finally{
            set({isUsersLoading:false})
        }
    },

    getMessagesByUserId:async(userId)=>{
        set({isMessagesLoading:true})
        try {
            const res=await axiosInstance.get(`/messages/${userId}`);
            set({messages:res.data.message})
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to fetch messages")
        }finally{
            set({isMessagesLoading:false})
        }
    },
    
    sendMessage:async(messageData)=>{
        const{selectedUser,messages}=get();
        const{authUser}=useAuthStore.getState();

        const tempId=`temp-${Date.now()}`;
        
        // Setup local previews for optimistic UI
        const optimisticMedia = messageData.files ? messageData.files.map(f => ({
            url: URL.createObjectURL(f),
            type: f.type.startsWith("video/") ? "video" : f.type === "image/gif" ? "gif" : "image",
            isLocalPreview: true
        })) : [];

        const optimisticMessage={
            _id:tempId,
            senderId:authUser._id,
            receiverId:selectedUser._id,
            text:messageData.text,
            media:optimisticMedia,
            createdAt:new Date().toISOString(),
            isOptimistic:true,
        }
        set({messages:[...messages,optimisticMessage]})

        const {isSoundEnabled}=get();
        if(isSoundEnabled){
            const notificationSound=new Audio("/sounds/notification.mp3");
            notificationSound.currentTime=0;
            notificationSound.play().catch((error)=>console.log(error));
        }

        let mediaUrls = [];
        if (messageData.files && messageData.files.length > 0) {
            set({ isUploadingMedia: true, uploadProgress: 0 });
            try {
                // 1. Get upload signature from backend
                const sigRes = await axiosInstance.get("/messages/upload-signature");
                const { signature, timestamp, apiKey, cloudName, folder } = sigRes.data;

                // 2. Upload each file directly to Cloudinary
                for (let i = 0; i < messageData.files.length; i++) {
                    const file = messageData.files[i];
                    const formData = new FormData();
                    formData.append("file", file);
                    formData.append("api_key", apiKey);
                    formData.append("timestamp", timestamp);
                    formData.append("signature", signature);
                    formData.append("folder", folder);

                    const res = await axios.post(
                        `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
                        formData,
                        {
                            headers: { "Content-Type": "multipart/form-data" },
                            onUploadProgress: (progressEvent) => {
                                const currentProgress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                                const overallProgress = Math.round(((i * 100) + currentProgress) / messageData.files.length);
                                set({ uploadProgress: overallProgress });
                            }
                        }
                    );
                    
                    const url = res.data.secure_url;
                    const type = file.type.startsWith("video/") ? "video" : 
                                 file.type === "image/gif" ? "gif" : "image";
                    mediaUrls.push({ url, type });
                }
            } catch (error) {
                console.error("Upload error:", error);
                toast.error("Failed to upload media files.");
                // Remove optimistic message on error
                set({ messages: messages, isUploadingMedia: false, uploadProgress: 0 });
                return;
            } finally {
                set({ isUploadingMedia: false, uploadProgress: 0 });
            }
        }

        try {
            const res=await axiosInstance.post(`/messages/send/${selectedUser._id}`, {
                text: messageData.text,
                media: mediaUrls
            });
            set({messages: messages.concat(res.data.message)})
        } catch (error) {
            set({messages:messages})
            toast.error(error.response?.data?.message || "Failed to send message")
        }
    },

    subscribeToMessages: () => {
        const { socket } = useAuthStore.getState();
        if (!socket) return;

        // Clean up any existing listeners first to avoid duplicates
        socket.off("newMessage");
        socket.off("offline-messages-notifications");
        socket.off("messagesMarkedAsSeen");

        // Real-time message listener
        socket.on("newMessage", (newMessage) => {
            const { selectedUser, messages, chats, allContacts } = get();
            
            const isMessageSentFromSelectedUser = selectedUser && newMessage.senderId === selectedUser._id;
            
            if (isMessageSentFromSelectedUser) {
                set({ messages: [...messages, newMessage] });
                
                // Mark message as seen in database
                axiosInstance.put(`/messages/mark-as-seen/${selectedUser._id}`).catch(err => console.error(err));
                
                const { isSoundEnabled } = get();
                if (isSoundEnabled) {
                    const notificationSound = new Audio("/sounds/notification.mp3");
                    notificationSound.currentTime = 0;
                    notificationSound.play().catch((error) => console.log(error));
                }
            } else {
                // Message is from another user or user has no active chat open
                const { isSoundEnabled } = get();
                if (isSoundEnabled) {
                    const notificationSound = new Audio("/sounds/notification.mp3");
                    notificationSound.currentTime = 0;
                    notificationSound.play().catch((error) => console.log(error));
                }

                // Increment unseenCount locally in chats and allContacts
                const updatedChats = chats.map(chat => 
                    chat._id === newMessage.senderId 
                        ? { ...chat, unseenCount: (chat.unseenCount || 0) + 1 }
                        : chat
                );
                const updatedContacts = allContacts.map(contact => 
                    contact._id === newMessage.senderId 
                        ? { ...contact, unseenCount: (contact.unseenCount || 0) + 1 }
                        : contact
                );
                
                // If the sender is not in the current chats list, refresh chats list
                const senderInChats = chats.some(chat => chat._id === newMessage.senderId);
                if (!senderInChats) {
                    get().getMyChatPartners();
                } else {
                    set({ chats: updatedChats, allContacts: updatedContacts });
                }

                // Push toast notification
                const senderName = newMessage.senderInfo?.fullName || "Someone";
                const timeStr = new Date(newMessage.createdAt).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false
                });
                toast(`Message from ${senderName} (${timeStr}): ${newMessage.text || "📷 Image"}`);
            }
        });

        // Offline notifications when user connects
        socket.on("offline-messages-notifications", (unseenMessages) => {
            const { isSoundEnabled } = get();
            if (isSoundEnabled && unseenMessages.length > 0) {
                const notificationSound = new Audio("/sounds/notification.mp3");
                notificationSound.currentTime = 0;
                notificationSound.play().catch((error) => console.log(error));
            }
            
            // Group unseen messages by senderId
            const messagesBySender = {};
            unseenMessages.forEach(msg => {
                const senderId = msg.senderId._id.toString();
                if (!messagesBySender[senderId]) {
                    messagesBySender[senderId] = [];
                }
                messagesBySender[senderId].push(msg);
            });

            // Show toast notifications grouped by sender
            Object.keys(messagesBySender).forEach(senderId => {
                const msgs = messagesBySender[senderId];
                const senderName = msgs[0].senderId.fullName || "Someone";
                const lastMsg = msgs[msgs.length - 1];
                const timeStr = new Date(lastMsg.createdAt).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false
                });
                
                if (msgs.length === 1) {
                    toast(`Message from ${senderName} (${timeStr}): ${lastMsg.text || "📷 Image"}`);
                } else {
                    toast(`${msgs.length} new messages from ${senderName} (last at ${timeStr})`);
                }
            });

            // Refresh contacts and chats lists to get updated unseenCount values from backend
            get().getMyChatPartners();
            get().getAllContacts();
        });

        // When receiver marks my messages as seen
        socket.on("messagesMarkedAsSeen", ({ senderId, receiverId }) => {
            const { selectedUser, messages } = get();
            // If the other user (receiverId) opened my chat (senderId) and I am currently viewing their chat
            if (selectedUser && selectedUser._id === receiverId) {
                const updatedMessages = messages.map(msg => 
                    msg.senderId === senderId && msg.receiverId === receiverId
                        ? { ...msg, seen: true }
                        : msg
                );
                set({ messages: updatedMessages });
            }
        });
    },

    unsubscribeFromMessages: () => {
        const { socket } = useAuthStore.getState();
        if (!socket) return;
        socket.off("newMessage");
        socket.off("offline-messages-notifications");
        socket.off("messagesMarkedAsSeen");
    },
}));
