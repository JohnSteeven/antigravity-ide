import { useCallback, useEffect, useRef } from "react";
import { storyProgressApi } from "../services/apiService";

const FLUSH_INTERVAL_MS = 15_000;

export const useStoryReadingProgress = ({ storyId, enabled, progressPercent }) => {
  const activeSecondsRef = useRef(0);
  const progressRef = useRef(0);
  const positionRef = useRef(0);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  useEffect(() => {
    activeSecondsRef.current = 0;
    progressRef.current = 0;
    positionRef.current = 0;
  }, [storyId]);

  useEffect(() => {
    progressRef.current = Math.max(progressRef.current, Number(progressPercent) || 0);
    if (typeof window !== "undefined") positionRef.current = Math.max(positionRef.current, window.scrollY || 0);
  }, [progressPercent]);

  const flush = useCallback(() => {
    if (!enabledRef.current || !storyId) return;
    const activeReadingSeconds = activeSecondsRef.current;
    if (activeReadingSeconds <= 0 && progressRef.current <= 0) return;
    activeSecondsRef.current = 0;
    storyProgressApi.updateProgress({
      articleId: storyId,
      progressPercent: Math.round(progressRef.current * 10) / 10,
      lastPosition: Math.round(positionRef.current),
      activeReadingSeconds,
    }).catch(() => {
      activeSecondsRef.current += activeReadingSeconds;
    });
  }, [storyId]);

  useEffect(() => {
    if (!enabled || !storyId || typeof document === "undefined") return undefined;
    const activeTimer = window.setInterval(() => {
      if (document.visibilityState === "visible" && document.hasFocus()) {
        activeSecondsRef.current += 1;
      }
    }, 1000);
    const flushTimer = window.setInterval(flush, FLUSH_INTERVAL_MS);
    window.addEventListener("pagehide", flush);

    return () => {
      window.clearInterval(activeTimer);
      window.clearInterval(flushTimer);
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [storyId, enabled, flush]);
};
