import dotenv from "dotenv";
import Groq from "groq-sdk";

dotenv.config();

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function askGemini(prompt) {
  try {
    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2048,
    });

    return response.choices[0].message.content;
  } catch (err) {
    console.error("Groq error:", err);
    throw err;
  }
}
