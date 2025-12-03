import express from "express";
import { askGemini } from "../services/aiService.js";
import axios from "axios";
import { JSDOM } from "jsdom";

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
  let { question, url, content, prompt, sessionId } = req.body;

  // 🧩 Handle frontend payload (messages array)
  if (req.body.messages && Array.isArray(req.body.messages)) {
    const msgs = req.body.messages;
    const lastUserMsg = msgs.reverse().find(m => m.role === "user");
    if (lastUserMsg) question = lastUserMsg.content;

    // If there's system content (URL or text), handle that
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

    const combinedPrompt = historyContext + finalPrompt;

    // 💬 Ask AI
    const answer = await askGemini(combinedPrompt);

    // 🧠 Save to session memory
    if (sessionId) {
      saveToChat(sessionId, "user", question || prompt || "");
      saveToChat(sessionId, "ai", answer);
    }

    res.json({ answer, sessionId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🧠 Generate Randomized Quiz Questions
router.post("/quiz", async (req, res) => {
  const { url, content, numQuestions = 5 } = req.body;

  if (!url && !content) {
    return res.status(400).json({ error: "Either URL or content is required to generate a quiz." });
  }

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

    // 2️⃣ Build AI prompt with randomness
    const randomSeed = Math.random().toString(36).substring(2, 8);
    const quizPrompt = `
You are a quiz master. Based on the following article, create ${numQuestions} multiple-choice questions.
Each question should have exactly 4 options (A, B, C, D) and one correct answer.
Vary the difficulty and topics randomly each time, and do not repeat identical questions between runs.
Format the output strictly as JSON like this:

[
  {
    "question": "What is ...?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "Option B"
  },
  ...
]

Random seed: ${randomSeed}
Article Content:
${webContent.substring(0, 8000)}  // keep token limit safe
`;

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
      note: "Questions are randomized each time."
    });

  } catch (err) {
    console.error("Quiz generation error:", err);
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