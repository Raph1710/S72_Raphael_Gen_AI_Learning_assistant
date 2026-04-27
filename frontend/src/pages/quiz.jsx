import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom"; // ✅ added useLocation

export default function Quiz() {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [quizExited, setQuizExited] = useState(false);
  const [showExitPopup, setShowExitPopup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation(); // ✅ added to access passed URL
  const quizUrl = location.state?.url || ""; // ✅ safely extract URL from state

  // 🧠 Fetch randomized quiz questions from backend
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);

        //http://localhost:5000/api/quiz
        //https://s72-raphael-gen-ai-learning-assistant.onrender.com/api/quiz
        const response = await fetch("http://localhost:5000/api/quiz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: quizUrl, // ✅ dynamically passed from landing
            numQuestions: 5,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch quiz questions");
        }

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
  }, [quizUrl]); // ✅ re-run if URL changes

  // 🧩 Fullscreen + exit handling
  useEffect(() => {
    const enterFullscreen = async () => {
      const elem = document.documentElement;
      try {
        if (elem.requestFullscreen) await elem.requestFullscreen();
        else if (elem.webkitRequestFullscreen) await elem.webkitRequestFullscreen();
        else if (elem.msRequestFullscreen) await elem.msRequestFullscreen();
      } catch (err) {
        console.error("Fullscreen failed:", err);
      }
    };

    enterFullscreen();

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !document.webkitFullscreenElement && score === null) {
        setQuizExited(true);
        setScore(0);
        setShowExitPopup(true);

        setTimeout(() => {
          setShowExitPopup(false);
          navigate("/");
        }, 3000);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, [navigate, score]);

  // 🧩 Handle quiz logic
  const handleAnswer = (option) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion]: option }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateScore();
    }
  };

  const calculateScore = () => {
    let total = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.answer) total++;
    });
    setScore(total);
    document.exitFullscreen?.();
  };

  const handleRestart = () => {
    setAnswers({});
    setScore(null);
    setCurrentQuestion(0);
  };

  // 🧩 Handle edge states
  if (loading) {
    return (
      <div className="h-screen bg-gray-900 text-gray-300 flex items-center justify-center">
        <h2 className="text-2xl font-semibold animate-pulse">Loading quiz...</h2>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="h-screen bg-gray-900 text-gray-200 flex flex-col items-center justify-center">
        <h2 className="text-2xl text-red-400 font-bold mb-4">Failed to load quiz 😢</h2>
        <p className="mb-6 text-gray-400">{fetchError}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  if (quizExited) {
    return (
      <div className="h-screen bg-gray-900 text-gray-200 flex items-center justify-center relative">
        <h1 className="text-3xl font-bold text-red-400">Quiz exited — score: 0</h1>

        {showExitPopup && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-gray-800 border border-red-500 text-red-300 px-10 py-8 rounded-2xl shadow-xl text-center">
              <h2 className="text-2xl font-bold mb-2">You exited the quiz!</h2>
              <p className="text-lg">Your score is 0. Returning to home...</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 🏁 Show result screen
  if (score !== null) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col items-center py-12 px-6">
        <h1 className="text-4xl font-bold text-indigo-400 mb-6">Quiz Complete!</h1>
        <p className="text-2xl mb-10">
          Your Score:{" "}
          <span className="text-indigo-300 font-semibold">
            {score} / {questions.length}
          </span>
        </p>
        <div className="w-full max-w-4xl space-y-8">
          {questions.map((q, index) => {
            const userAnswer = answers[index];
            const isCorrect = userAnswer === q.answer;
            return (
              <div
                key={index}
                className="bg-gray-800 border border-gray-700 rounded-2xl p-6 shadow-xl"
              >
                <h3 className="text-xl font-semibold text-indigo-300 mb-4">
                  {index + 1}. {q.question}
                </h3>
                <div className="grid gap-3">
                  {q.options.map((option, i) => {
                    const isUserAnswer = userAnswer === option;
                    const isRightAnswer = q.answer === option;
                    return (
                      <div
                        key={i}
                        className={`px-5 py-3 rounded-lg border transition-all text-lg ${
                          isRightAnswer
                            ? "bg-green-600/30 border-green-500 text-green-200"
                            : isUserAnswer
                            ? "bg-red-600/30 border-red-500 text-red-200"
                            : "bg-gray-700 border-gray-600 text-gray-300"
                        }`}
                      >
                        {option}
                        {isRightAnswer && " ✅"}
                        {isUserAnswer && !isRightAnswer && " ❌"}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-12 flex gap-4">
          <button
            onClick={handleRestart}
            className="px-6 py-3 bg-indigo-600 rounded-lg text-white font-semibold hover:bg-indigo-700 transition"
          >
            Retry Quiz
          </button>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-gray-700 rounded-lg text-white font-semibold hover:bg-gray-600 transition"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];

  // 🧩 Active question screen
  return (
    <div className="h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-3xl w-full bg-gray-800 rounded-2xl p-10 shadow-2xl border border-indigo-400">
        <h2 className="text-2xl font-semibold text-indigo-300 mb-6">
          Question {currentQuestion + 1} of {questions.length}
        </h2>
        <p className="text-xl mb-8">{currentQ.question}</p>
        <div className="grid gap-4">
          {currentQ.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleAnswer(option)}
              className={`px-6 py-3 rounded-lg border text-left text-lg transition-all ${
                answers[currentQuestion] === option
                  ? "bg-indigo-600 border-indigo-400 text-white"
                  : "bg-gray-700 border-gray-600 hover:bg-gray-600"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleNext}
            disabled={!answers[currentQuestion]}
            className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all"
          >
            {currentQuestion < questions.length - 1 ? "Next ➜" : "Finish ✅"}
          </button>
        </div>
      </div>
    </div>
  );
}
