import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import {
  AppLogo,
  RobotIllustration,
  SlidersIcon,
  ThumbUpIcon,
  ThumbDownIcon,
  CrossIcon,
  CheckIcon,
  DifficultyBadge,
} from "../components/BrutalistIcons.jsx";

// Normalise LLM output so inline • bullets become proper markdown list items.
function normalizeLLMMarkdown(text) {
  if (!text) return text;
  return text
    .split("\n")
    .map((line) => {
      if (!line.trimStart().startsWith("•") && line.includes("•")) {
        const [intro, ...parts] = line.split("•");
        const items = parts.map((p) => p.trim()).filter(Boolean);
        if (items.length > 0) {
          const introText = intro.trim();
          const listLines = items.map((item) => `- ${item}`).join("\n");
          return introText ? `${introText}\n${listLines}` : listLines;
        }
      }
      if (line.trimStart().startsWith("•")) {
        return line.replace(/^(\s*)•\s*/, "$1- ");
      }
      return line;
    })
    .join("\n");
}

// Steer commands — plain-English phrases the user can click to modify LLM behaviour
const STEER_COMMANDS = [
  { label: "Shorter", instruction: "Keep your answers brief and to the point. No long paragraphs." },
  { label: "More detail", instruction: "Provide thorough, detailed answers with full explanations." },
  { label: "Add examples", instruction: "Always include practical, concrete examples in your answers." },
  { label: "ELI5", instruction: "Explain everything as if I am 12 years old. Use simple language." },
  { label: "Bullet points", instruction: "Always format answers as bullet points. Avoid prose paragraphs." },
];

const API = "http://localhost:5000/api";

// Neo-Brutalist Collapsible Quiz History Card
function QuizHistoryCard({ msg }) {
  const [expanded, setExpanded] = useState(false);
  const percentage = msg.percentage ?? Math.round(((msg.score || 0) / (msg.totalQuestions || 1)) * 100);
  const isGreat = percentage >= 80;
  const isPass = percentage >= 60;

  return (
    <div className="flex justify-start w-full my-3">
      <div
        className="w-full max-w-2xl border-4 border-black bg-white transition-all duration-200"
        style={{
          boxShadow: expanded ? "6px 6px 0 #4f46e5" : "4px 4px 0 #000",
          borderLeft: "6px solid #4f46e5",
        }}
      >
        {/* Clickable Header Bar */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-full p-4 flex flex-wrap items-center justify-between gap-3 text-left hover:bg-indigo-50 transition-colors cursor-pointer select-none"
        >
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-black text-white font-black text-xs uppercase tracking-widest border border-black">
              Quiz
            </span>
            <span className="font-black text-sm uppercase tracking-wide text-black">
              Quiz taken at {msg.timestamp}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="px-2.5 py-0.5 border border-black font-black text-xs uppercase"
              style={{
                background: isGreat ? "#d1fae5" : isPass ? "#fef3c7" : "#fee2e2",
                color: isGreat ? "#065f46" : isPass ? "#92400e" : "#b91c1c",
              }}
            >
              Score: {msg.score}/{msg.totalQuestions}
            </div>
            <div
              className="flex items-center gap-1.5 border border-black px-2 py-0.5 text-xs font-black uppercase"
              style={{ background: "#eef0ff", color: "#1e1b4b" }}
            >
              <DifficultyBadge level={msg.difficulty || "medium"} size={14} />
              <span>{msg.difficulty || "medium"}</span>
            </div>
            <span className="font-black text-xs uppercase tracking-wider px-2 py-1 border border-black bg-white text-black hover:bg-black hover:text-white transition-colors">
              {expanded ? "Hide Details [-]" : "View Details [+]"}
            </span>
          </div>
        </button>

        {/* Expanded Content */}
        {expanded && (
          <div className="p-6 border-t-2 border-black bg-[#faf7f2]">
            {/* Score Banner */}
            <div
              className="p-4 border-2 border-black mb-6 flex items-center justify-between"
              style={{
                background: isGreat ? "#d1fae5" : isPass ? "#fef3c7" : "#fee2e2",
              }}
            >
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-black">Final Score</p>
                <p className="text-3xl font-black text-black">
                  {msg.score} <span className="text-lg font-bold text-gray-700">/ {msg.totalQuestions} ({percentage}%)</span>
                </p>
              </div>
              <div className="border-2 border-black px-4 py-2 font-black uppercase text-xs tracking-wider bg-white text-black">
                {isGreat ? "Excellent" : isPass ? "Good Job" : "Review Needed"}
              </div>
            </div>

            {/* Questions list */}
            <div className="space-y-6">
              {(msg.questions || []).map((item, qIdx) => (
                <div key={qIdx} className="border-2 border-black p-4 bg-white">
                  {/* Question title */}
                  <div className="flex items-start gap-3 mb-3">
                    <span
                      className="w-6 h-6 border-2 border-black flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                      style={{ background: item.isCorrect ? "#10b981" : "#ef4444" }}
                    >
                      {item.isCorrect ? <CheckIcon size={12} /> : <CrossIcon size={12} />}
                    </span>
                    <p className="font-black text-base text-black">
                      {item.questionNumber || qIdx + 1}. {item.question}
                    </p>
                  </div>

                  {/* Available Options */}
                  <div className="grid gap-2 pl-9 mb-4">
                    {(item.options || []).map((opt, oIdx) => {
                      const isCorrectAnswer = opt === item.correctAnswer;
                      const isUserSelection = opt === item.userAnswer;
                      let optStyle = { borderColor: "#e5e7eb", background: "#f9fafb", color: "#6b7280" };

                      if (isCorrectAnswer) {
                        optStyle = { borderColor: "#10b981", background: "#d1fae5", color: "#065f46" };
                      } else if (isUserSelection && !item.isCorrect) {
                        optStyle = { borderColor: "#ef4444", background: "#fee2e2", color: "#b91c1c", textDecoration: "line-through" };
                      }

                      return (
                        <div
                          key={oIdx}
                          className="px-3 py-2 border-2 text-xs font-bold tracking-wide flex items-center justify-between"
                          style={optStyle}
                        >
                          <span>{opt}</span>
                          <span className="flex items-center gap-1.5">
                            {isUserSelection && (
                              <span className="uppercase text-[9px] px-1.5 py-0.5 border border-black font-black bg-white text-black">
                                Your Pick
                              </span>
                            )}
                            {isCorrectAnswer && <CheckIcon size={12} />}
                            {isUserSelection && !isCorrectAnswer && <CrossIcon size={12} />}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Brief Explanation */}
                  {item.explanation && (
                    <div className="ml-9 p-3 border-2 border-black bg-indigo-50 text-indigo-950">
                      <span className="block text-[10px] font-black uppercase tracking-widest text-indigo-700 mb-1">
                        Why this is correct
                      </span>
                      <p className="text-xs font-medium leading-relaxed">
                        {item.explanation}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Landing() {
  const [mode, setMode] = useState("url");
  const [url, setUrl] = useState("");
  const [content, setContent] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState(null);
  const chatEndRef = useRef(null);
  const sidebarRef = useRef(null);
  const navigate = useNavigate();

  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [editingChatId, setEditingChatId] = useState(null);
  const [editedName, setEditedName] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);

  // Feedback state: { [messageId]: 1 | -1 }
  const [feedbackMap, setFeedbackMap] = useState({});
  // Active steer instruction for this session
  const [steerInstruction, setSteerInstruction] = useState(null);
  const [showSteer, setShowSteer] = useState(false);

  // ── Scroll to bottom ───────────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Initial load ───────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const savedChats = JSON.parse(localStorage.getItem("chats") || "[]");
      const savedCurrentId = localStorage.getItem("currentChatId");
      const savedUrl = localStorage.getItem("landing_url") || "";
      const savedContent = localStorage.getItem("landing_content") || "";
      setChats(savedChats);
      setUrl(savedUrl);
      setContent(savedContent);
      if (savedCurrentId && savedChats.length > 0) {
        const activeChat = savedChats.find((c) => c.id === savedCurrentId);
        if (activeChat) {
          setCurrentChatId(savedCurrentId);
          setMessages(activeChat.messages || []);
          setTimeout(() => {
            document.getElementById(`chat-${savedCurrentId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 200);
        }
      }
      setIsInitialized(true);
    } catch (e) {
      console.error("Failed to load chats:", e);
    }

    // Load user identity
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (user.id) setUserId(user.id);
      } catch {}
    }
  }, []);

  // ── Persistence effects ────────────────────────────────────────────────────
  useEffect(() => { if (!isInitialized) return; localStorage.setItem("chats", JSON.stringify(chats)); }, [chats, isInitialized]);
  useEffect(() => {
    if (!isInitialized) return;
    if (currentChatId) localStorage.setItem("currentChatId", currentChatId);
    else localStorage.removeItem("currentChatId");
  }, [currentChatId, isInitialized]);
  useEffect(() => { if (!isInitialized) return; localStorage.setItem("landing_url", url || ""); }, [url, isInitialized]);
  useEffect(() => { if (!isInitialized) return; localStorage.setItem("landing_content", content || ""); }, [content, isInitialized]);
  useEffect(() => {
    if (!isInitialized || !currentChatId) return;
    setChats((prev) => {
      const exists = prev.find((c) => c.id === currentChatId);
      if (!exists) return prev;
      return prev.map((c) => c.id === currentChatId ? { ...c, messages } : c);
    });
  }, [messages, currentChatId, isInitialized]);

  // ── Chat management ────────────────────────────────────────────────────────
  const handleNewChat = () => {
    const newChat = { id: Date.now().toString(), name: `Chat ${chats.length + 1}`, messages: [] };
    setChats((prev) => [...prev, newChat]);
    setCurrentChatId(newChat.id);
    setMessages([]);
  };

  const handleSelectChat = (id) => {
    const chat = chats.find((c) => c.id === id);
    if (chat) {
      setCurrentChatId(id);
      setMessages(chat.messages || []);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 150);
    }
  };

  const handleDeleteChat = (id) => {
    const updated = chats.filter((c) => c.id !== id);
    setChats(updated);
    if (id === currentChatId) {
      const next = updated[0] || null;
      setCurrentChatId(next?.id || null);
      setMessages(next?.messages || []);
    }
  };

  const handleEditChatName = (chat) => { setEditingChatId(chat.id); setEditedName(chat.name); };
  const handleSaveChatName = (chatId) => {
    setChats((prev) => prev.map((c) => c.id === chatId ? { ...c, name: editedName.trim() || c.name } : c));
    setEditingChatId(null);
  };

  const handleQuizClick = (e) => {
    e.preventDefault();
    navigate(isLoggedIn ? "/quiz" : "/login", {
      state: {
        url: url || "",
        content: content || "",
        chatId: currentChatId,
      },
    });
  };

  // ── Feedback ───────────────────────────────────────────────────────────────
  const handleFeedback = async (messageId, rating) => {
    if (!messageId || feedbackMap[messageId]) return; // already rated
    setFeedbackMap((prev) => ({ ...prev, [messageId]: rating }));
    try {
      await fetch(`${API}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, rating, userId }),
      });
    } catch (err) {
      console.error("Feedback error:", err);
    }
  };

  // ── Steer ──────────────────────────────────────────────────────────────────
  const handleSteer = (instruction) => {
    setSteerInstruction(instruction);
    setShowSteer(false);
    // Inject a visible system note into the chat
    setMessages((prev) => [
      ...prev,
      { role: "system-note", content: `Style updated: "${STEER_COMMANDS.find(s => s.instruction === instruction)?.label}"` },
    ]);
  };

  // ── Chat name generation ───────────────────────────────────────────────────
  const generateChatName = async (answer) => {
    try {
      const res = await fetch(`${API}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: `In 4 words or fewer, give a concise topic title that summarizes this response (no punctuation, no quotes, no explanation): "${answer.slice(0, 500)}"`,
        }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.answer?.trim().replace(/^["']|["']$/g, "").slice(0, 40) || null;
    } catch { return null; }
  };

  // ── Send message ───────────────────────────────────────────────────────────
  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;

    let activeChatId = currentChatId;
    if (!activeChatId) {
      const newChat = { id: Date.now().toString(), name: "New Chat", messages: [] };
      setChats((prev) => [...prev, newChat]);
      setCurrentChatId(newChat.id);
      activeChatId = newChat.id;
    }

    const questionText = input.trim();
    const updatedMessages = [...messages, { role: "user", content: questionText }];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      let systemContext = "";
      if (mode === "url" && url.trim()) systemContext = `Based on this URL: ${url.trim()}`;
      if (mode === "text" && content.trim()) systemContext = `Based on this content: ${content.trim()}`;

      // Combine steer instruction into the question if active
      const effectiveQuestion = steerInstruction
        ? `[Instruction: ${steerInstruction}]\n\n${questionText}`
        : questionText;

      const res = await fetch(`${API}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: effectiveQuestion,
          context: systemContext,
          userId,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 429) throw new Error("QUOTA_EXCEEDED");
        if (res.status === 401) throw new Error(errorData.error || "INVALID_API_KEY");
        throw new Error(errorData.error || errorData.message || "API_ERROR");
      }
      const data = await res.json();

      const finalMessages = [
        ...updatedMessages,
        { role: "assistant", content: data.answer || "No response", messageId: data.messageId },
      ];
      setMessages(finalMessages);

      // Auto-name new chat
      setChats((prev) => {
        const chat = prev.find((c) => c.id === activeChatId);
        if (chat && chat.name === "New Chat") {
          generateChatName(data.answer || "").then((name) => {
            if (name) setChats((latest) => latest.map((c) => c.id === activeChatId ? { ...c, name } : c));
          });
        }
        return prev;
      });
    } catch (err) {
      console.error("Frontend error:", err);
      let errorMessage = "Something went wrong. Please try again.";
      if (err.message === "QUOTA_EXCEEDED") {
        errorMessage = "Quota exceeded! Please wait about 30 seconds before sending another message.";
      } else if (err.message === "INVALID_API_KEY" || (err.message && (err.message.includes("API Key") || err.message.includes("GROQ_API_KEY")))) {
        errorMessage = err.message.includes("GROQ_API_KEY") 
          ? err.message 
          : "Invalid or missing Groq API Key. Please verify your GROQ_API_KEY in backend/.env.";
      } else if (err.message && err.message !== "API_ERROR") {
        errorMessage = err.message;
      }
      setMessages((prev) => [...prev, { role: "assistant", content: errorMessage }]);
    } finally {
      setLoading(false);
    }
  };

  // ── Shared components ──────────────────────────────────────────────────────
  const BrutalistButton = ({ children, onClick, disabled = false, variant = "default" }) => {
    const base = `group relative inline-block overflow-visible border-2 font-bold text-[13px]
      tracking-[0.05em] px-8 py-4 transition-all duration-300 ease-in-out uppercase
      ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`;
    const variants = {
      default: "border-black bg-transparent text-black hover:bg-black hover:text-white",
      indigo: "border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700 hover:border-indigo-700",
    };
    return (
      <button onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]}`}>
        <span className={`absolute top-1/2 left-6 h-[2px] w-6 -translate-y-1/2 transition-all duration-300 group-hover:w-4
          ${variant === "indigo" ? "bg-white" : "bg-black group-hover:bg-white"}`}></span>
        <span className="absolute top-[-2px] left-[10px] h-[2px] w-6 bg-gray-300 transition-all duration-500 ease-out group-hover:left-[-2px] group-hover:w-0"></span>
        <span className="block pl-8 text-left text-[15px] transition-all duration-300 ease-in-out group-hover:pl-6">{children}</span>
        <span className="absolute bottom-[-2px] right-[30px] h-[2px] w-6 bg-gray-300 transition-all duration-500 ease-out group-hover:right-0 group-hover:w-0"></span>
        <span className="absolute bottom-[-2px] right-[10px] h-[2px] w-[10px] bg-gray-300 transition-all duration-500 ease-out group-hover:right-0 group-hover:w-0"></span>
      </button>
    );
  };

  const mdComponents = {
    p: ({ children }) => <p className="mb-2 last:mb-0 font-medium leading-relaxed">{children}</p>,
    strong: ({ children }) => <strong className="font-black">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    ul: ({ children }) => <ul className="my-2 space-y-1 pl-2">{children}</ul>,
    ol: ({ children }) => <ol className="my-2 space-y-1 pl-2 list-none">{children}</ol>,
    li: ({ children }) => (
      <li className="flex items-start gap-2 font-medium">
        <span className="mt-1 flex-shrink-0 font-black" style={{ color: "#4f46e5" }}>•</span>
        <span>{children}</span>
      </li>
    ),
    h1: ({ children }) => <h1 className="text-xl font-black uppercase tracking-tight mb-2 mt-3 first:mt-0">{children}</h1>,
    h2: ({ children }) => <h2 className="text-lg font-black uppercase tracking-tight mb-2 mt-3 first:mt-0">{children}</h2>,
    h3: ({ children }) => <h3 className="text-base font-black uppercase tracking-tight mb-1 mt-2 first:mt-0">{children}</h3>,
    code: ({ inline, children }) => inline
      ? <code className="px-1.5 py-0.5 font-mono text-sm border border-black" style={{ background: "#eef0ff", color: "#4f46e5" }}>{children}</code>
      : <pre className="my-2 p-3 font-mono text-sm border-2 border-black overflow-x-auto" style={{ background: "#1e1b4b", color: "#e0e7ff" }}><code>{children}</code></pre>,
    blockquote: ({ children }) => <blockquote className="my-2 pl-4 border-l-4 italic font-medium" style={{ borderColor: "#f59e0b" }}>{children}</blockquote>,
    hr: () => <hr className="my-3 border-t-2 border-black" />,
  };

  const inputClass = "w-full p-4 text-lg font-bold text-black bg-white border-4 border-black outline-none transition-all duration-300 shadow-[5px_5px_0_#4f46e5] placeholder:text-gray-400 focus:border-indigo-600 resize-none";

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen text-black flex flex-col overflow-hidden relative" style={{ background: "#faf7f2" }}>

      {/* Header */}
      <div className="flex-shrink-0 border-b-4 border-black px-6 py-5 flex items-center justify-between" style={{ background: "#fff" }}>
        <div className="flex items-center gap-3.5">
          <AppLogo size={42} />
          <div className="relative">
            <h1 className="text-3xl font-black tracking-tight uppercase">Gen AI Assistant</h1>
            <div className="absolute -bottom-1 left-0 w-24 h-1" style={{ background: "#f59e0b" }}></div>
          </div>
        </div>
        {!isLoggedIn && (
          <BrutalistButton variant="indigo" onClick={() => navigate("/login")}>Login</BrutalistButton>
        )}
      </div>

      {/* Main */}
      <div className="flex-1 flex overflow-hidden">

        {/* Sidebar */}
        <div ref={sidebarRef} className="w-96 border-r-4 border-black flex flex-col" style={{ background: "#eef0ff" }}>
          <div className="p-6 border-b-2 border-black flex justify-between items-center" style={{ background: "#e0e4ff" }}>
            <h2 className="text-xl font-black uppercase tracking-tight">Chats</h2>
            <BrutalistButton variant="indigo" onClick={handleNewChat}>New</BrutalistButton>
          </div>

          <div className="flex-1 overflow-y-auto">
            {chats.length === 0 ? (
              <p className="p-6 text-indigo-400 text-sm font-bold uppercase tracking-wide">No chats yet. Create one!</p>
            ) : (
              chats.map((chat) => (
                <div
                  key={chat.id}
                  id={`chat-${chat.id}`}
                  onClick={() => handleSelectChat(chat.id)}
                  className={`relative border-b-2 border-black px-6 py-4 cursor-pointer transition-all duration-200
                    ${chat.id === currentChatId ? "text-white" : "hover:bg-indigo-50"}`}
                  style={chat.id === currentChatId ? { background: "#4f46e5" } : {}}
                >
                  {chat.id === currentChatId && (
                    <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: "#f59e0b" }}></div>
                  )}
                  {editingChatId === chat.id ? (
                    <input
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      onBlur={() => handleSaveChatName(chat.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveChatName(chat.id);
                        if (e.key === "Escape") setEditingChatId(null);
                      }}
                      autoFocus
                      className="bg-transparent border-2 border-white px-2 py-1 w-full text-sm font-bold uppercase tracking-wide outline-none"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <div className="flex justify-between items-center">
                      <span
                        className="font-bold uppercase tracking-wide text-sm flex-1 truncate"
                        onDoubleClick={(e) => { e.stopPropagation(); handleEditChatName(chat); }}
                        title="Double-click to rename"
                      >
                        {chat.name}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteChat(chat.id); }}
                        className="p-1 hover:scale-110 transition-transform opacity-60 hover:opacity-100 flex items-center justify-center cursor-pointer"
                        title="Delete chat"
                      ><CrossIcon size={11} /></button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Mode + input */}
          <div className="p-6 border-t-4 border-black space-y-6" style={{ background: "#e0e4ff" }}>
            <div className="flex border-2 border-black">
              {["url", "text"].map((m) => (
                <button key={m} onClick={() => setMode(m)}
                  className={`flex-1 py-3 font-bold uppercase text-sm tracking-wide transition-all duration-200 ${mode === m ? "text-white" : "text-black hover:bg-indigo-50"}`}
                  style={mode === m ? { background: "#4f46e5" } : {}}>
                  {m === "url" ? "URL" : "Text"}
                </button>
              ))}
            </div>
            {mode === "url" ? (
              <div className="relative font-mono mb-4">
                <input type="text" value={url || ""} onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/article" className={inputClass} />
                <label className="absolute -left-1 -top-9 text-sm font-bold text-white px-3 py-1 -rotate-1" style={{ background: "#4f46e5" }}>WEBPAGE URL</label>
              </div>
            ) : (
              <div className="relative font-mono mb-4">
                <textarea value={content || ""} onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste full webpage content here..." rows={5} className={inputClass} />
                <label className="absolute -left-1 -top-9 text-sm font-bold text-white px-3 py-1 -rotate-1" style={{ background: "#4f46e5" }}>WEBPAGE CONTENT</label>
              </div>
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col" style={{ background: "#faf7f2" }}>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-8 space-y-6">
            {messages.length === 0 ? (
              <div className="text-center mt-12 flex flex-col items-center">
                <div className="mb-6">
                  <RobotIllustration size={100} />
                </div>
                <h3 className="text-3xl font-black uppercase mb-3 tracking-tight">Start a Conversation</h3>
                <p className="font-medium max-w-md mx-auto" style={{ color: "#6b7280" }}>
                  Ask questions, summarize web content, and test your knowledge with interactive quizzes!
                </p>
              </div>
            ) : (
              messages.map((msg, i) => {
                // System note (steer confirmation)
                if (msg.role === "system-note") {
                  return (
                    <div key={i} className="flex justify-center">
                      <span className="text-xs font-bold uppercase tracking-widest px-4 py-2 border-2 border-black flex items-center gap-2"
                        style={{ background: "#fef3c7", color: "#92400e" }}>
                        <SlidersIcon size={13} />
                        {msg.content}
                      </span>
                    </div>
                  );
                }

                // Quiz History Card (collapsed by default, expands on click)
                if (msg.role === "quiz-history") {
                  return <QuizHistoryCard key={msg.id || i} msg={msg} />;
                }

                // User message
                if (msg.role === "user") {
                  return (
                    <div key={i} className="flex justify-end">
                      <div className="px-6 py-4 text-base border-2 border-black text-white max-w-xl"
                        style={{ background: "#4f46e5", boxShadow: "4px 4px 0 #312e81" }}>
                        <p className="font-medium">{msg.content}</p>
                      </div>
                    </div>
                  );
                }

                // Assistant message
                const rated = feedbackMap[msg.messageId];
                return (
                  <div key={i} className="flex justify-start">
                    <div className="max-w-2xl">
                      <div className="px-6 py-4 text-base border-2 border-black text-black bg-white"
                        style={{ borderLeft: "4px solid #f59e0b", boxShadow: "4px 4px 0 #d1d5db" }}>
                        <ReactMarkdown components={mdComponents}>
                          {normalizeLLMMarkdown(msg.content)}
                        </ReactMarkdown>
                      </div>
                      {/* Feedback row */}
                      {msg.messageId && (
                        <div className="flex items-center gap-2 mt-2 pl-1">
                          <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "#9ca3af" }}>
                            Was this helpful?
                          </span>
                          <button
                            onClick={() => handleFeedback(msg.messageId, 1)}
                            disabled={!!rated}
                            title="Helpful"
                            className={`p-2 border-2 border-black transition-all duration-150 flex items-center justify-center
                              ${rated === 1 ? "bg-emerald-500 text-white" : rated ? "opacity-30 cursor-not-allowed" : "bg-white hover:bg-emerald-100 cursor-pointer"}`}
                          >
                            <ThumbUpIcon size={14} />
                          </button>
                          <button
                            onClick={() => handleFeedback(msg.messageId, -1)}
                            disabled={!!rated}
                            title="Not helpful"
                            className={`p-2 border-2 border-black transition-all duration-150 flex items-center justify-center
                              ${rated === -1 ? "bg-rose-500 text-white" : rated ? "opacity-30 cursor-not-allowed" : "bg-white hover:bg-rose-100 cursor-pointer"}`}
                          >
                            <ThumbDownIcon size={14} />
                          </button>
                          {rated && (
                            <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "#6b7280" }}>
                              {rated === 1 ? "Thanks!" : "Got it — improving..."}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input bar */}
          <div className="p-6 border-t-4 border-black" style={{ background: "#fff" }}>

            {/* Steer commands */}
            <div className="mb-3 flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowSteer((v) => !v)}
                className="text-xs font-black uppercase tracking-widest px-3 py-1.5 border-2 border-black transition-all cursor-pointer hover:bg-black hover:text-white flex items-center gap-1.5"
                style={steerInstruction ? { background: "#4f46e5", color: "#fff" } : {}}
              >
                <SlidersIcon size={13} />
                <span>{steerInstruction ? STEER_COMMANDS.find(s => s.instruction === steerInstruction)?.label : "Style"}</span>
              </button>
              {showSteer && STEER_COMMANDS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => handleSteer(s.instruction)}
                  className={`text-xs font-bold uppercase tracking-wide px-3 py-1.5 border-2 border-black cursor-pointer transition-all
                    ${steerInstruction === s.instruction ? "text-white" : "hover:bg-indigo-50"}`}
                  style={steerInstruction === s.instruction ? { background: "#4f46e5" } : { background: "#eef0ff" }}
                >
                  {s.label}
                </button>
              ))}
              {steerInstruction && (
                <button
                  onClick={() => { setSteerInstruction(null); setShowSteer(false); }}
                  className="text-xs font-bold uppercase tracking-wide px-3 py-1.5 border-2 border-black cursor-pointer hover:bg-rose-50 flex items-center gap-1"
                  style={{ background: "#fff1f2", color: "#b91c1c" }}
                >
                  <CrossIcon size={10} />
                  <span>Clear</span>
                </button>
              )}
            </div>

            <div className="flex gap-3 items-end">
              <div className="flex-1 relative font-mono">
                <textarea
                  placeholder="Type your message..."
                  value={input || ""}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
                  }}
                  className={inputClass}
                  rows={2}
                />
                <label className="absolute -left-1 -top-9 text-sm font-bold text-white px-3 py-1 -rotate-1" style={{ background: "#4f46e5" }}>
                  MESSAGE INPUT
                </label>
              </div>
              <BrutalistButton onClick={handleQuizClick}>Take Quiz</BrutalistButton>
              <BrutalistButton variant="indigo" onClick={handleSend} disabled={loading || !input.trim()}>
                {loading ? "..." : "Send"}
              </BrutalistButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
