import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useReducedMotion } from "framer-motion";
import { useAuth } from "../../hooks/useAuth";
import usePlayLife from "./state/usePlayLife";
import usePlayLifeAudio from "./audio/usePlayLifeAudio";
import SceneStage from "./components/SceneStage";
import {
  MoodDrawer,
  PlayLifeTopBar,
  SoundDrawer,
} from "./components/PlayLifeControls";
import "./play-life.css";

const getDisplayName = (user) => {
  if (user?.firstName) return user.firstName;
  if (user?.name) return user.name.split(" ")[0];
  if (user?.username) return user.username;
  return "there";
};

const PlayLifePage = () => {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const { user } = useAuth();
  const identity = useMemo(() => ({
    id: user?.id || user?._id || null,
    displayName: getDisplayName(user),
  }), [user]);
  const {
    state,
    scene,
    choose,
    changeMood,
    chooseInitialMood,
    sendText,
    setSound,
    goToScene,
  } = usePlayLife({ user: identity, reduceMotion });
  const [moodOpen, setMoodOpen] = useState(false);
  const [soundOpen, setSoundOpen] = useState(false);

  usePlayLifeAudio({ settings: state.soundSettings, atmosphere: scene.atmosphere });

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Play Life | MyJourney";
    document.body.classList.add("play-life-active");
    return () => {
      document.title = previousTitle;
      document.body.classList.remove("play-life-active");
    };
  }, []);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key !== "Escape") return;
      setMoodOpen(false);
      setSoundOpen(false);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  const handleChoice = (choiceId) => {
    const selected = scene.choices.find((choice) => choice.id === choiceId);
    if (selected?.next === "external-about") {
      navigate("/about");
      return;
    }
    choose(choiceId);
  };

  const handleMoodChange = (moodId) => {
    changeMood(moodId);
    setMoodOpen(false);
  };

  return (
    <div className="play-life" data-atmosphere={scene.atmosphere}>
      <div className="pl-environment" aria-hidden="true" />
      <div className="pl-light-layer" aria-hidden="true" />
      <PlayLifeTopBar
        mood={state.currentMood}
        onMoodOpen={() => setMoodOpen(true)}
        onSoundOpen={() => setSoundOpen(true)}
        onFinish={() => goToScene("session-checkout")}
      />
      <SceneStage
        scene={scene}
        state={state}
        onChoose={handleChoice}
        onMoodSelect={chooseInitialMood}
        onText={sendText}
        reducedMotion={Boolean(reduceMotion)}
      />
      <MoodDrawer
        open={moodOpen}
        onClose={() => setMoodOpen(false)}
        onSelect={handleMoodChange}
        reducedMotion={Boolean(reduceMotion)}
      />
      <SoundDrawer
        open={soundOpen}
        onClose={() => setSoundOpen(false)}
        settings={state.soundSettings}
        onChange={setSound}
      />
    </div>
  );
};

export default PlayLifePage;
