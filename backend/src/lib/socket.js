import {Server} from "socket.io";
import http from "http";
import express from "express";
import  {ENV} from "./env.js";
import { socketAuthMiddleware } from "../middleware/socket.auth.middleware.js";
import Message from "../models/Message.js";
const app=express();
const server=http.createServer(app);
const io=new Server(server,{
    cors:{
        origin:ENV.CLIENT_URL,
        credentials:true,
    },
});
io.use(socketAuthMiddleware);
export function getReceiverSocketId(userId){
    return userSocketMap[userId];
}
const userSocketMap={};
io.on("connection",async (socket)=>{
    const { userId, id: socketId } = socket;
    userSocketMap[userId] = socketId;
    io.emit("getOnlineUsers",Object.keys(userSocketMap));

    // Fetch and send offline/unseen messages notifications
    try {
        const unseenMessages = await Message.find({ receiverId: userId, seen: false })
            .populate("senderId", "fullName profilePic")
            .sort({ createdAt: 1 });
        if (unseenMessages && unseenMessages.length > 0) {
            socket.emit("offline-messages-notifications", unseenMessages);
        }
    } catch (err) {
        console.error("Error fetching unseen messages on socket connect:", err);
    }

    socket.on("disconnect",()=>{
        delete userSocketMap[userId];
        io.emit("getOnlineUsers",Object.keys(userSocketMap));
    }); 
    socket.on("send-message",(data)=>{
        const receiverSocketId=getReceiverSocketId(data.receiverId);
        if(receiverSocketId){
            io.to(receiverSocketId).emit("receive-message",data);
        }
    });    
});
export {io, app, server};
