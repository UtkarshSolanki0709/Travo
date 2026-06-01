import {create} from "zustand";
import { axiosInstance } from "../lib/axios";
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
    
    toggleSound:()=>{
            localStorage.setItem("isSoundEnabled", String(!get().isSoundEnabled))
            set({isSoundEnabled:!get().isSoundEnabled})
    },

    setActiveTab:(tab)=>set({activeTab:tab}),
    setSelectedUser:(selectedUser)=>set({selectedUser:selectedUser}),
    
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
        const optimisticMessage={
            _id:tempId,
            senderId:authUser._id,
            receiverId:selectedUser._id,
            text:messageData.text,
            image:messageData.image,
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
        try {
            const res=await axiosInstance.post(`/messages/send/${selectedUser._id}`,messageData);
            set({messages: messages.concat(res.data.message)})
        } catch (error) {
            set({messages:messages})
            toast.error(error.response?.data?.message || "Failed to send message")
        }
    },

    subscribeToMessages:()=>{
        const {selectedUser}=get();
        if(!selectedUser){
            return;
        }
        const { socket } = useAuthStore.getState();
        if (!socket) return;

        socket.on("newMessage",(newMessage)=>{
            const isMessageSentFromSelectedUser=newMessage.senderId===selectedUser._id;
            if(!isMessageSentFromSelectedUser) return;
            const currentMessages=get().messages;
            set({messages:[...currentMessages,newMessage]});
            const {isSoundEnabled}=get();
            if(isSoundEnabled){
                const notificationSound=new Audio("/sounds/notification.mp3");
                notificationSound.currentTime=0;
                notificationSound.play().catch((error)=>console.log(error));
            }
        })
    },

    unsubscribeFromMessages: () => {
        const { socket } = useAuthStore.getState();
        if (!socket) return;
        socket.off("newMessage");
    },


    
}))
