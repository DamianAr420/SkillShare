import express from "express";
import Conversation from "../models/Conversation.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { io } from "../socket.js";

const router = express.Router();

router.get("/conversations", authMiddleware, async (req, res) => {
  const userId = req.user.userId;

  const conversations = await Conversation.find({
    participants: userId,
  }).populate("participants", "name avatarUrl lastSeen");

  const result = conversations.map((conv) => {
    const unreadCount = conv.messages.filter(
      (msg) => !msg.readBy.includes(userId)
    ).length;

    return {
      ...conv.toObject(),
      unreadCount,
    };
  });

  res.json(result);
});

router.get("/conversations/:id", authMiddleware, async (req, res) => {
  const userId = req.user.userId;
  const conv = await Conversation.findOne({
    _id: req.params.id,
    participants: userId,
  }).populate("participants", "name avatarUrl lastSeen");

  if (!conv)
    return res.status(403).json({ message: "Access denied or not found" });

  const unreadCount = conv.messages.filter(
    (m) => !m.readBy.includes(req.user.userId)
  ).length;

  res.json({ ...conv.toObject(), unreadCount });
});

router.get("/conversations/:id/messages", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const conversation = await Conversation.findById(id);
  if (!conversation)
    return res.status(404).json({ message: "Conversation not found" });
  res.json(conversation.messages);
});

router.post("/conversations", authMiddleware, async (req, res) => {
  const { participantId } = req.body;
  const userId = req.user.userId;

  let conversation = await Conversation.findOne({
    participants: { $all: [userId, participantId] },
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [userId, participantId],
      messages: [],
    });
  }

  res.json(conversation);
});

router.post("/conversations/:id/messages", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const userId = req.user.userId;

  const conversation = await Conversation.findOne({
    _id: id,
    participants: userId,
  });
  if (!conversation)
    return res
      .status(403)
      .json({ message: "Access denied or conversation not found" });

  const message = {
    senderId: userId,
    content,
    readBy: [userId],
    createdAt: new Date(),
  };

  conversation.messages.push(message);
  await conversation.save();

  const savedMessage = conversation.messages[conversation.messages.length - 1];

  const payload = {
    ...savedMessage.toObject(),
    conversationId: id,
  };

  if (!io) {
    return res.status(500).json({ message: "Socket not initialized" });
  }

  console.log(
    `[REST] Sending 'newMessage' to room: ${id} with payload:`,
    payload.content
  );

  io.to(id).emit("newMessage", payload);

  const recipientIds = conversation.participants.filter(
    (participantId) => participantId.toString() !== userId.toString()
  );

  recipientIds.forEach((recipientId) => {
    console.log(
      `[REST] Also sending 'newMessage' to private user channel: ${recipientId}`
    );
    io.to(recipientId.toString()).emit("newMessage", payload);
  });

  res.json(payload);
});

router.delete("/conversations/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  const conversation = await Conversation.findOne({
    _id: id,
    participants: userId,
  });

  if (!conversation) {
    return res.status(404).json({ message: "Conversation not found" });
  }

  await Conversation.deleteOne({ _id: id });

  res.json({ success: true });
});

router.post(
  "/conversations/:id/mark-read",
  authMiddleware,
  async (req, res) => {
    const userId = req.user.userId;
    const { id } = req.params;

    const conversation = await Conversation.findById(id);
    if (!conversation)
      return res.status(404).json({ message: "Conversation not found" });

    let updated = false;

    conversation.messages.forEach((msg) => {
      if (!msg.readBy.includes(userId)) {
        msg.readBy.push(userId);
        updated = true;
      }
    });

    if (updated) {
      await conversation.save();

      if (!io) {
        return res.status(500).json({ message: "Socket not initialized" });
      }

      io.to(id).emit("messagesRead", {
        conversationId: id,
        userId,
      });
    }

    res.json({ success: true });
  }
);

export default router;
