import mongoose from "mongoose";

const userPreferenceSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  // Accumulated style preferences derived from feedback
  style: { type: String, default: null },       // "concise" | "detailed"
  format: { type: String, default: null },      // "structured" | "prose"
  likesExamples: { type: Boolean, default: null },
  detailTolerance: { type: String, default: null }, // "low" | "medium" | "high"
  // Raw counts used to derive the above
  thumbsUp: { type: Number, default: 0 },
  thumbsDown: { type: Number, default: 0 },
  // Accumulated fix rules from reflection passes
  rules: { type: [String], default: [] }, // e.g. ["Prefer bullet summaries under 5 points"]
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("UserPreference", userPreferenceSchema);
