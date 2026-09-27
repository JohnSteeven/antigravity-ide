import React, { useEffect, useRef } from "react";
import "@mux/mux-player/dist/mux-player.js";

export default function MuxVideoPlayer({ playback, title, onError }) {
  const playerRef = useRef(null);
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return undefined;
    player.addEventListener("error", onError);
    return () => player.removeEventListener("error", onError);
  }, [onError]);
  return <mux-player ref={playerRef} playback-id={playback.playbackId} playback-token={playback.tokens.playback} stream-type="on-demand" title={title} style={{ width: "100%", aspectRatio: "16 / 9" }} />;
}
