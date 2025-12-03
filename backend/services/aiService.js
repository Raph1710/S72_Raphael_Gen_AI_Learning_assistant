import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

// Initialize client with your API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Choose model (update name if you want gemini-2.0-flash-exp or gemini-1.5-pro etc.)
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  generationConfig: {
    temperature: 0.7, // controls creativity (0 = focused, 1+ = more random)
    topP: 0.9,        // nucleus sampling
    topK: 40,         // limits token sampling choices
    maxOutputTokens: 4096, // cap output length
  },
});

export async function askGemini(prompt) {
  try {
    const result = await model.generateContent(prompt);

    // Extract response text
    const text = result.response.text();

    // Check for usage metadata
    if (result.response.usageMetadata) {
      console.log("Token usage:", result.response.usageMetadata);
    }

    return text || "Sorry, I couldn’t generate a response.";
  } catch (error) {
    console.error("askGemini error:", error);
    throw error;
  }
}
