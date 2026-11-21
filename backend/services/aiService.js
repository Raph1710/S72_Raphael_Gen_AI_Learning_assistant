import dotenv from "dotenv";
import Groq from "groq-sdk";
import path from "path";
import { fileURLToPath } from "url";

// Ensure .env is loaded regardless of the process working directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config(); // fallback to current dir if present

function sanitizeApiKey(key) {
  if (!key) return "";
  return key.replace(/^["']|["']$/g, "").trim();
}

let groqClient = null;

function getGroqClient() {
  const apiKey = sanitizeApiKey(process.env.GROQ_API_KEY);
  if (!apiKey) {
    const error = new Error("GROQ_API_KEY is missing or empty in backend/.env. Please configure a valid API key.");
    error.status = 401;
    throw error;
  }
  if (!groqClient || groqClient.apiKey !== apiKey) {
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

// Fallback sequence of available Groq models
const MODEL_PRIORITY = [
  process.env.GROQ_MODEL,
  "qwen/qwen3.8-27b",
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b"
].filter(Boolean);

export async function askGemini(prompt) {
  const client = getGroqClient();
  let lastError = null;

  for (const model of MODEL_PRIORITY) {
    try {
      const response = await client.chat.completions.create({
        model,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2048,
      });

      if (!response.choices || response.choices.length === 0) {
        throw new Error(`No choices returned by Groq model ${model}`);
      }

      return response.choices[0].message.content;
    } catch (err) {
      // If 404 (model not found / deprecated name), try the next model in the fallback chain
      if (err.status === 404 || (err.message && err.message.includes("model_not_found"))) {
        console.warn(`[Groq Warning] Model "${model}" not found on your account. Trying next model...`);
        lastError = err;
        continue;
      }

      // If 401 authentication error, fail immediately with clear diagnostic
      if (err.status === 401 || (err.message && (err.message.includes("401") || err.message.includes("Invalid API Key") || err.message.includes("invalid_api_key")))) {
        const authErr = new Error("Invalid or expired GROQ_API_KEY in backend/.env. Please verify your API key.");
        authErr.status = 401;
        throw authErr;
      }

      console.error(`Error with model ${model}:`, err.message || err);
      throw err;
    }
  }

  throw lastError || new Error("All Groq models failed to generate a response.");
}
