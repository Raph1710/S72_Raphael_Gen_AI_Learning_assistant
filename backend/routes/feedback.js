import express from "express";
import { askGemini } from "../services/aiService.js";
import InteractionLog from "../model/interactionLog.js";
import UserPreference from "../model/userPreference.js";

const router = express.Router();

// ─── POST /api/feedback ───────────────────────────────────────────────────────
// Save a thumbs up/down rating for a message.
// On thumbs-down, asynchronously run a reflection pass and update user prefs.
router.post("/feedback", async (req, res) => {
  const { messageId, rating, userId } = req.body; // rating: 1 or -1

  if (!messageId || ![1, -1].includes(rating)) {
    return res.status(400).json({ error: "messageId and rating (1 or -1) are required." });
  }

  try {
    const log = await InteractionLog.findOneAndUpdate(
      { messageId },
      { "feedback.rating": rating, "feedback.ratedAt": new Date() },
      { new: true }
    );

    if (!log) return res.status(404).json({ error: "Interaction not found." });

    // Update thumbs counts on user preference profile
    if (userId) {
      const inc = rating === 1 ? { thumbsUp: 1 } : { thumbsDown: 1 };
      await UserPreference.findOneAndUpdate(
        { userId },
        { $inc: inc, updatedAt: new Date() },
        { upsert: true, new: true }
      );
    }

    // Respond immediately — reflection runs in the background
    res.json({ ok: true });

    // ── Reflection pass (only on thumbs-down) ────────────────────────────────
    if (rating === -1) {
      runReflection(log, userId).catch((err) =>
        console.error("Reflection error:", err)
      );
    }
  } catch (err) {
    console.error("Feedback error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/preferences/:userId ────────────────────────────────────────────
router.get("/preferences/:userId", async (req, res) => {
  try {
    const prefs = await UserPreference.findOne({ userId: req.params.userId });
    res.json(prefs || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Reflection helper ────────────────────────────────────────────────────────
async function runReflection(log, userId) {
  const reflectionPrompt = `You are an AI quality reviewer. Analyze this interaction and classify what went wrong.

USER PROMPT:
${log.prompt}

ASSISTANT RESPONSE:
${log.response}

USER FEEDBACK: thumbs down (negative)

Classify the primary failure. Choose ONE from:
- too_verbose (response was too long or padded)
- too_brief (response lacked necessary detail)
- incorrect_info (factually wrong or hallucinated)
- misunderstood_question (answered the wrong thing)
- poor_formatting (hard to read, badly structured)
- off_topic (drifted from what was asked)

Then write ONE short, actionable rule (max 15 words) to fix this for this user.

Respond with ONLY valid JSON, no extra text:
{
  "error_type": "...",
  "fix": "..."
}`;

  try {
    const raw = await askGemini(reflectionPrompt);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return;

    const { error_type, fix } = JSON.parse(jsonMatch[0]);
    if (!error_type || !fix) return;

    // Save reflection result on the log
    await InteractionLog.findOneAndUpdate(
      { messageId: log.messageId },
      {
        "reflection.errorType": error_type,
        "reflection.fix": fix,
        "reflection.ranAt": new Date(),
      }
    );

    // Accumulate the fix rule into the user's preference profile (max 10 rules)
    if (userId) {
      const prefs = await UserPreference.findOne({ userId });
      const existingRules = prefs?.rules || [];
      if (!existingRules.includes(fix)) {
        const updatedRules = [...existingRules, fix].slice(-10);
        await UserPreference.findOneAndUpdate(
          { userId },
          { rules: updatedRules, updatedAt: new Date() },
          { upsert: true }
        );
      }
    }

    console.log(`✅ Reflection complete [${error_type}]: ${fix}`);
  } catch (err) {
    console.error("Reflection parse error:", err);
  }
}

export default router;
