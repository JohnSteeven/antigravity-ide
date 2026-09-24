import React, { useState } from "react";
import { FiCheckCircle, FiXCircle } from "react-icons/fi";
import { learnApi } from "../../../services/apiService";

export default function QuizSection({
  courseSlug,
  lessonId,
  questions = [],
  initialPassed = false,
  onQuizPassed,
  disabled = false,
}) {
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [evaluation, setEvaluation] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [quizPassed, setQuizPassed] = useState(initialPassed);

  if (!questions || questions.length === 0) {
    return null;
  }

  const handleOptionSelect = (questionId, optionIndex) => {
    if (submitting) return;
    setEvaluation(null);
    setError("");
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Check that all questions have an answer selected
    const unanswered = questions.filter((q) => selectedAnswers[q.id] === undefined);
    if (unanswered.length > 0) {
      setError(`Please answer question ${questions.findIndex((q) => q.id === unanswered[0].id) + 1} before submitting.`);
      return;
    }

    setSubmitting(true);
    try {
      const result = await learnApi.evaluateQuiz(courseSlug, lessonId, {
        answers: selectedAnswers,
      });

      const data = result?.data || result;
      setEvaluation(data);
      if (data?.passed) {
        setQuizPassed(true);
        if (onQuizPassed) onQuizPassed();
      }
    } catch (err) {
      setError(err.message || "Failed to submit quiz answers.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="learn-quiz" aria-labelledby="lesson-quiz-heading">
      <header className="learn-quiz__header">
        <h2 id="lesson-quiz-heading">Lesson Quiz</h2>
        <p className="learn-quiz__kicker">
          Test your understanding before completing this lesson.
        </p>
        {quizPassed && (
          <span className="learn-quiz__badge learn-quiz__badge--passed">
            ✓ Quiz Passed
          </span>
        )}
      </header>

      {error && (
        <div className="learn-notice learn-notice--error" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="learn-quiz__form">
        {questions.map((q, qIndex) => {
          const evalResult = evaluation?.results?.find((r) => r.questionId === q.id);
          const hasEvaluated = Boolean(evalResult);

          return (
            <fieldset
              key={q.id}
              className={`learn-quiz__question ${
                hasEvaluated
                  ? evalResult.correct
                    ? "learn-quiz__question--correct"
                    : "learn-quiz__question--incorrect"
                  : ""
              }`}
            >
              <legend>
                <span className="learn-quiz__num">{qIndex + 1}.</span> {q.question}
              </legend>
              {hasEvaluated && (
                <span className={`learn-quiz__question-result ${evalResult.correct ? "is-correct" : "is-incorrect"}`}>
                  {evalResult.correct ? <FiCheckCircle aria-hidden="true" /> : <FiXCircle aria-hidden="true" />}
                  {evalResult.correct ? "Correct" : "Review answer"}
                </span>
              )}

              <div className="learn-quiz__options" role="radiogroup">
                {(q.options || []).map((option, oIndex) => {
                  const isSelected = selectedAnswers[q.id] === oIndex;
                  let optionClass = "learn-quiz__option";

                  if (hasEvaluated) {
                    if (oIndex === evalResult.correctOptionIndex) {
                      optionClass += " learn-quiz__option--correct-answer";
                    } else if (isSelected && !evalResult.correct) {
                      optionClass += " learn-quiz__option--wrong-selected";
                    }
                  } else if (isSelected) {
                    optionClass += " learn-quiz__option--selected";
                  }

                  return (
                    <label key={option.id || oIndex} className={optionClass}>
                      <input
                        type="radio"
                        name={`quiz-q-${q.id}`}
                        value={oIndex}
                        checked={isSelected}
                        onChange={() => handleOptionSelect(q.id, oIndex)}
                        disabled={submitting || disabled}
                      />
                      <span className="learn-quiz__option-text">{option.text}</span>
                      {hasEvaluated && oIndex === evalResult.correctOptionIndex && (
                        <FiCheckCircle className="learn-quiz__option-check" aria-label="Correct answer" />
                      )}
                    </label>
                  );
                })}
              </div>

              {hasEvaluated && evalResult.explanation && (
                <div className="learn-quiz__explanation">
                  <strong>{evalResult.correct ? "✓ Correct!" : "✗ Explanation:"}</strong>{" "}
                  {evalResult.explanation}
                </div>
              )}
            </fieldset>
          );
        })}

        <div className="learn-quiz__actions">
          <button
            type="submit"
            className="learn-btn learn-btn--primary"
            disabled={submitting || disabled}
          >
            {submitting ? "Evaluating…" : evaluation ? "Re-evaluate Quiz" : "Submit Quiz"}
          </button>

          {evaluation && (
            <div className="learn-quiz__result-summary" role="status" aria-live="polite">
              {evaluation.passed ? (
                <span className="learn-quiz__status learn-quiz__status--passed">
                  🎉 Passed! Score: {evaluation.score}%{evaluation.bestScore !== undefined ? ` (Best: ${evaluation.bestScore}%, ${evaluation.attempts || 1} attempt${evaluation.attempts === 1 ? "" : "s"})` : ""}
                </span>
              ) : (
                <span className="learn-quiz__status learn-quiz__status--failed">
                  Score: {evaluation.score}%{evaluation.bestScore !== undefined ? ` (Best: ${evaluation.bestScore}%, ${evaluation.attempts || 1} attempt${evaluation.attempts === 1 ? "" : "s"})` : ""}. Review the explanations and retry.
                </span>
              )}
            </div>
          )}
        </div>
      </form>
    </section>
  );
}
