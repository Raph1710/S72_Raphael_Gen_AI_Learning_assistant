import dotenv from "dotenv";
import Groq from "groq-sdk";

dotenv.config();

const key = (process.env.GROQ_API_KEY || "").replace(/^["']|["']$/g, "").trim();
const client = new Groq({ apiKey: key });

const difficulty = "medium";
const prompt = `You are a quiz master generating a ${difficulty.toUpperCase()} difficulty quiz.

TASK:
Create exactly 5 multiple-choice questions based on the article below.
Each question must have exactly 4 answer options, one correct answer, and a brief explanation (1-2 sentences) stating why that option is correct according to the text.
DO NOT include any emojis anywhere in the response.

Respond with a JSON object following this exact structure:
{
  "quiz": [
    {
      "question": "...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "Option A",
      "explanation": "..."
    }
  ]
}

ARTICLE:
Artificial intelligence (AI) is the intelligence of machines or software, as opposed to the intelligence of living beings, primarily of humans. It is a field of study in computer science that develops and studies intelligent machines. Such machines may be called AIs. AI technology is widely used throughout industry, government, and science. Some high-profile applications include advanced web search engines (e.g., Google Search), recommendation systems (used by YouTube, Amazon, and Netflix), interacting via human speech (such as Google Assistant, Siri, and Alexa), autonomous vehicles (e.g., Waymo), generative and creative tools (ChatGPT and AI art), and superhuman play and analysis in strategy games (such as chess and Go).`;

try {
  const res = await client.chat.completions.create({
    model: "qwen/qwen3.8-27b",
    messages: [
      { role: "system", content: "You are an expert quiz generator that outputs only valid JSON objects." },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
    max_tokens: 3000,
  });

  const content = res.choices[0].message.content;
  console.log("RAW CONTENT LENGTH:", content.length);
  const parsed = JSON.parse(content);
  console.log("SUCCESS! Parsed quiz length:", parsed.quiz?.length);
  console.log("First question:", parsed.quiz[0].question);
  console.log("First explanation:", parsed.quiz[0].explanation);
} catch (err) {
  console.error("FAILED:", err.message);
}
