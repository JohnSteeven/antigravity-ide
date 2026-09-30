import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { FiArrowLeft, FiRefreshCw, FiHome } from "react-icons/fi";
import "./this-or-that.css";

const QUESTIONS = [
  {
    id: "routine-spontaneity",
    prompt: "How would you rather spend a completely open weekend?",
    choiceA: { label: "A slow, familiar morning with books and coffee", type: "grounded" },
    choiceB: { label: "A sudden road trip or spontaneous new adventure", type: "exploratory" },
  },
  {
    id: "risk-security",
    prompt: "Choose your ideal financial relationship:",
    choiceA: { label: "Guaranteed quiet stability and predictable peace", type: "grounded" },
    choiceB: { label: "High-stakes upside with creative freedom and risk", type: "exploratory" },
  },
  {
    id: "nature-city",
    prompt: "Where does your heart reset most deeply?",
    choiceA: { label: "A secluded cabin surrounded by quiet trees", type: "grounded" },
    choiceB: { label: "A lively neighborhood pulsing with art and cafes", type: "exploratory" },
  },
  {
    id: "craft-breadth",
    prompt: "If you could receive one gift of mastery:",
    choiceA: { label: "World-class mastery of one single craft", type: "grounded" },
    choiceB: { label: "Working fluency in dozens of distinct subjects", type: "exploratory" },
  },
  {
    id: "time-energy",
    prompt: "Pick one impossible advantage:",
    choiceA: { label: "An extra 2 hours of quiet time every single day", type: "grounded" },
    choiceB: { label: "Unbreakable mental energy that never flags", type: "exploratory" },
  },
  {
    id: "solitude-connection",
    prompt: "After a grueling week, what heals you fastest?",
    choiceA: { label: "Complete solitary retreat with zero obligations", type: "grounded" },
    choiceB: { label: "A heartfelt dinner with three closest companions", type: "exploratory" },
  },
  {
    id: "legacy-experience",
    prompt: "Looking back at the end of your life, you hope to see:",
    choiceA: { label: "Enduring works and stability left for others", type: "grounded" },
    choiceB: { label: "A kaleidoscope of wild stories and varied seasons", type: "exploratory" },
  },
  {
    id: "structure-flow",
    prompt: "How do you do your best creative work?",
    choiceA: { label: "Disciplined daily blocks and deliberate habits", type: "grounded" },
    choiceB: { label: "Furious midnight bursts when inspiration strikes", type: "exploratory" },
  },
  {
    id: "clarity-mystery",
    prompt: "Would you rather understand completely:",
    choiceA: { label: "The precise emotional truth of the people around you", type: "grounded" },
    choiceB: { label: "The grand mysteries of the cosmos and time", type: "exploratory" },
  },
  {
    id: "present-future",
    prompt: "Where does your mind naturally drift when you daydream?",
    choiceA: { label: "Protecting and deepening what is already good", type: "grounded" },
    choiceB: { label: "Imagining a completely reinvention of tomorrow", type: "exploratory" },
  },
];

const ARCHETYPES = {
  deeplyGrounded: {
    title: "The Grounded Architect",
    icon: "🏛️",
    desc: "You treasure stability, intentional depth, and enduring craft. You build lasting foundations rather than chasing fleeting noise, finding wonder in daily mastery and genuine peace.",
  },
  balanced: {
    title: "The Mindful Navigator",
    icon: "🧭",
    desc: "You fluidly balance the sanctuary of quiet routines with the thrill of spontaneous discovery. You know when to root down and when to set sail.",
  },
  boldlyExploratory: {
    title: "The Free Spirit",
    icon: "✨",
    desc: "You are energized by curiosity, fresh perspectives, and bold horizons. For you, life is an unfolding adventure of ideas, experiences, and reinvention.",
  },
};

const ThisOrThatGame = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [completed, setCompleted] = useState(false);

  const currentQ = QUESTIONS[currentIndex];

  const handleChoice = useCallback((type) => {
    const updated = [...answers, type];
    setAnswers(updated);
    if (currentIndex + 1 < QUESTIONS.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCompleted(true);
    }
  }, [answers, currentIndex]);

  const restart = () => {
    setCurrentIndex(0);
    setAnswers([]);
    setCompleted(false);
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const onKeyDown = (e) => {
      if (completed) return;
      if (e.key === "1" || e.key === "ArrowLeft") {
        handleChoice(currentQ.choiceA.type);
      } else if (e.key === "2" || e.key === "ArrowRight") {
        handleChoice(currentQ.choiceB.type);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [completed, currentQ, handleChoice]);

  const resultArchetype = () => {
    const groundedCount = answers.filter((t) => t === "grounded").length;
    if (groundedCount >= 7) return ARCHETYPES.deeplyGrounded;
    if (groundedCount <= 3) return ARCHETYPES.boldlyExploratory;
    return ARCHETYPES.balanced;
  };

  const progressPercent = Math.round(((currentIndex + 1) / QUESTIONS.length) * 100);

  return (
    <div className="tot-container">
      <header className="tot-header">
        <Link to="/play" className="tot-back-link">
          <FiArrowLeft /> Back to Play Hub
        </Link>
        {!completed && (
          <>
            <div className="tot-progress-text">
              Question {currentIndex + 1} of {QUESTIONS.length}
            </div>
            <div className="tot-progress-bar-wrap" role="progressbar" aria-valuenow={progressPercent} aria-valuemin="0" aria-valuemax="100">
              <div className="tot-progress-bar" style={{ width: `${progressPercent}%` }} />
            </div>
          </>
        )}
      </header>

      {!completed ? (
        <section className="tot-card" aria-labelledby="tot-prompt">
          <h2 id="tot-prompt" className="tot-question-prompt">{currentQ.prompt}</h2>
          <div className="tot-choice-grid">
            <button
              type="button"
              className="tot-choice-btn"
              onClick={() => handleChoice(currentQ.choiceA.type)}
            >
              <span className="tot-choice-label-key">Option A (Key 1 / ←)</span>
              <span>{currentQ.choiceA.label}</span>
            </button>
            <button
              type="button"
              className="tot-choice-btn"
              onClick={() => handleChoice(currentQ.choiceB.type)}
            >
              <span className="tot-choice-label-key">Option B (Key 2 / →)</span>
              <span>{currentQ.choiceB.label}</span>
            </button>
          </div>
        </section>
      ) : (
        <section className="tot-card tot-result-card" aria-labelledby="tot-result-title">
          <span className="tot-result-icon">{resultArchetype().icon}</span>
          <h2 id="tot-result-title" className="tot-result-title">Your Reflection Archetype</h2>
          <span className="tot-result-archetype">{resultArchetype().title}</span>
          <p className="tot-result-desc">{resultArchetype().desc}</p>
          <div className="tot-actions">
            <button type="button" className="tot-btn-primary" onClick={restart}>
              <FiRefreshCw /> Play Again
            </button>
            <Link to="/play" className="tot-btn-secondary">
              <FiHome /> Return to Play Hub
            </Link>
          </div>
        </section>
      )}
    </div>
  );
};

export default ThisOrThatGame;
