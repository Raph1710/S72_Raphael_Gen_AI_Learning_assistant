import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const [mode, setMode] = useState("url");
  const [url, setUrl] = useState("");
  const [content, setContent] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const chatEndRef = useRef(null);
  const sidebarRef = useRef(null);
  const navigate = useNavigate();

  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [editingChatId, setEditingChatId] = useState(null);
  const [editedName, setEditedName] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);

  // ✅ Scroll to bottom when messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✅ INITIAL LOAD: Load all data from localStorage once on mount
  useEffect(() => {
    try {
      const savedChats = JSON.parse(localStorage.getItem("chats") || "[]");
      const savedCurrentId = localStorage.getItem("currentChatId");
      const savedUrl = localStorage.getItem("landing_url") || "";
      const savedContent = localStorage.getItem("landing_content") || "";

      // Set all state
      setChats(savedChats);
      setUrl(savedUrl);
      setContent(savedContent);

      // Restore current chat if it exists
      if (savedCurrentId && savedChats.length > 0) {
        const activeChat = savedChats.find((c) => c.id === savedCurrentId);
        if (activeChat) {
          setCurrentChatId(savedCurrentId);
          setMessages(activeChat.messages || []);

          // Scroll to active chat in sidebar
          setTimeout(() => {
            const activeEl = document.getElementById(`chat-${savedCurrentId}`);
            activeEl?.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 200);
        }
      }

      setIsInitialized(true);
    } catch (e) {
      console.error("Failed to load chats:", e);
    }
  }, []);

  // ✅ Save chats array to localStorage whenever it changes (after initialization)
  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem("chats", JSON.stringify(chats));
  }, [chats, isInitialized]);

  // ✅ Save current chat ID whenever it changes
  useEffect(() => {
    if (!isInitialized) return;
    if (currentChatId) {
      localStorage.setItem("currentChatId", currentChatId);
    } else {
      localStorage.removeItem("currentChatId");
    }
  }, [currentChatId, isInitialized]);

  // ✅ Save URL and content whenever they change
  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem("landing_url", url || "");
  }, [url, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem("landing_content", content || "");
  }, [content, isInitialized]);

  // ✅ Sync messages into current chat whenever messages change
  useEffect(() => {
    if (!isInitialized || !currentChatId) return;

    setChats((prevChats) => {
      const chatExists = prevChats.find((c) => c.id === currentChatId);
      if (!chatExists) return prevChats;

      return prevChats.map((chat) =>
        chat.id === currentChatId ? { ...chat, messages } : chat
      );
    });
  }, [messages, currentChatId, isInitialized]);

  // ✅ Check login status
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
      setShowWelcome(true);
      const timer = setTimeout(() => setShowWelcome(false), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  // ✅ Create new chat
  const handleNewChat = () => {
    const newChat = {
      id: Date.now().toString(),
      name: `Chat ${chats.length + 1}`,
      messages: [],
    };
    setChats((prev) => [...prev, newChat]);
    setCurrentChatId(newChat.id);
    setMessages([]);
  };

  // ✅ Switch to a different chat
  const handleSelectChat = (id) => {
    const chat = chats.find((c) => c.id === id);
    if (chat) {
      setCurrentChatId(id);
      setMessages(chat.messages || []);
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 150);
    }
  };

  // ✅ Delete a chat
  const handleDeleteChat = (id) => {
    const updated = chats.filter((c) => c.id !== id);
    setChats(updated);

    if (id === currentChatId) {
      const nextChat = updated[0] || null;
      setCurrentChatId(nextChat?.id || null);
      setMessages(nextChat?.messages || []);
    }
  };

  // ✅ Start editing chat name
  const handleEditChatName = (chat) => {
    setEditingChatId(chat.id);
    setEditedName(chat.name);
  };

  // ✅ Save edited chat name
  const handleSaveChatName = (chatId) => {
    const updated = chats.map((c) =>
      c.id === chatId ? { ...c, name: editedName.trim() || c.name } : c
    );
    setChats(updated);
    setEditingChatId(null);
  };

  // ✅ Handle quiz button click
  const handleQuizClick = (e) => {
    e.preventDefault();
    if (isLoggedIn) {
      navigate("/quiz", { state: { url: url || "", content: content || "" } });
    } else {
      navigate("/login");
    }
  };

  // ✅ Send message to backend
  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;

    const newMessage = { role: "user", content: input.trim() };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      let systemContext = "";
      if (mode === "url" && url.trim()) {
        systemContext = `Based on this URL: ${url.trim()}`;
      }
      if (mode === "text" && content.trim()) {
        systemContext = `Based on this content: ${content.trim()}`;
      }

      const payload = {
        question: input.trim(),
        context: systemContext,
      };
      //http://localhost:5000/api/ask
      //https://s72-raphael-gen-ai-learning-assistant.onrender.com/api/ask
      const res = await fetch("http://localhost:5000/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        // If it's a 429, throw a specific message, otherwise use the generic error
        if (res.status === 429) {
          throw new Error("QUOTA_EXCEEDED");
        }
        throw new Error(errorData.message || "API_ERROR");
      }
      const data = await res.json();

      const finalMessages = [
        ...updatedMessages,
        { role: "assistant", content: data.answer || "No response" },
      ];
      setMessages(finalMessages);
    } catch (err) {
  console.error("Frontend error:", err);
  
  let errorMessage = "❌ Something went wrong. Please try again.";
  
  if (err.message === "QUOTA_EXCEEDED") {
    errorMessage = "⚠️ Quota exceeded! The free AI tier is exhausted. Please wait about 30 seconds before sending another message.";
  }

  setMessages((prev) => [
    ...prev,
    { role: "assistant", content: errorMessage },
  ]);
  }finally {
      setLoading(false);
    }
  };

  const BrutalistButton = ({ children, onClick, disabled = false }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        group relative inline-block overflow-visible 
        border-2 border-black bg-transparent font-bold text-[13px]
        tracking-[0.05em] px-8 py-4 transition-all duration-300 ease-in-out
        hover:bg-black hover:text-white
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        text-black uppercase
      `}
    >
      <span className="absolute top-1/2 left-6 h-[2px] w-6 bg-black -translate-y-1/2 transition-all duration-300 group-hover:w-4 group-hover:bg-white"></span>
      <span className="absolute top-[-2px] left-[10px] h-[2px] w-6 bg-gray-300 transition-all duration-500 ease-out group-hover:left-[-2px] group-hover:w-0"></span>
      <span className="block pl-8 text-left text-[15px] transition-all duration-300 ease-in-out group-hover:pl-6">
        {children}
      </span>
      <span className="absolute bottom-[-2px] right-[30px] h-[2px] w-6 bg-gray-300 transition-all duration-500 ease-out group-hover:right-0 group-hover:w-0"></span>
      <span className="absolute bottom-[-2px] right-[10px] h-[2px] w-[10px] bg-gray-300 transition-all duration-500 ease-out group-hover:right-0 group-hover:w-0"></span>
    </button>
  );

  const BrutalistInput = ({ value, onChange, placeholder, label, type = "text" }) => (
    <div className="relative font-mono mb-4">
      <input
        type={type}
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full p-4 text-lg font-bold text-black bg-stone-50 border-4 border-black outline-none transition-all duration-300 shadow-[5px_5px_0_#000,10px_10px_0_#4a90e2] focus:animate-[focus-pulse_4s_cubic-bezier(0.25,0.8,0.25,1)_infinite] placeholder:text-gray-500 focus:placeholder:text-transparent"
        style={{ animation: 'none' }}
        onFocus={(e) => { e.target.style.animation = 'focus-pulse 4s cubic-bezier(0.25, 0.8, 0.25, 1) infinite'; }}
        onBlur={(e) => { e.target.style.animation = 'none'; }}
      />
      <label className="absolute -left-1 -top-9 text-sm font-bold text-white bg-black px-3 py-1 -rotate-1 transition-all duration-300">
        {label}
      </label>
    </div>
  );

  const BrutalistTextarea = ({ value, onChange, placeholder, label, rows = 3 }) => (
    <div className="relative font-mono mb-4">
      <textarea
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className="w-full p-4 text-lg font-bold text-black bg-stone-50 border-4 border-black outline-none transition-all duration-300 shadow-[5px_5px_0_#000,10px_10px_0_#4a90e2] focus:animate-[focus-pulse_4s_cubic-bezier(0.25,0.8,0.25,1)_infinite] placeholder:text-gray-500 focus:placeholder:text-transparent resize-none"
        style={{ animation: 'none' }}
        onFocus={(e) => { e.target.style.animation = 'focus-pulse 4s cubic-bezier(0.25, 0.8, 0.25, 1) infinite'; }}
        onBlur={(e) => { e.target.style.animation = 'none'; }}
      />
      <label className="absolute -left-1 -top-9 text-sm font-bold text-white bg-black px-3 py-1 -rotate-1 transition-all duration-300">
        {label}
      </label>
    </div>
  );

  return (
    <div className="h-screen bg-stone-300 text-black flex flex-col overflow-hidden relative">
      {/* Header */}
      <div className="flex-shrink-0 bg-stone-200 border-b-4 border-black px-6 py-6 flex items-center justify-between">
        <div className="relative">
          <h1 className="text-3xl font-black tracking-tight uppercase">
            🧠 Gen AI Assistant
          </h1>
          <div className="absolute -bottom-1 left-0 w-24 h-1 bg-black"></div>
        </div>
        {!isLoggedIn && (
          <BrutalistButton onClick={() => navigate("/login")}>
            Login
          </BrutalistButton>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden border-t-2 border-black">
        {/* Sidebar */}
        <div ref={sidebarRef} className="w-96 bg-stone-300 border-r-4 border-black flex flex-col">
          {/* Sidebar Header */}
          <div className="p-6 border-b-2 border-black flex justify-between items-center bg-stone-200">
            <h2 className="text-xl font-black uppercase tracking-tight">Chats</h2>
            <BrutalistButton onClick={handleNewChat}>
              New
            </BrutalistButton>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto bg-stone-300">
            {chats.length === 0 ? (
              <p className="p-6 text-gray-600 text-sm font-bold uppercase tracking-wide">No chats yet. Create one!</p>
            ) : (
              chats.map((chat) => (
                <div
                  key={chat.id}
                  id={`chat-${chat.id}`}
                  className={`
                    relative border-b-2 border-black px-6 py-4 cursor-pointer 
                    transition-all duration-200 group
                    ${chat.id === currentChatId ? "bg-black text-white" : "bg-stone-200 hover:bg-stone-100"}
                  `}
                  onClick={() => handleSelectChat(chat.id)}
                >
                  {chat.id === currentChatId && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-white"></div>
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
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          handleEditChatName(chat);
                        }}
                        title="Double-click to rename"
                      >
                        {chat.name}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteChat(chat.id);
                        }}
                        className="text-sm font-black ml-4 hover:scale-110 transition-transform"
                        title="Delete Chat"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Mode Selection and Input */}
          <div className="p-6 border-t-4 border-black bg-stone-200 space-y-6">
            <div className="flex gap-0 border-2 border-black">
              <button
                onClick={() => setMode("url")}
                className={`flex-1 py-3 font-bold uppercase text-sm tracking-wide transition-all duration-200 ${
                  mode === "url" ? "bg-black text-white" : "bg-stone-200 text-black hover:bg-stone-100"
                }`}
              >
                URL
              </button>
              <div className="w-[2px] bg-black"></div>
              <button
                onClick={() => setMode("text")}
                className={`flex-1 py-3 font-bold uppercase text-sm tracking-wide transition-all duration-200 ${
                  mode === "text" ? "bg-black text-white" : "bg-stone-200 text-black hover:bg-stone-100"
                }`}
              >
                Text
              </button>
            </div>

            {mode === "url" ? (
              <BrutalistInput
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/article"
                label="WEBPAGE URL"
                type="text"
              />
            ) : (
              <BrutalistTextarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste full webpage content here..."
                label="WEBPAGE CONTENT"
                rows={5}
              />
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-stone-300">
          {/* Messages Display */}
          <div className="flex-1 overflow-y-auto p-8 space-y-6">
            {messages.length === 0 ? (
              <div className="text-center mt-20">
                <div className="text-8xl mb-6">🤖</div>
                <h3 className="text-3xl font-black uppercase mb-3 tracking-tight">Start a Conversation</h3>
                <p className="text-gray-600 font-medium">
                  Ask anything and continue chatting naturally!
                </p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`
                      max-w-xl px-6 py-4 text-base font-medium border-2 border-black
                      ${msg.role === "user"
                        ? "bg-black text-white"
                        : "bg-stone-50 text-black"
                      }
                    `}
                  >
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Message Input Area */}
          <div className="p-6 border-t-4 border-black bg-stone-200">
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative font-mono">
                <textarea
                  placeholder="Type your message..."
                  value={input || ""}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  className="w-full p-4 text-lg font-bold text-black bg-stone-50 border-4 border-black outline-none transition-all duration-300 shadow-[5px_5px_0_#000,10px_10px_0_#4a90e2] focus:animate-[focus-pulse_4s_cubic-bezier(0.25,0.8,0.25,1)_infinite] placeholder:text-gray-500 focus:placeholder:text-transparent resize-none"
                  rows={2}
                  style={{ animation: 'none' }}
                  onFocus={(e) => { e.target.style.animation = 'focus-pulse 4s cubic-bezier(0.25, 0.8, 0.25, 1) infinite'; }}
                  onBlur={(e) => { e.target.style.animation = 'none'; }}
                />
                <label className="absolute -left-1 -top-9 text-sm font-bold text-white bg-black px-3 py-1 -rotate-1 transition-all duration-300">
                  MESSAGE INPUT
                </label>
              </div>
              <BrutalistButton onClick={handleQuizClick}>
                Take Quiz
              </BrutalistButton>
              <BrutalistButton onClick={handleSend} disabled={loading || !input.trim()}>
                {loading ? "..." : "Send"}
              </BrutalistButton>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes focus-pulse {
          0%, 100% { border-color: #000; }
          50% { border-color: #4a90e2; }
        }
      `}</style>
    </div>
  );
}
