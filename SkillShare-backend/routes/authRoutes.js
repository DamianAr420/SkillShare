import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/User.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { uploadAvatar } from "../middleware/upload.js";
import cloudinary from "../config/cloudinary.js";

dotenv.config();
const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { name, password } = req.body;

    if (!name || !password) {
      return res.status(400).json({ message: "Missing name or password" });
    }

    const existingUser = await User.findOne({ name });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, password: hashedPassword });

    res
      .status(201)
      .json({ message: "User created successfully", userId: user._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { name, password } = req.body;

    const user = await User.findOne({ name });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user._id, name: user.name },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.json({ message: "Login successful", token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/check-name", async (req, res) => {
  try {
    const { name } = req.query;
    if (!name || typeof name !== "string") {
      return res.status(400).json({ message: "Invalid name" });
    }

    const exists = await User.exists({ name });
    return res.json({ available: !exists });
  } catch (err) {
    console.error("Check name error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("❌ Error while fetching user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.put(
  "/update",
  authMiddleware,
  uploadAvatar.single("avatar"),
  async (req, res) => {
    try {
      const userId = req.user.userId;
      const { name, desc, email, phone, password } = req.body;

      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      if (req.file && user.avatarUrl) {
        const publicId = user.avatarUrl.split("/").pop().split(".")[0];
        try {
          await cloudinary.uploader.destroy(`avatars/${publicId}`);
        } catch (err) {
          console.warn("⚠️ Failed to delete old avatar:", err.message);
        }
      }

      if (name) user.name = name;
      if (desc) user.desc = desc;
      if (email) user.email = email;
      if (phone) user.phone = phone;

      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
      }

      if (req.file && req.file.path) {
        user.avatarUrl = req.file.path;
      }

      await user.save();

      const userResponse = user.toObject();
      delete userResponse.password;

      res.json({
        message: "Profile updated successfully",
        user: userResponse,
      });
    } catch (err) {
      console.error("❌ Update user error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export default router;
