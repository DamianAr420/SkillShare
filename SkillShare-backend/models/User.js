import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    desc: { type: String },
    avatarUrl: { type: String },
    email: { type: String, unique: true },
    phone: { type: String, unique: true },
    watchlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Announcement" }],
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
