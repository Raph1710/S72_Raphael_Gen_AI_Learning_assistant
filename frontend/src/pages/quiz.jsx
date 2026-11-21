import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  AppLogo,
  DifficultyBadge,
  CheckIcon,
  CrossIcon,
} from "../components/BrutalistIcons.jsx";

const DIFFICULTIES = [
  {
    id: "easy",
    label: "Easy",
    description: "Basic facts and main ideas. Great for a quick review.",
    color: "#065f46",
    bg: "#d1fae5",
    border: "#10b981",
    shadow: "#10b981",
  },
  {
    id: "medium",
    label: "Medium",
    description: "A mix of recall and inference. Tests real understanding.",
    color: "#92400e",
    bg: "#fef3c7",
    border: "#f59e0b",
    shadow: "#f59e0b",
  },
  {
    id: "hard",
    label: "Hard",
    description: "Deep comprehension and critical thinking. No skimming allowed.",
    color: "#7f1d1d",
    bg: "#fee2e2",
    border: "#ef4444",
    shadow: "#ef4444",
  },
];

export default function Quiz() {
  const [difficulty, setDifficulty] = useState(null); // null = selector screen
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [quizExited, setQuizExited] = useState(false);
  const [showExitPopup, setShowExitPopup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const quizUrl = location.state?.url || "";
  const quizContent = location.state?.content || "";
  const initialChatId = location.state?.chatId || null;
  const hasEnteredFullscreen = useRef(false);

  const handleSelectDifficulty = async (id) => {
    setDifficulty(id);
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        await elem.msRequestFullscreen();
      }
    } catch (err) {
      console.warn("Fullscreen mode not permitted or denied:", err.message || err);
    }
  };

  useEffect(() => {
    if (!difficulty) return; // wait for user to pick difficulty
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:5000/api/quiz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: quizUrl, content: quizContent, numQuestions: 5, difficulty }),
        });
        if (!response.ok) throw new Error("Failed to fetch quiz questions");
        const data = await response.json();
        setQuestions(data.quiz);
        setLoading(false);
      } catch (err) {
        console.error("Quiz fetch error:", err);
        setFetchError(err.message);
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [quizUrl, quizContent, difficulty]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement);
      if (isCurrentlyFullscreen) {
        hasEnteredFullscreen.current = true;
      } else if (hasEnteredFullscreen.current && score === null && difficulty) {
        setQuizExited(true);
        setScore(0);
        setShowExitPopup(true);
        setTimeout(() => { setShowExitPopup(false); navigate("/"); }, 3000);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, [navigate, score, difficulty]);

  const handleAnswer = (option) => setAnswers((prev) => ({ ...prev, [currentQuestion]: option }));

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateScore();
    }
  };

  const saveQuizToHistory = (finalScore) => {
    try {
      const savedChats = JSON.parse(localStorage.getItem("chats") || "[]");
      let activeChatId = initialChatId || localStorage.getItem("currentChatId");

      const timestamp = new Date().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      const quizRecord = {
        id: "quiz_" + Date.now(),
        role: "quiz-history",
        timestamp,
        difficulty: difficulty || "medium",
        score: finalScore,
        totalQuestions: questions.length,
        percentage: Math.round((finalScore / questions.length) * 100),
        url: quizUrl || null,
        questions: questions.map((q, idx) => ({
          questionNumber: idx + 1,
          question: q.question,
          options: q.options,
          userAnswer: answers[idx] || "Not answered",
          correctAnswer: q.answer,
          isCorrect: answers[idx] === q.answer,
          explanation: q.explanation || "This answer is directly verified by the source text.",
        })),
      };

      let chatFound = false;
      let updatedChats = savedChats.map((c) => {
        if (c.id === activeChatId) {
          chatFound = true;
          return {
            ...c,
            messages: [...(c.messages || []), quizRecord],
          };
        }
        return c;
      });

      if (!chatFound) {
        activeChatId = Date.now().toString();
        const newChat = {
          id: activeChatId,
          name: `Quiz: ${(difficulty || "medium").toUpperCase()}`,
          messages: [quizRecord],
        };
        updatedChats = [...updatedChats, newChat];
      }

      localStorage.setItem("chats", JSON.stringify(updatedChats));
      localStorage.setItem("currentChatId", activeChatId);
    } catch (e) {
      console.error("Failed to save quiz to history:", e);
    }
  };

  const calculateScore = () => {
    let total = 0;
    questions.forEach((q, i) => { if (answers[i] === q.answer) total++; });
    setScore(total);
    document.exitFullscreen?.();
    saveQuizToHistory(total);
  };

  const handleRestart = () => { setAnswers({}); setScore(null); setCurrentQuestion(0); };

  const Header = ({ right }) => (
    <div className="border-b-4 border-black px-6 py-5 flex items-center justify-between flex-shrink-0" style={{ background: "#fff" }}>
      <div className="flex items-center gap-3.5">
        <AppLogo size={38} />
        <div className="relative">
          <h1 className="text-3xl font-black tracking-tight uppercase">Gen AI Assistant</h1>
          <div className="absolute -bottom-1 left-0 w-24 h-1" style={{ background: "#f59e0b" }}></div>
        </div>
      </div>
      {right}
    </div>
  );

  const BackButton = ({ label = "Home", onClick }) => (
    <button
      onClick={onClick}
      className="group relative inline-block border-2 border-black bg-transparent font-bold text-[13px] tracking-[0.05em] px-8 py-4 transition-all duration-300 hover:bg-black hover:text-white text-black uppercase cursor-pointer overflow-visible"
    >
      <span className="absolute top-1/2 left-6 h-[2px] w-6 bg-black -translate-y-1/2 transition-all duration-300 group-hover:w-4 group-hover:bg-white"></span>
      <span className="block pl-8 text-left text-[15px] transition-all duration-300 group-hover:pl-6">{label}</span>
    </button>
  );

  // ── Difficulty selector ────────────────────────────────────────────────────
  if (!difficulty) {
    return (
      <div className="h-screen text-black flex flex-col" style={{ background: "#faf7f2" }}>
        <Header right={<BackButton onClick={() => navigate("/")} />} />
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-full max-w-xl">
            <div className="mb-10 text-center">
              <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: "#6366f1" }}>
                Before you begin
              </p>
              <h2 className="text-4xl font-black uppercase tracking-tight">Select Difficulty</h2>
              <div className="mx-auto mt-2 h-1 w-16" style={{ background: "#f59e0b" }}></div>
            </div>

            <div className="grid gap-4">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.id}
                  onClick={() => handleSelectDifficulty(d.id)}
                  className="w-full text-left border-4 border-black p-6 transition-all duration-200 cursor-pointer group"
                  style={{ background: d.bg, boxShadow: `6px 6px 0 ${d.shadow}` }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translate(-2px, -2px)"; e.currentTarget.style.boxShadow = `8px 8px 0 ${d.shadow}`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = `6px 6px 0 ${d.shadow}`; }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <DifficultyBadge level={d.id} size={32} />
                      <div>
                        <p className="text-xl font-black uppercase tracking-tight" style={{ color: d.color }}>{d.label}</p>
                        <p className="text-sm font-bold mt-1" style={{ color: d.color, opacity: 0.8 }}>{d.description}</p>
                      </div>
                    </div>
                    <span className="font-black text-2xl opacity-40 group-hover:opacity-100 transition-opacity" style={{ color: d.color }}>→</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="h-screen text-black flex flex-col" style={{ background: "#faf7f2" }}>
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <div className="border-4 border-black px-12 py-10 shadow-[8px_8px_0_#4f46e5]" style={{ background: "#eef0ff" }}>
            <p className="text-2xl font-black uppercase tracking-widest animate-pulse" style={{ color: "#4f46e5" }}>
              Generating Quiz...
            </p>
          </div>
          <p className="font-bold uppercase text-sm tracking-wide" style={{ color: "#6b7280" }}>
            Hang tight, this may take a moment
          </p>
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (fetchError) {
    return (
      <div className="h-screen text-black flex flex-col" style={{ background: "#faf7f2" }}>
        <Header right={<BackButton onClick={() => navigate("/")} />} />
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <div className="border-4 border-black px-12 py-10 text-center max-w-md" style={{ background: "#fff1f2", boxShadow: "8px 8px 0 #ef4444" }}>
            <p className="text-2xl font-black uppercase tracking-tight mb-3" style={{ color: "#b91c1c" }}>Failed to Load Quiz</p>
            <p className="font-bold mb-8 text-sm" style={{ color: "#6b7280" }}>{fetchError}</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="border-2 border-black font-black uppercase text-sm tracking-widest px-8 py-4 cursor-pointer text-white transition-all hover:opacity-90"
                style={{ background: "#4f46e5" }}
              >
                Retry
              </button>
              <button
                onClick={() => navigate("/")}
                className="border-2 border-black bg-white font-black uppercase text-sm tracking-widest px-8 py-4 hover:bg-indigo-50 transition-all cursor-pointer"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Exited ─────────────────────────────────────────────────────────────────
  if (quizExited) {
    return (
      <div className="h-screen text-black flex flex-col items-center justify-center relative" style={{ background: "#faf7f2" }}>
        <div className="border-4 border-black px-12 py-10 text-center" style={{ background: "#fff1f2", boxShadow: "8px 8px 0 #ef4444" }}>
          <p className="text-3xl font-black uppercase tracking-tight" style={{ color: "#b91c1c" }}>Quiz Exited — Score: 0</p>
        </div>
        {showExitPopup && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
            <div className="border-4 border-black px-12 py-10 text-center max-w-sm" style={{ background: "#fff1f2", boxShadow: "8px 8px 0 #ef4444" }}>
              <p className="text-2xl font-black uppercase mb-3" style={{ color: "#b91c1c" }}>You Exited!</p>
              <p className="font-bold uppercase text-sm tracking-wide" style={{ color: "#6b7280" }}>Score is 0. Returning to home...</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Results ────────────────────────────────────────────────────────────────
  if (score !== null) {
    const percentage = Math.round((score / questions.length) * 100);
    const grade = percentage >= 80 ? { label: "Excellent!", color: "#065f46", bg: "#d1fae5", shadow: "#10b981" }
      : percentage >= 60 ? { label: "Good Job!", color: "#1e40af", bg: "#dbeafe", shadow: "#3b82f6" }
      : { label: "Keep Practicing", color: "#b91c1c", bg: "#fee2e2", shadow: "#ef4444" };

    return (
      <div className="min-h-screen text-black flex flex-col" style={{ background: "#faf7f2" }}>
        <Header right={<BackButton onClick={() => navigate("/")} />} />

        {/* Score banner */}
        <div className="px-6 py-8 flex items-center justify-between border-b-4 border-black" style={{ background: "#4f46e5" }}>
          <div>
            <p className="text-sm font-bold uppercase tracking-widest mb-1" style={{ color: "#c7d2fe" }}>Final Score</p>
            <p className="text-5xl font-black text-white">
              {score} <span className="text-2xl" style={{ color: "#c7d2fe" }}>/ {questions.length}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold uppercase tracking-widest mb-1" style={{ color: "#c7d2fe" }}>Result</p>
            <p className="text-5xl font-black text-white">{percentage}%</p>
          </div>
          <div className="border-4 border-white px-6 py-3" style={{ background: grade.bg }}>
            <div className="flex items-center gap-1.5 mb-1">
              <DifficultyBadge level={difficulty} size={18} />
              <p className="font-black uppercase text-xs tracking-widest" style={{ color: grade.color }}>
                {difficulty} difficulty
              </p>
            </div>
            <p className="font-black uppercase text-lg tracking-tight" style={{ color: grade.color }}>{grade.label}</p>
          </div>
        </div>

        {/* Review */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-3xl mx-auto space-y-6">
            {questions.map((q, index) => {
              const userAnswer = answers[index];
              const isCorrect = userAnswer === q.answer;
              return (
                <div key={index} className="border-4 border-black p-6"
                  style={{ background: "#fff", boxShadow: `6px 6px 0 ${isCorrect ? "#10b981" : "#ef4444"}` }}>
                  <div className="flex items-start gap-4 mb-4">
                    <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center border-2 border-black font-black text-sm text-white"
                      style={{ background: isCorrect ? "#10b981" : "#ef4444" }}>
                      {isCorrect ? <CheckIcon size={14} /> : <CrossIcon size={14} />}
                    </span>
                    <p className="font-black text-lg tracking-tight">{index + 1}. {q.question}</p>
                  </div>
                  <div className="grid gap-2 pl-12">
                    {q.options.map((option, i) => {
                      const isRight = q.answer === option;
                      const isUser = userAnswer === option;
                      return (
                        <div key={i} className="px-4 py-3 border-2 font-bold text-sm tracking-wide flex items-center justify-between"
                          style={
                            isRight
                              ? { borderColor: "#10b981", background: "#d1fae5", color: "#065f46" }
                              : isUser
                              ? { borderColor: "#ef4444", background: "#fee2e2", color: "#b91c1c", textDecoration: "line-through" }
                              : { borderColor: "#d1d5db", background: "#f9fafb", color: "#9ca3af" }
                          }
                        >
                          <span>{option}</span>
                          <span className="flex items-center gap-1.5">
                            {isUser && (
                              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 border border-black bg-white text-black">
                                Your Pick
                              </span>
                            )}
                            {isRight && <CheckIcon size={14} />}
                            {isUser && !isRight && <CrossIcon size={14} />}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {q.explanation && (
                    <div className="mt-4 ml-12 p-3.5 border-2 border-black bg-indigo-50 text-indigo-950">
                      <span className="block text-[10px] font-black uppercase tracking-widest text-indigo-700 mb-1">
                        Why this answer is correct
                      </span>
                      <p className="text-xs font-medium leading-relaxed">{q.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="max-w-3xl mx-auto mt-8 flex gap-4">
            <button
              onClick={handleRestart}
              className="border-2 border-black font-black uppercase text-sm tracking-widest px-8 py-4 cursor-pointer text-white transition-all hover:opacity-90"
              style={{ background: "#4f46e5" }}
            >
              Retry Quiz
            </button>
            <button
              onClick={() => navigate("/")}
              className="border-2 border-black bg-white font-black uppercase text-sm tracking-widest px-8 py-4 hover:bg-indigo-50 transition-all cursor-pointer"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Active question ────────────────────────────────────────────────────────
  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const optionLetters = ["A", "B", "C", "D"];

  return (
    <div className="h-screen text-black flex flex-col" style={{ background: "#faf7f2" }}>
      <Header
        right={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 border-2 border-black px-3 py-1.5"
              style={{ background: DIFFICULTIES.find(d => d.id === difficulty)?.bg, color: DIFFICULTIES.find(d => d.id === difficulty)?.color }}>
              <DifficultyBadge level={difficulty} size={18} />
              <span className="font-black uppercase text-xs tracking-widest">{difficulty}</span>
            </div>
            <span className="font-black uppercase text-sm tracking-widest border-2 border-black px-4 py-2"
              style={{ background: "#eef0ff", color: "#4f46e5" }}>
              {currentQuestion + 1} / {questions.length}
            </span>
          </div>
        }
      />

      {/* Progress bar */}
      <div className="h-2 border-b-2 border-black flex-shrink-0" style={{ background: "#e0e4ff" }}>
        <div className="h-full transition-all duration-500" style={{ width: `${progress}%`, background: "#4f46e5" }}></div>
      </div>

      {/* Question */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-2xl">
          <div className="border-4 border-black p-8 mb-6" style={{ background: "#fff", boxShadow: "8px 8px 0 #4f46e5" }}>
            <p className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: "#6366f1" }}>
              Question {currentQuestion + 1}
            </p>
            <p className="text-xl font-black tracking-tight leading-snug">{currentQ.question}</p>
          </div>

          <div className="grid gap-3">
            {currentQ.options.map((option, idx) => {
              const isSelected = answers[currentQuestion] === option;
              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(option)}
                  className="w-full px-6 py-4 border-2 text-left font-bold text-sm tracking-wide transition-all duration-200 cursor-pointer"
                  style={isSelected
                    ? { borderColor: "#4f46e5", background: "#4f46e5", color: "#fff", boxShadow: "4px 4px 0 #312e81" }
                    : { borderColor: "#000", background: "#fff", color: "#000", boxShadow: "4px 4px 0 #000" }
                  }
                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "#eef0ff"; }}
                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "#fff"; }}
                >
                  <span className="font-black mr-3" style={{ color: isSelected ? "#c7d2fe" : "#6366f1" }}>
                    {optionLetters[idx]}.
                  </span>
                  {option}
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleNext}
              disabled={!answers[currentQuestion]}
              className="border-2 border-black font-black uppercase text-sm tracking-widest px-10 py-4 transition-all duration-200 text-white"
              style={answers[currentQuestion]
                ? { background: "#4f46e5", cursor: "pointer", boxShadow: "4px 4px 0 #312e81" }
                : { background: "#a5b4fc", cursor: "not-allowed", opacity: 0.6 }
              }
            >
              {currentQuestion < questions.length - 1 ? "Next →" : "Finish"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
