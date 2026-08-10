import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiSend } from "react-icons/fi";
import ActionMoment from "./ActionMoment";
import ChoiceField from "./ChoiceField";
import MoodChooser from "./MoodChooser";

const SceneVisual = ({ scene, currentMood }) => (
  <div className="pl-scene-visual" aria-hidden="true">
    <div className="pl-sky-line" />
    <div className="pl-distant-path" />
    <div className={`pl-presence presence-${currentMood?.id || "neutral"}`}>
      <i />
      <i />
      <i />
    </div>
    {scene.atmosphere === "sad" && <div className="pl-rain" />}
    {scene.atmosphere === "excited" && <div className="pl-sparks" />}
  </div>
);

const PrivateTextMoment = ({ onSubmit }) => {
  const [value, setValue] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!value.trim()) return;
    onSubmit(value.trim());
    setValue("");
  };

  return (
    <form className="pl-text-moment" onSubmit={handleSubmit}>
      <label htmlFor="play-life-private-text">What is here right now?</label>
      <textarea
        id="play-life-private-text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="A few honest words..."
        rows="4"
      />
      <button type="submit" disabled={!value.trim()}>
        Continue <FiSend />
      </button>
    </form>
  );
};

const SceneStage = ({ scene, state, onChoose, onMoodSelect, onText, reducedMotion }) => {
  const transition = {
    duration: reducedMotion ? 0 : 0.52,
    ease: [0.22, 1, 0.36, 1],
  };
  const sceneKey = `${scene.id}-${state.interactionHistory.length}`;

  return (
    <main className="pl-stage">
      <SceneVisual scene={scene} currentMood={state.currentMood} />
      <AnimatePresence mode="wait">
        <motion.section
          className={`pl-scene pl-scene-${scene.type}`}
          key={sceneKey}
          initial={reducedMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reducedMotion ? undefined : { opacity: 0, y: -12 }}
          transition={transition}
          aria-labelledby="pl-scene-title"
        >
          <div className="pl-narrative">
            <span className="pl-eyebrow">{scene.eyebrow}</span>
            <h1 id="pl-scene-title" aria-live="polite">{scene.message}</h1>
            {scene.secondaryMessage && <p>{scene.secondaryMessage}</p>}

            {scene.story?.lines?.length > 0 && (
              <div className="pl-story-lines">
                {scene.story.lines.map((line) => <p key={line}>{line}</p>)}
              </div>
            )}

            {scene.type === "summary" && (
              <div className="pl-session-glance" aria-label="Session summary">
                <span>{state.choices.length}<small>choices</small></span>
                <span>{state.actionsTaken.length}<small>actions</small></span>
                <span>{state.savedMoments.length}<small>memories</small></span>
              </div>
            )}
          </div>

          <div className="pl-interaction-zone">
            {scene.type === "mood" && (
              <MoodChooser onSelect={onMoodSelect} reducedMotion={reducedMotion} />
            )}
            {scene.type === "text" && <PrivateTextMoment onSubmit={onText} />}
            {scene.type === "action" ? (
              <ActionMoment scene={scene} onChoose={onChoose} reducedMotion={reducedMotion} />
            ) : scene.type !== "mood" && scene.type !== "text" ? (
              <ChoiceField choices={scene.choices} onChoose={onChoose} reducedMotion={reducedMotion} />
            ) : null}
          </div>
        </motion.section>
      </AnimatePresence>
    </main>
  );
};

export default SceneStage;
