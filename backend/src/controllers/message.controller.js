import User from "../models/User.js";
import Message from "../models/Message.js";
import cloudinary from "../lib/cloudinary.js";
import mongoose from "mongoose";
import { getReceiverSocketId, io } from "../lib/socket.js";
export const getAllContacts = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");
    res.status(200).json({ users: filteredUsers });
  } catch (error) {
    console.error("Get All Contacts Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getMessagesByUserId = async (req, res) => {
  try {
    const myId = req.user._id;
    const { id: userToChatId } = req.params;

    const message = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json({ message });
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};
export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;
    if (!text && !image) {
      return res.status(400).json({ message: "Message must contain text or an image" });
    }
    if (text && text.length > 2000) {
      return res.status(400).json({ message: "Text cannot exceed 2000 characters" });
    }
    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({ message: "Invalid receiver ID" });
    }
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found" });
    }
    if (senderId.toString() === receiverId) {
      return res.status(400).json({ message: "Cannot send messages to yourself" });
    }
    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }
    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });
    await newMessage.save();
    const receiverSocketId=getReceiverSocketId(receiverId);
    if(receiverSocketId){
        io.to(receiverSocketId).emit("newMessage",newMessage);
    }
    res.status(201).json({ message: newMessage });
  } catch (error) {
    console.error("Send Message Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getAllChatPartners = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;
        const messages=await Message.find({
            $or:[{senderId:loggedInUserId},{receiverId:loggedInUserId}]
        })
        const chatPartnerIds = [
            ...new Set(messages.map(
            (msg) => msg.senderId.toString() === loggedInUserId.toString() 
            ? msg.receiverId.toString() 
            : msg.senderId.toString()
        )
    )
]; 
        const chatPartners = await User.find({
            _id: { $in: chatPartnerIds },
        }).select("-password");

        res.status(200).json({ chatPartners });
    } catch (error) {
        console.error("Get All Chat Partners Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
}
