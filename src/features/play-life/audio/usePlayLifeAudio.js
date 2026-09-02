import { useEffect } from "react";
import { setGameVolume, startMusicLoop, stopMusicLoop } from "../../../utils/gameAudioEngine";

const usePlayLifeAudio = ({ settings }) => {
  useEffect(() => {
    if (settings?.volume !== undefined) {
      setGameVolume(settings.volume);
    }
    if (settings?.music || settings?.ambient) {
      startMusicLoop("play-life");
    } else {
      stopMusicLoop();
    }
    return () => {
      stopMusicLoop();
    };
  }, [settings?.music, settings?.ambient, settings?.volume]);
};

export default usePlayLifeAudio;
