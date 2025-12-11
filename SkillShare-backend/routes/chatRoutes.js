import express from "express";
import Conversation from "../models/Conversation.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Pobierz wszystkie konwersacje użytkownika
router.get("/conversations", authMiddleware, async (req, res) => {
  const userId = req.user.userId;
  const conversations = await Conversation.find({
    participants: userId,
  }).populate("participants", "name avatarUrl lastSeen");
  res.json(conversations);
});

// Pobierz wiadomości z konwersacji
router.get("/conversations/:id/messages", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const conversation = await Conversation.findById(id);
  if (!conversation)
    return res.status(404).json({ message: "Conversation not found" });
  res.json(conversation.messages);
});

// Utwórz nową konwersację
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

// Wyślij wiadomość
router.post("/conversations/:id/messages", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const userId = req.user.userId;

  const conversation = await Conversation.findById(id);
  if (!conversation)
    return res.status(404).json({ message: "Conversation not found" });

  const message = { senderId: userId, content };
  conversation.messages.push(message);
  await conversation.save();

  const savedMessage = conversation.messages[conversation.messages.length - 1];

  res.json(savedMessage);
});

// Usuń konwersację
router.delete("/conversations/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  // rozmowę może usunąć tylko uczestnik
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

export default router;
