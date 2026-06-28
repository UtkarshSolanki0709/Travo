import express from "express";
import { getAllContacts,getMessagesByUserId,sendMessage,getAllChatPartners,markMessagesAsSeen,getUploadSignature } from "../controllers/message.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";

const router= express.Router();
router.use(arcjetProtection,protectRoute);

router.get("/contacts",getAllContacts);
router.get("/chats",getAllChatPartners);
router.get("/upload-signature",getUploadSignature);
router.get("/:id",getMessagesByUserId);

router.post("/send/:id",sendMessage);
router.put("/mark-as-seen/:id",markMessagesAsSeen);
export default router;