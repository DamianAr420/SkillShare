import express from "express";
import mongoose from "mongoose";
import Announcement from "../models/Announcement.js";
import Category from "../models/Category.js";
import User from "../models/User.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .populate("category", "name")
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    res.json(announcements);
  } catch (error) {
    console.error("Error fetching announcements:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/latest", async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .populate("category", "name")
      .populate("user", "name")
      .sort({ createdAt: -1 })
      .limit(5);

    res.json(announcements);
  } catch (error) {
    console.error("Error fetching latest announcements:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/filter", async (req, res) => {
  try {
    const { category, minPrice, maxPrice, sort, search, location } = req.query;

    const query = {};

    if (category) {
      const foundCategory = await Category.findOne({ name: category });
      if (foundCategory) query.category = foundCategory._id;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (location) {
      query.location = { $regex: location, $options: "i" };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    let sortOption = {};
    if (sort === "newest") sortOption = { createdAt: -1 };
    else if (sort === "oldest") sortOption = { createdAt: 1 };
    else if (sort === "priceAsc") sortOption = { price: 1 };
    else if (sort === "priceDesc") sortOption = { price: -1 };

    const announcements = await Announcement.find(query)
      .populate("category", "name")
      .populate("user", "name")
      .sort(sortOption);

    res.json(announcements);
  } catch (error) {
    console.error("Error filtering announcements:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/add", upload.single("image"), async (req, res) => {
  try {
    const { title, desc, price, location, category, user } = req.body;

    if (!title || !desc || !price || !category || !user) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const imageUrl = req.file?.path || "";

    const newAnnouncement = new Announcement({
      title,
      desc,
      price,
      location,
      imageUrl,
      category,
      user,
    });

    await newAnnouncement.save();

    res.status(201).json({
      message: "Announcement created successfully",
      announcement: await newAnnouncement.populate("user", "name email"),
    });
  } catch (error) {
    console.error("Error adding announcement:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ message: "Announcement deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
