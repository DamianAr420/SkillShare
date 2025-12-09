import mongoose from "mongoose";

const viewLogSchema = new mongoose.Schema({
  listingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Announcement",
    required: true,
  },
  ip: { type: String, required: true },
  lastView: { type: Date, required: true },
});

export default mongoose.model("ViewLog", viewLogSchema);
