import React, { useState } from "react";
import {
  FiAlertCircle,
  FiMic,
  FiMicOff,
  FiRotateCw,
  FiSettings,
  FiSquare,
  FiVolume2,
  FiVolumeX,
} from "react-icons/fi";
import useAgentVoice from "./useAgentVoice";

const phaseDescriptions = {
  idle: "Ready to listen",
  listening: "Listening… speak clearly into your microphone",
  processing: "Processing voice input…",
  speaking: "Speaking response…",
};

const permissionDescriptions = {
  granted: "Microphone access is active and allowed for MyJourney.",
  prompt: "Your browser will ask for microphone access when you start talking.",
  denied:
    "Microphone access is blocked in your browser. Click the lock/tune icon in your address bar to enable microphone access.",
  unknown:
    "Microphone permission is managed by your browser. MyJourney only requests access when you tap Talk.",
  unsupported:
    "Voice recognition is not supported in this browser. Please type your query.",
};

export default function VoiceControls({ sendMessage, disabled = false }) {
  const voice = useAgentVoice(sendMessage);
  const [permissionsOpen, setPermissionsOpen] = useState(false);

  const listening = voice.phase === "listening";
  const processing = voice.phase === "processing";
  const speaking = voice.phase === "speaking";
  const microphoneBlocked = voice.permissionState === "denied";

  if (!voice.speechToTextSupported) {
    return (
      <div className="agent-voice agent-voice--unsupported">
        <p role="status">
          <FiMicOff aria-hidden="true" style={{ verticalAlign: "middle", marginRight: 4 }} />
          Voice input is unavailable in this browser. You can continue using Ask MyJourney by typing.
        </p>
      </div>
    );
  }

  return (
    <div className="agent-voice">
      <div className="agent-voice__actions">
        {listening ? (
          <button
            type="button"
            className="agent-voice__talk is-listening"
            onClick={voice.stopListening}
            aria-label="Stop listening"
          >
            <FiSquare aria-hidden="true" />
            <span>Listening… (Stop)</span>
          </button>
        ) : processing ? (
          <button
            type="button"
            className="agent-voice__talk"
            disabled
            aria-label="Processing voice message"
          >
            <FiRotateCw aria-hidden="true" style={{ animation: "agent-spin 1s linear infinite" }} />
            <span>Processing voice…</span>
          </button>
        ) : (
          <button
            type="button"
            className="agent-voice__talk"
            onClick={voice.startListening}
            disabled={disabled || processing || microphoneBlocked}
            aria-describedby="agent-voice-status"
            title={microphoneBlocked ? "Microphone permission is blocked" : "Click to speak"}
          >
            <FiMic aria-hidden="true" />
            <span>Talk to MyJourney</span>
          </button>
        )}

        {speaking && (
          <button
            type="button"
            className="agent-voice__stop"
            onClick={voice.stopSpeaking}
            aria-label="Stop speaking"
          >
            <FiVolumeX aria-hidden="true" />
            <span>Stop speaking</span>
          </button>
        )}

        <button
          type="button"
          className="agent-voice__permissions"
          onClick={() => setPermissionsOpen((current) => !current)}
          aria-expanded={permissionsOpen}
          aria-controls="agent-voice-permissions"
          title="Microphone permissions"
        >
          <FiSettings aria-hidden="true" />
          <span>Permissions</span>
        </button>
      </div>

      <div className="agent-voice__meta">
        {listening && (
          <span id="agent-voice-status" className="agent-voice__status" role="status">
            ● {phaseDescriptions.listening}
          </span>
        )}

        {speaking && (
          <span className="agent-voice__status" role="status">
            <FiVolume2 aria-hidden="true" style={{ verticalAlign: "middle", marginRight: 4 }} />
            {phaseDescriptions.speaking}
          </span>
        )}

        {voice.textToSpeechSupported && (
          <label className="agent-voice__preference">
            <input
              type="checkbox"
              checked={voice.voiceRepliesEnabled}
              onChange={(event) => voice.setVoiceRepliesEnabled(event.target.checked)}
            />
            <span>Speak voice replies</span>
          </label>
        )}
      </div>

      {permissionsOpen && (
        <div id="agent-voice-permissions" className="agent-voice__permissions-help">
          <strong>Microphone Access: </strong>
          {permissionDescriptions[voice.permissionState] || permissionDescriptions.unknown}
        </div>
      )}

      {microphoneBlocked && (
        <p className="agent-voice__error" role="alert">
          <FiAlertCircle aria-hidden="true" style={{ verticalAlign: "middle", marginRight: 4 }} />
          Microphone permission denied. Enable microphone access in your browser settings to use voice.
        </p>
      )}

      {voice.error && !microphoneBlocked && (
        <p className="agent-voice__error" role="alert">
          {voice.error}
        </p>
      )}
    </div>
  );
}
