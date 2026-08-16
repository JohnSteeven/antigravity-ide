const { VOICE_ERROR_CODES } = require("./voiceProviders.cjs");

const initialVoiceState = (speechToText, textToSpeech) => ({
  phase: "idle",
  permissionState: speechToText.isSupported() ? "unknown" : "unsupported",
  error: "",
  transcript: "",
  voiceRepliesEnabled: true,
  speechToTextSupported: speechToText.isSupported(),
  textToSpeechSupported: textToSpeech.isSupported(),
});

class AgentVoiceController {
  constructor({ speechToText, textToSpeech, sendMessage }) {
    if (!speechToText || !textToSpeech || typeof sendMessage !== "function") {
      throw new TypeError(
        "AgentVoiceController requires speech, playback, and sendMessage providers."
      );
    }
    this.speechToText = speechToText;
    this.textToSpeech = textToSpeech;
    this.sendMessage = sendMessage;
    this.state = initialVoiceState(speechToText, textToSpeech);
    this.listeners = new Set();
    this.operation = 0;
    this.disposed = false;
  }

  getSnapshot() {
    return this.state;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  update(patch) {
    if (this.disposed) return;
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((listener) => listener(this.state));
  }

  async refreshPermission() {
    const permissionState = await this.speechToText.getPermissionState();
    this.update({ permissionState });
    return permissionState;
  }

  setVoiceRepliesEnabled(enabled) {
    const voiceRepliesEnabled = Boolean(enabled);
    if (!voiceRepliesEnabled) this.stopSpeaking();
    this.update({ voiceRepliesEnabled });
  }

  async startListening() {
    if (this.disposed || ["listening", "processing"].includes(this.state.phase)) {
      return null;
    }

    if (!this.speechToText.isSupported()) {
      this.update({
        phase: "idle",
        permissionState: "unsupported",
        error:
          "Voice isn't available in this browser. You can continue using Ask MyJourney by typing.",
      });
      return null;
    }

    if (this.state.phase === "speaking") this.stopSpeaking();
    const permissionState = await this.refreshPermission();
    if (permissionState === "denied") {
      this.update({
        phase: "idle",
        error:
          "Microphone access is blocked. Use Permissions for help, or continue by typing.",
      });
      return null;
    }

    const operation = ++this.operation;
    this.update({ phase: "listening", error: "", transcript: "" });

    try {
      const transcript = String(
        await this.speechToText.startListening()
      ).trim();
      if (operation !== this.operation || this.disposed) return null;
      if (!transcript) {
        this.update({ phase: "idle", error: "No speech was detected." });
        return null;
      }

      this.update({ phase: "processing", transcript });
      const result = await this.sendMessage(transcript, { source: "voice" });
      if (operation !== this.operation || this.disposed) return result;

      const responseText = String(
        result?.assistantMessage?.content || ""
      ).trim();
      if (
        responseText &&
        this.state.voiceRepliesEnabled &&
        this.textToSpeech.isSupported()
      ) {
        this.update({ phase: "speaking" });
        await this.textToSpeech.speak(result.assistantMessage.content);
      }
      if (operation === this.operation) {
        this.update({ phase: "idle", error: "" });
      }
      return result;
    } catch (error) {
      if (operation !== this.operation || this.disposed) return null;
      if (error?.code === VOICE_ERROR_CODES.PERMISSION_DENIED) {
        this.update({
          phase: "idle",
          permissionState: "denied",
          error:
            "Microphone access was denied. Use Permissions for help, or continue by typing.",
        });
        return null;
      }
      if (error?.code === VOICE_ERROR_CODES.LISTENING_STOPPED) {
        this.update({ phase: "idle", error: "" });
        return null;
      }
      this.update({
        phase: "idle",
        error:
          error?.code === VOICE_ERROR_CODES.NO_SPEECH
            ? "No speech was detected. You can try again or type your message."
            : error?.message ||
              "Voice input was unavailable. You can continue by typing.",
      });
      return null;
    }
  }

  stopListening() {
    if (this.state.phase !== "listening") return;
    this.speechToText.stopListening();
  }

  stopSpeaking() {
    if (this.state.phase !== "speaking") return;
    this.operation += 1;
    this.textToSpeech.stopSpeaking();
    this.update({ phase: "idle" });
  }

  dispose() {
    if (this.disposed) return;
    this.operation += 1;
    this.speechToText.dispose();
    this.textToSpeech.dispose();
    this.listeners.clear();
    this.disposed = true;
  }
}

module.exports = { AgentVoiceController, initialVoiceState };
