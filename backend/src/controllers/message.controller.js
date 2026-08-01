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

    // Aggregate unseen counts for the logged-in user
    const unseenCounts = await Message.aggregate([
      { $match: { receiverId: loggedInUserId, seen: false } },
      { $group: { _id: "$senderId", count: { $sum: 1 } } }
    ]);

    const unseenMap = {};
    unseenCounts.forEach(item => {
      unseenMap[item._id.toString()] = item.count;
    });

    const usersWithUnseen = filteredUsers.map(user => {
      const userObj = user.toObject();
      userObj.unseenCount = unseenMap[user._id.toString()] || 0;
      return userObj;
    });

    res.status(200).json({ users: usersWithUnseen });
  } catch (error) {
    console.error("Get All Contacts Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getMessagesByUserId = async (req, res) => {
  try {
    const myId = req.user._id;
    const { id: userToChatId } = req.params;

    // Mark messages from this user to me as seen
    await Message.updateMany(
      { senderId: userToChatId, receiverId: myId, seen: false },
      { $set: { seen: true } }
    );

    // Notify the sender that receiver has read the messages
    const senderSocketId = getReceiverSocketId(userToChatId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("messagesMarkedAsSeen", {
        senderId: userToChatId,
        receiverId: myId,
      });
    }

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
    const { text, image, media } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;
    if (!text && !image && (!media || media.length === 0)) {
      return res.status(400).json({ message: "Message must contain text, an image, or media" });
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
    let finalMedia = media || [];

    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
      finalMedia.push({ url: imageUrl, type: "image" });
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      media: finalMedia,
    });
    await newMessage.save();

    const messagePayload = {
      ...newMessage.toObject(),
      senderInfo: {
        fullName: req.user.fullName,
        profilePic: req.user.profilePic,
      },
    };

    const receiverSocketId=getReceiverSocketId(receiverId);
    if(receiverSocketId){
        io.to(receiverSocketId).emit("newMessage", messagePayload);
    }
    res.status(201).json({ message: newMessage });
  } catch (error) {
    console.error("Send Message Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getUploadSignature = async (req, res) => {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder: "convo_media" },
      cloudinary.config().api_secret
    );

    res.status(200).json({
      signature,
      timestamp,
      apiKey: cloudinary.config().api_key,
      cloudName: cloudinary.config().cloud_name,
      folder: "convo_media",
    });
  } catch (error) {
    console.error("Get Upload Signature Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getAllChatPartners = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;
        const messages=await Message.find({
            $or:[{senderId:loggedInUserId},{receiverId:loggedInUserId}]
        }).sort({ createdAt: -1 });
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

        // Aggregate unseen counts for the logged-in user
        const unseenCounts = await Message.aggregate([
          { $match: { receiverId: loggedInUserId, seen: false } },
          { $group: { _id: "$senderId", count: { $sum: 1 } } }
        ]);

        const unseenMap = {};
        unseenCounts.forEach(item => {
          unseenMap[item._id.toString()] = item.count;
        });

        const partnersWithUnseen = chatPartners.map(partner => {
          const partnerObj = partner.toObject();
          partnerObj.unseenCount = unseenMap[partner._id.toString()] || 0;
          return partnerObj;
        });

        // Maintain the order of chatPartnerIds
        const partnerMap = {};
        partnersWithUnseen.forEach(partner => {
            partnerMap[partner._id.toString()] = partner;
        });

        const orderedPartners = chatPartnerIds
            .map(id => partnerMap[id])
            .filter(Boolean);

        res.status(200).json({ chatPartners: orderedPartners });
    } catch (error) {
        console.error("Get All Chat Partners Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
}

export const markMessagesAsSeen = async (req, res) => {
  try {
    const { id: senderId } = req.params;
    const receiverId = req.user._id;

    await Message.updateMany(
      { senderId, receiverId, seen: false },
      { $set: { seen: true } }
    );

    const senderSocketId = getReceiverSocketId(senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("messagesMarkedAsSeen", {
        senderId,
        receiverId,
      });
    }

    res.status(200).json({ message: "Messages marked as seen" });
  } catch (error) {
    console.error("Mark Messages As Seen Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
