import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

export const createUploader = (folderName) => {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: folderName,
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
    },
  });

  return multer({ storage });
};

export const uploadAnnouncement = createUploader("announcements");

export const uploadAvatar = createUploader("avatars");
