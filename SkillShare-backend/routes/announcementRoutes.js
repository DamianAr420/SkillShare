import express from "express";
import mongoose from "mongoose";
import Announcement from "../models/Announcement.js";
import Category from "../models/Category.js";
import User from "../models/User.js";
import { uploadAnnouncement } from "../middleware/upload.js";
import cloudinary from "../config/cloudinary.js";

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
    const { category, minPrice, maxPrice, sort, search, location, type } =
      req.query;

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

    if (type && (type === "offer" || type === "search")) {
      query.type = type;
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

router.post("/add", uploadAnnouncement.single("image"), async (req, res) => {
  try {
    const { title, desc, price, location, category, user, type } = req.body;

    if (!title || !desc || !category || !user || !type) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!["offer", "search"].includes(type)) {
      return res.status(400).json({ message: "Invalid announcement type" });
    }

    let categoryId = null;
    if (mongoose.Types.ObjectId.isValid(category)) {
      categoryId = category;
    } else {
      const foundCategory = await Category.findOne({ name: category });
      if (!foundCategory)
        return res.status(404).json({ message: "Category not found" });
      categoryId = foundCategory._id;
    }

    const imageUrl = req.file?.path || "";

    const newAnnouncement = new Announcement({
      title,
      desc,
      price,
      location,
      imageUrl,
      category: categoryId,
      user,
      type,
    });

    await newAnnouncement.save();

    const populated = await newAnnouncement.populate([
      { path: "user", select: "name email" },
      { path: "category", select: "name" },
    ]);

    res.status(201).json({
      message: "Announcement created successfully",
      announcement: populated,
    });
  } catch (error) {
    console.error("Error adding announcement:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    if (announcement.imageUrl) {
      try {
        const urlParts = announcement.imageUrl.split("/");
        const fileName = urlParts[urlParts.length - 1].split(".")[0];
        const publicId = `announcements/${fileName}`;

        await cloudinary.uploader.destroy(publicId);
        console.log(`🗑️ Deleted image from Cloudinary: ${publicId}`);
      } catch (cloudErr) {
        console.error("⚠️ Failed to delete image from Cloudinary:", cloudErr);
      }
    }

    await Announcement.findByIdAndDelete(req.params.id);

    const objId = new mongoose.Types.ObjectId(req.params.id);
    await User.updateMany(
      { watchlist: objId },
      { $pull: { watchlist: objId } }
    );

    res.json({ message: "Announcement and image deleted successfully" });
  } catch (error) {
    console.error("Error deleting announcement:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/user/:userId", async (req, res) => {
  try {
    const announcements = await Announcement.find({ user: req.params.userId })
      .populate("category", "name")
      .sort({ createdAt: -1 });

    res.json(announcements);
  } catch (error) {
    console.error("Error fetching user announcements:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const ann = await Announcement.findById(req.params.id)
      .populate("category", "name")
      .populate("user", "name email phone");

    if (!ann)
      return res.status(404).json({ message: "Announcement not found" });
    res.json(ann);
  } catch (error) {
    console.error("Error fetching announcement:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/byIds", async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.json([]);
    }

    const announcements = await Announcement.find({ _id: { $in: ids } })
      .populate("category", "name")
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json(announcements);
  } catch (err) {
    console.error("❌ Error fetching announcements by IDs:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/:id", uploadAnnouncement.single("image"), async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    // Przygotowanie danych do aktualizacji
    const updateData = {
      title: req.body.title,
      desc: req.body.desc,
      price: req.body.price,
      location: req.body.location,
      category: req.body.category,
    };

    // Jeśli wysłano nowe zdjęcie
    if (req.file) {
      // Usuń stare zdjęcie z Cloudinary, jeśli istnieje
      if (
        announcement.imageUrl &&
        announcement.imageUrl.includes("cloudinary")
      ) {
        try {
          const urlParts = announcement.imageUrl.split("/");
          const fileName = urlParts[urlParts.length - 1].split(".")[0];
          const publicId = `announcements/${fileName}`;

          await cloudinary.uploader.destroy(publicId);
          console.log("🗑️ Old image removed:", publicId);
        } catch (deleteErr) {
          console.error("Failed to delete old image:", deleteErr);
        }
      }

      // Dodaj nowe zdjęcie z cloudinary
      updateData.imageUrl = req.file.path;
    }

    const updated = await Announcement.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )
      .populate("category", "name")
      .populate("user", "name email phone");

    res.json({
      message: "Announcement updated successfully",
      announcement: updated,
    });
  } catch (err) {
    console.error("Error updating announcement:", err);
    res.status(500).json({ error: "Update failed" });
  }
});

export default router;
