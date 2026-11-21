import mongoose from "mongoose";

const interactionLogSchema = new mongoose.Schema({
  messageId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, default: null }, // null = anonymous
  prompt: { type: String, required: true },
  response: { type: String, required: true },
  context: {
    url: { type: String, default: null },
    mode: { type: String, default: null }, // "url" | "text" | null
  },
  feedback: {
    rating: { type: Number, default: null }, // 1 = thumbs up, -1 = thumbs down
    ratedAt: { type: Date, default: null },
  },
  reflection: {
    errorType: { type: String, default: null }, // e.g. "too_verbose", "incorrect_info"
    fix: { type: String, default: null },
    ranAt: { type: Date, default: null },
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("InteractionLog", interactionLogSchema);
