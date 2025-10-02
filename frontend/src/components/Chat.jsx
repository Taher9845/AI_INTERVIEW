import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { addAnswer, setTimer, setTimeLeft, resumeCandidate } from "../redux/slices/candidatesSlice";
import Timer from "./Timer";
import axios from "axios";
import { API_BASE } from "../config";

export default function Chat() {
  const dispatch = useDispatch();
  const candidate = useSelector((state) => state.candidate);
  const [input, setInput] = useState("");
  const [questions, setQuestions] = useState([]);
  const LS_Q_KEY = "ai_interviewer_questions_v1";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Ensure we are not in paused state while actively in chat
  useEffect(() => {
    if (candidate.paused) {
      dispatch(resumeCandidate());
    }
  }, [candidate.paused, dispatch]);

  // Load questions from localStorage or fetch
  useEffect(() => {
    if (questions.length > 0) return;

    const saved = localStorage.getItem(LS_Q_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 6) {
          setQuestions(parsed);
          setLoading(false);
          return;
        }
      } catch {
        // Ignore parsing errors
      }
    }

    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE}/generate-questions/`);
        setQuestions(res.data.questions);
        localStorage.setItem(LS_Q_KEY, JSON.stringify(res.data.questions));
        setError("");
      } catch (err) {
        console.error("Error fetching questions:", err);
        setError("Could not load interview questions. Please ensure the backend is running on port 8000.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [questions.length]);

  const currentQuestion =
    candidate.currentQuestion < questions.length
      ? questions[candidate.currentQuestion]
      : null;

  // Automatically finish interview if no more questions
  useEffect(() => {
    if (questions.length === 0) return;
    if (currentQuestion || candidate.answers.length === 0) return;

    const finishInterview = async () => {
      try {
        setSubmitting(true);
        const res = await axios.post(
          `${API_BASE}/submit-answers/`,
          {
            name: candidate.name,
            email: candidate.email,
            phone: candidate.phone,
            resume: candidate.resumeFilename || undefined,
            answers: candidate.answers,
          }
        );
        // Clear stored questions after successful submission
        try { 
          localStorage.removeItem(LS_Q_KEY); 
        } catch {
          // Ignore localStorage errors
        }
        alert(`✅ Interview Completed!\n\nScore: ${res.data.score}/100\n\n${res.data.summary}`);
      } catch (err) {
        console.error("Error submitting answers:", err);
        alert("Failed to submit answers. Please try again.");
      } finally {
        setSubmitting(false);
      }
    };
    
    finishInterview();
  }, [candidate.currentQuestion, candidate.answers, candidate.name, candidate.email, candidate.phone, questions.length, currentQuestion]);

  const timePerDifficulty = { Easy: 20, Medium: 60, Hard: 120 };
  const questionTime = currentQuestion ? (timePerDifficulty[currentQuestion.difficulty] || 30) : 30;

  // Initialize/restore timer when question changes
  useEffect(() => {
    if (!currentQuestion) return;
    // If this is a new question (duration mismatch) or no saved time, initialize
    if (
      candidate.currentDuration !== questionTime ||
      !candidate.timeLeft || candidate.timeLeft <= 0
    ) {
      dispatch(setTimer({ duration: questionTime }));
    }
  }, [dispatch, candidate.currentQuestion, questionTime, candidate.currentDuration, candidate.timeLeft, currentQuestion]);

  // Loading state
  if (loading) {
    return (
      <div className="card card-lg shadow" style={{ textAlign: 'center' }}>
        <div className="card-body">
          <div style={{ width: 40, height: 40, border: '4px solid #0b1220', borderTop: '4px solid #3b82f6', borderRadius: '50%', margin: '0 auto 8px', animation: 'spin 1s linear infinite' }} />
          <p className="muted">Loading interview questions...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="card card-lg shadow" style={{ textAlign: 'center' }}>
        <div className="card-body">
          <div style={{ fontSize: 48, marginBottom: 8 }}>⚠️</div>
          <p className="muted" style={{ marginBottom: 12 }}>{error}</p>
          <button onClick={() => window.location.reload()} className="btn btn-primary">Retry</button>
        </div>
      </div>
    );
  }

  // Interview completed
  if (!currentQuestion && candidate.answers.length > 0) {
    return (
      <div className="card card-lg shadow" style={{ textAlign: 'center' }}>
        <div className="card-body">
          <div style={{ fontSize: 64, marginBottom: 8 }}>🎉</div>
          <h2 className="title">Interview Completed!</h2>
          <p className="muted">Thank you for your time. Your responses have been submitted.</p>
          {submitting && <p className="muted">Calculating your score...</p>}
          <div className="card" style={{ marginTop: 12 }}>
            <div className="card-body" style={{ textAlign: 'left' }}>
              <h3 className="section-title">Your Answers Summary</h3>
              <p>Total Questions: {questions.length}</p>
              <p>Answered: {candidate.answers.filter(a => a.attended).length}</p>
              <p>Skipped/Timeout: {candidate.answers.filter(a => !a.attended).length}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return <div className="card card-lg shadow"><div className="card-body"><p className="muted">Preparing interview...</p></div></div>;
  }

  const handleSubmit = () => {
    if (!input.trim()) return;

    dispatch(
      addAnswer({
        question: currentQuestion.text,
        answer: input.trim(),
        difficulty: currentQuestion.difficulty,
        attended: true,
        reason: "submitted",
      })
    );
    setInput("");
  };

  const handleTimeUp = () => {
    dispatch(
      addAnswer({
        question: currentQuestion.text,
        answer: input.trim() || "",
        difficulty: currentQuestion.difficulty,
        attended: false,
        reason: "timeout",
      })
    );
    setInput("");
  };

  const handleNext = () => {
    const trimmed = input.trim();
    if (trimmed) {
      dispatch(
        addAnswer({
          question: currentQuestion.text,
          answer: trimmed,
          difficulty: currentQuestion.difficulty,
          attended: true,
          reason: "next_with_answer",
        })
      );
    } else {
      dispatch(
        addAnswer({
          question: currentQuestion.text,
          answer: "",
          difficulty: currentQuestion.difficulty,
          attended: false,
          reason: "skipped",
        })
      );
    }
    setInput("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey && input.trim()) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isSubmitDisabled = !input.trim();

  return (
    <div className="card card-lg shadow">
      <div className="card-body">
      {/* Progress Header */}
      <div className="stack" style={{ marginBottom: '1rem' }}>
        <div className="row" style={{ gap: 8 }}>
          <span className="badge" style={{ background: '#f3f4f6', border: '1px solid var(--border)', color: 'var(--text)', fontWeight: 600 }}>Question {candidate.currentQuestion + 1}/{questions.length}</span>
          <span className={`badge ${currentQuestion.difficulty === 'Easy' ? 'badge-easy' : currentQuestion.difficulty === 'Medium' ? 'badge-medium' : 'badge-hard'}`}>
            {currentQuestion.difficulty}
          </span>
        </div>
        <div className="progress">
          <div className="progress-fill" style={{ width: `${((candidate.currentQuestion + 1) / questions.length) * 100}%` }} />
        </div>
      </div>

      {/* Question */}
      <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
        <div className="card-body">
          <h2 className="title" style={{ fontSize: '1.25rem' }}>{currentQuestion.text}</h2>
        </div>
      </div>

      {/* Timer */}
      <Timer
        key={`${candidate.currentQuestion}-${questionTime}-${candidate.timeLeft || 'init'}`}
        seconds={candidate.timeLeft && candidate.timeLeft > 0 ? candidate.timeLeft : questionTime}
        onTimeUp={handleTimeUp}
        onTick={(next) => dispatch(setTimeLeft(next))}
      />

      {/* Answer Input */}
      <div className="stack" style={{ marginTop: '1rem' }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your answer here... (Press Enter to submit)"
          className="textarea"
          rows={4}
        />
        <div className="row">
          <button 
            onClick={handleSubmit} 
            disabled={isSubmitDisabled} 
            className={`btn btn-primary ${isSubmitDisabled ? 'btn-muted' : ''}`}
            title={isSubmitDisabled ? 'Type an answer to submit' : 'Submit answer'}
          >
            Submit Answer
          </button>
          <button 
            onClick={handleNext} 
            className="btn btn-ghost"
          >
            {input.trim() ? "Submit & Next" : "Skip Question"}
          </button>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="divider" style={{ marginTop: '1rem' }} />
      <p className="muted" style={{ textAlign: 'center' }}>
        Answered: {candidate.answers.filter(a => a.attended).length} | Remaining: {questions.length - candidate.currentQuestion - 1}
      </p>
      </div>
    </div>
  );
}
