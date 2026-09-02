import { useEffect, useMemo, useState } from "react";
import { FiPause, FiPlay } from "react-icons/fi";
import ChoiceField from "./ChoiceField";

const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
};

const ActionMoment = ({ scene, onChoose, reducedMotion }) => {
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(scene.duration || 0);

  useEffect(() => {
    setRunning(false);
    setRemaining(scene.duration || 0);
  }, [scene.id, scene.duration]);

  useEffect(() => {
    if (!running || remaining <= 0) return undefined;
    const timer = window.setInterval(() => {
      setRemaining((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [remaining, running]);

  useEffect(() => {
    if (remaining === 0) setRunning(false);
  }, [remaining]);

  const progress = useMemo(() => {
    if (!scene.duration) return 0;
    return ((scene.duration - remaining) / scene.duration) * 100;
  }, [remaining, scene.duration]);

  return (
    <div className="pl-action-moment">
      {scene.actionPlan?.steps?.length > 0 && (
        <ol className="pl-action-steps">
          {scene.actionPlan.steps.map((step) => <li key={step}>{step}</li>)}
        </ol>
      )}

      {scene.duration > 0 && (
        <div className={`pl-timer ${scene.breath ? "is-breath" : ""} ${running ? "is-running" : ""}`}>
          <div className="pl-timer-ring" style={{ "--pl-progress": `${progress * 3.6}deg` }}>
            <strong>{formatTime(remaining)}</strong>
            <span>{scene.breath && running ? "Follow your breath" : remaining === 0 ? "Complete" : "Ready when you are"}</span>
          </div>
          <button
            type="button"
            className="pl-timer-control"
            onClick={() => setRunning((current) => !current)}
            aria-label={running ? "Pause timer" : "Start timer"}
            title={running ? "Pause timer" : "Start timer"}
          >
            {running ? <FiPause /> : <FiPlay />}
          </button>
        </div>
      )}

      <ChoiceField choices={scene.choices} onChoose={onChoose} reducedMotion={reducedMotion} />
    </div>
  );
};

export default ActionMoment;
