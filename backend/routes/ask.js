import express from "express";
import { askGemini } from "../services/aiService.js";
import axios from "axios";
import { JSDOM } from "jsdom";
import { randomUUID } from "crypto";
import InteractionLog from "../model/interactionLog.js";
import UserPreference from "../model/userPreference.js";

const router = express.Router();

// 🧠 In-memory chat store (structure: { sessionId: [{ role, message }] })
const chatSessions = {};

// 🆕 Helper: Save message in chat session
function saveToChat(sessionId, role, message) {
  if (!chatSessions[sessionId]) chatSessions[sessionId] = [];
  chatSessions[sessionId].push({ role, message });

  // Optional: limit history size to prevent overload
  if (chatSessions[sessionId].length > 25) {
    chatSessions[sessionId] = chatSessions[sessionId].slice(-25);
  }
}

// 🆕 Route to start or resume a chat session
router.post("/start", (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) {
    // Generate a new session ID
    const newSessionId = "session_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8);
    chatSessions[newSessionId] = [];
    return res.json({ sessionId: newSessionId, message: "New chat session started." });
  } else {
    if (!chatSessions[sessionId]) chatSessions[sessionId] = [];
    return res.json({ sessionId, message: "Chat session resumed." });
  }
});

// 🆕 Route to get chat history
router.get("/history/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  if (!chatSessions[sessionId]) return res.status(404).json({ error: "Session not found" });
  res.json({ sessionId, history: chatSessions[sessionId] });
});

// 🆕 Route to clear a chat session
router.delete("/clear/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  delete chatSessions[sessionId];
  res.json({ message: `Session ${sessionId} cleared.` });
});

// 💬 Existing /ask logic — now extended with chat session context
router.post("/ask", async (req, res) => {
  let { question, url, content, prompt, context, sessionId, userId } = req.body;

  // 🔄 Handle the frontend's "context" field
  if (context && !url && !content) {
    if (context.startsWith("Based on this URL:")) {
      url = context.replace("Based on this URL:", "").trim();
    } else if (context.startsWith("Based on this content:")) {
      content = context.replace("Based on this content:", "").trim();
    }
  }

  // 🧩 Handle frontend payload (messages array)
  if (req.body.messages && Array.isArray(req.body.messages)) {
    const msgs = req.body.messages;
    const lastUserMsg = msgs.reverse().find(m => m.role === "user");
    if (lastUserMsg) question = lastUserMsg.content;
    const systemMsg = msgs.find(m => m.role === "system");
    if (systemMsg) {
      if (systemMsg.content.startsWith("Based on this URL:")) {
        url = systemMsg.content.replace("Based on this URL:", "").trim();
      } else if (systemMsg.content.startsWith("Based on this content:")) {
        content = systemMsg.content.replace("Based on this content:", "").trim();
      }
    }
  }

  if (!question && !prompt) {
    return res.status(400).json({ error: "Question or prompt is required" });
  }

  // 🧠 Load user preference profile and build a system prefix
  let systemPrefix = "";
  if (userId) {
    try {
      const prefs = await UserPreference.findOne({ userId });
      if (prefs) {
        const hints = [];
        if (prefs.style === "concise") hints.push("Keep answers concise and to the point.");
        if (prefs.style === "detailed") hints.push("Provide thorough, detailed answers.");
        if (prefs.format === "structured") hints.push("Always use structured formatting with headers and bullet points.");
        if (prefs.format === "prose") hints.push("Write in flowing prose rather than bullet points.");
        if (prefs.likesExamples === true) hints.push("Include practical examples whenever helpful.");
        if (prefs.detailTolerance === "low") hints.push("Be brief — avoid long explanations.");
        if (prefs.detailTolerance === "high") hints.push("Go deep — the user appreciates thorough explanations.");
        if (prefs.rules?.length > 0) hints.push(...prefs.rules);
        if (hints.length > 0) {
          systemPrefix = `[User preferences — follow these strictly]\n${hints.map(h => `- ${h}`).join("\n")}\n\n`;
        }
      }
    } catch (e) {
      console.error("Failed to load user preferences:", e);
    }
  }

  try {
    let finalPrompt;
    let webContent = "";

    // 1️⃣ Zero-shot: only question provided
    if (question && !url && !content && !prompt) {
      finalPrompt = `Answer the following question clearly and concisely, using unordered (•) and ordered (1., 2., 3.) lists when appropriate. 
      Use minimal and relevant emojis to highlight points. 
      Question: ${question}`;
    }
    // 2️⃣ If prompt provided
    else if (prompt) {
      const urlMatch = prompt.match(/Based on this URL: (https?:\/\/[^\s\n]+)/);
      if (urlMatch) {
        const extractedUrl = urlMatch[1];
        try {
          webContent = await fetchWebContent(extractedUrl);
          const userQuestion = prompt.replace(/\nBased on this URL: https?:\/\/[^\s\n]+/, '');
          finalPrompt = `Read the following webpage content and answer the question clearly. 
          Use unordered (•) and ordered (1., 2., 3.) lists for readability, and sprinkle minimal, relevant emojis. 
          Do not invent false or fake information but certainly add relevant information and details if needed.
          Webpage Content: ${webContent}
          Question: ${userQuestion}`;
        } catch (error) {
          console.error("Failed to fetch web content:", error);
          finalPrompt = prompt + "\n(Note: Unable to fetch webpage content)";
        }
      } else if (prompt.includes("Based on this content:")) {
        const parts = prompt.split("Based on this content:");
        const userQuestion = parts[0].trim();
        const providedContent = parts[1]?.trim() || "";

        finalPrompt = `Use the following content to answer the question clearly and in a structured way. 
        Use unordered (•) and ordered (1., 2., 3.) lists, and minimal relevant emojis to make the answer easier to read. 
        Content: ${providedContent}
        Question: ${userQuestion}`;
      } else {
        finalPrompt = prompt;
      }
    }
    // 3️⃣ If url or content provided
    else {
      let contextData = "";

      if (url) {
        try {
          webContent = await fetchWebContent(url);
          contextData += `Webpage Content:\n${webContent}\n\n`;
        } catch (error) {
          console.error("Failed to fetch web content:", error);
          contextData += `(Note: Unable to fetch webpage content from ${url})\n\n`;
        }
      }

      if (content) {
        contextData += `Content:\n${content}\n\n`;
      }

      finalPrompt = `Read the following information and answer the question clearly.
      Use unordered (•) and ordered (1., 2., 3.) lists, with minimal emojis to highlight important points.
      ${contextData}
      Question: ${question}`;
    }

    // 🧩 Add conversation history context (if session exists)
    let historyContext = "";
    if (sessionId && chatSessions[sessionId]) {
      const history = chatSessions[sessionId]
        .map(msg => `${msg.role === "user" ? "User" : "AI"}: ${msg.message}`)
        .join("\n");
      historyContext = `This is an ongoing chat. Previous messages:\n${history}\nNow, continue the conversation below:\n`;
    }

    const combinedPrompt = systemPrefix + historyContext + finalPrompt;

    // 💬 Ask AI
    const answer = await askGemini(combinedPrompt);

    // 🧠 Save to session memory
    if (sessionId) {
      saveToChat(sessionId, "user", question || prompt || "");
      saveToChat(sessionId, "ai", answer);
    }

    // 💾 Persist interaction to MongoDB
    const messageId = randomUUID();
    InteractionLog.create({
      messageId,
      userId: userId || null,
      prompt: question || prompt || "",
      response: answer,
      context: { url: url || null, mode: url ? "url" : content ? "text" : null },
    }).catch(err => console.error("Failed to save interaction log:", err));

    res.json({ answer, sessionId, messageId });
  } catch (err) {
    console.error("Ask route error:", err);
    // Pass through 429 quota errors so the frontend can show the right message
    if (err.status === 429 || (err.message && err.message.includes("429"))) {
      return res.status(429).json({ error: "Quota exceeded. Please wait before sending another message." });
    }
    res.status(500).json({ error: err.message });
  }
});

// 🧠 Generate Randomized Quiz Questions
router.post("/quiz", async (req, res) => {
  const { url, content, numQuestions = 5, difficulty = "medium" } = req.body;

  if (!url && !content) {
    return res.status(400).json({ error: "Either URL or content is required to generate a quiz." });
  }

  const difficultyInstructions = {
    easy: `
- Ask only about facts that are directly and explicitly stated in the text.
- Use simple, clear language with no ambiguity.
- Wrong answer options should be obviously incorrect to anyone who read the text.
- Example question style: "According to the article, what is X?" or "Which of the following is mentioned as Y?"`,
    medium: `
- Mix direct recall questions with questions that require the reader to connect two ideas from the text.
- Some wrong options should be plausible but clearly distinguishable on careful reading.
- Example question style: "Why does the author suggest X?" or "What is the relationship between X and Y?"`,
    hard: `
- Focus on inference, implication, and critical analysis — NOT surface-level facts.
- Questions should require the reader to reason about what the text implies, not just what it states.
- All four answer options must be plausible; wrong options should be things a careless reader might believe.
- Include questions about the author's intent, logical conclusions, comparisons, or what would happen if a detail changed.
- Example question style: "What can be inferred from the author's claim about X?" or "Which conclusion is best supported by the evidence in the passage?"`,
  };

  const difficultyGuide = difficultyInstructions[difficulty] || difficultyInstructions.medium;

  try {
    // 1️⃣ Fetch or use provided content
    let webContent = content || "";
    if (url) {
      try {
        webContent = await fetchWebContent(url);
      } catch (error) {
        console.error("Failed to fetch web content:", error);
        return res.status(500).json({ error: "Failed to fetch content from the provided URL." });
      }
    }

    // 2️⃣ Build AI prompt
    const randomSeed = Math.random().toString(36).substring(2, 8);
    const quizPrompt = `You are a quiz master generating a ${difficulty.toUpperCase()} difficulty quiz.

DIFFICULTY RULES FOR ${difficulty.toUpperCase()}:
${difficultyGuide}

TASK:
Create exactly ${numQuestions} multiple-choice questions based on the article below.
Each question must have exactly 4 answer options and one correct answer.
Strictly follow the difficulty rules above — the questions must feel noticeably ${difficulty === "easy" ? "simple and factual" : difficulty === "medium" ? "moderately challenging" : "difficult and analytical"}.
Do not mix difficulty levels. Every question must match the ${difficulty.toUpperCase()} standard.
Random seed (for variety): ${randomSeed}

OUTPUT FORMAT — respond with ONLY a valid JSON array, no extra text:
[
  {
    "question": "...",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "Option A"
  }
]

ARTICLE:
${webContent.substring(0, 8000)}`;

    // 3️⃣ Ask the AI
    const aiResponse = await askGemini(quizPrompt);

    // 4️⃣ Parse response safely
    let quizData;
    try {
      quizData = JSON.parse(aiResponse);
    } catch {
      // Attempt to extract JSON if AI includes extra text
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      quizData = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    }

    // 5️⃣ Validate structure
    if (!Array.isArray(quizData) || quizData.length === 0) {
      return res.status(500).json({
        error: "Failed to generate valid quiz questions.",
        rawResponse: aiResponse,
      });
    }

    res.json({
      quiz: quizData,
      totalQuestions: quizData.length,
      difficulty,
      note: "Questions are randomized each time."
    });

  } catch (err) {
    console.error("Quiz generation error:", err);
    if (err.status === 429 || (err.message && err.message.includes("429"))) {
      return res.status(429).json({ error: "Quota exceeded. Please wait before sending another message." });
    }
    res.status(500).json({ error: err.message });
  }
});

// Helper function to fetch and extract text from webpage
async function fetchWebContent(url) {
  const response = await axios.get(url, {
    timeout: 10000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  
  const dom = new JSDOM(response.data);
  const document = dom.window.document;
  
  // Remove script and style elements
  const scripts = document.querySelectorAll('script, style');
  scripts.forEach(script => script.remove());
  
  // Extract text content
  const textContent = document.body.textContent || document.body.innerText || '';
  
  // Clean up whitespace and limit length
  return textContent
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 10000); // Limit to prevent token overflow
}

export default router;