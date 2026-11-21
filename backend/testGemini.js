import { askGemini } from "./services/aiService.js";

try {
  const res = await askGemini("Say hello in one short sentence.");
  console.log("SUCCESS! Output:\n", res);
} catch (err) {
  console.error("TEST FAILED:", err.message);
}
