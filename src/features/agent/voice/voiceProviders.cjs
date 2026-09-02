const VOICE_ERROR_CODES = Object.freeze({
  UNSUPPORTED: "VOICE_UNSUPPORTED",
  PERMISSION_DENIED: "VOICE_PERMISSION_DENIED",
  NO_SPEECH: "VOICE_NO_SPEECH",
  LISTENING_STOPPED: "VOICE_LISTENING_STOPPED",
  UNAVAILABLE: "VOICE_UNAVAILABLE",
});

class VoiceProviderError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "VoiceProviderError";
    this.code = code;
  }
}

class SpeechToTextProvider {
  isSupported() {
    return false;
  }

  async getPermissionState() {
    return "unsupported";
  }

  async startListening() {
    throw new VoiceProviderError(
      VOICE_ERROR_CODES.UNSUPPORTED,
      "Speech recognition is not supported."
    );
  }

  stopListening() {}

  dispose() {}
}

class TextToSpeechProvider {
  isSupported() {
    return false;
  }

  async speak() {
    throw new VoiceProviderError(
      VOICE_ERROR_CODES.UNSUPPORTED,
      "Speech output is not supported."
    );
  }

  stopSpeaking() {}

  dispose() {}
}

const recognitionConstructor = (browser) =>
  browser?.SpeechRecognition || browser?.webkitSpeechRecognition || null;

class BrowserSpeechToTextProvider extends SpeechToTextProvider {
  constructor(browser = typeof window !== "undefined" ? window : null) {
    super();
    this.browser = browser;
    this.recognition = null;
    this.permissionState = null;
    this.pending = null;
  }

  isSupported() {
    return Boolean(recognitionConstructor(this.browser));
  }

  async getPermissionState() {
    if (!this.isSupported()) return "unsupported";
    if (this.permissionState === "denied") return "denied";

    const permissions = this.browser?.navigator?.permissions;
    if (!permissions?.query) return this.permissionState || "unknown";

    try {
      const status = await permissions.query({ name: "microphone" });
      if (["granted", "denied", "prompt"].includes(status?.state)) {
        this.permissionState = status.state;
      }
    } catch (_error) {
      // Some browsers expose the Permissions API without accepting microphone.
    }

    return this.permissionState || "unknown";
  }

  async startListening({ language } = {}) {
    if (!this.isSupported()) {
      throw new VoiceProviderError(
        VOICE_ERROR_CODES.UNSUPPORTED,
        "Voice isn't available in this browser."
      );
    }
    if (this.pending) {
      throw new VoiceProviderError(
        VOICE_ERROR_CODES.UNAVAILABLE,
        "The microphone is already listening."
      );
    }

    const permission = await this.getPermissionState();
    if (permission === "denied") {
      throw new VoiceProviderError(
        VOICE_ERROR_CODES.PERMISSION_DENIED,
        "Microphone permission is blocked."
      );
    }

    const Recognition = recognitionConstructor(this.browser);
    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.lang =
      language ||
      this.browser?.document?.documentElement?.lang ||
      this.browser?.navigator?.language ||
      "en";
    this.recognition = recognition;

    return new Promise((resolve, reject) => {
      let settled = false;
      let transcript = "";

      const finish = (error) => {
        if (settled) return;
        settled = true;
        this.pending = null;
        this.recognition = null;
        if (error) reject(error);
        else resolve(transcript.trim());
      };

      this.pending = { finish };

      recognition.onresult = (event) => {
        const results = event?.results || [];
        const parts = [];
        for (let index = 0; index < results.length; index += 1) {
          const result = results[index];
          if (result?.isFinal === false) continue;
          const value = result?.[0]?.transcript;
          if (value) parts.push(value);
        }
        transcript = parts.join(" ").trim();
        if (transcript) finish();
      };

      recognition.onerror = (event) => {
        const reason = event?.error || "unavailable";
        if (["not-allowed", "service-not-allowed"].includes(reason)) {
          this.permissionState = "denied";
          finish(
            new VoiceProviderError(
              VOICE_ERROR_CODES.PERMISSION_DENIED,
              "Microphone permission was denied."
            )
          );
          return;
        }
        if (reason === "no-speech") {
          finish(
            new VoiceProviderError(
              VOICE_ERROR_CODES.NO_SPEECH,
              "No speech was detected."
            )
          );
          return;
        }
        finish(
          new VoiceProviderError(
            VOICE_ERROR_CODES.UNAVAILABLE,
            "Voice input was unavailable."
          )
        );
      };

      recognition.onend = () => {
        if (!settled) {
          finish(
            transcript
              ? null
              : new VoiceProviderError(
                  VOICE_ERROR_CODES.LISTENING_STOPPED,
                  "Listening stopped before speech was recognized."
                )
          );
        }
      };

      try {
        // This is the only operation that may show a microphone prompt. It is
        // reached exclusively from the user's explicit press-to-talk action.
        recognition.start();
      } catch (_error) {
        finish(
          new VoiceProviderError(
            VOICE_ERROR_CODES.UNAVAILABLE,
            "Voice input could not be started."
          )
        );
      }
    });
  }

  stopListening() {
    if (!this.recognition) return;
    try {
      this.recognition.stop();
    } catch (_error) {
      this.pending?.finish(
        new VoiceProviderError(
          VOICE_ERROR_CODES.LISTENING_STOPPED,
          "Listening stopped."
        )
      );
    }
  }

  dispose() {
    const recognition = this.recognition;
    this.recognition = null;
    if (recognition) {
      try {
        recognition.abort();
      } catch (_error) {
        // The browser may already have ended the recognition session.
      }
    }
    this.pending?.finish(
      new VoiceProviderError(
        VOICE_ERROR_CODES.LISTENING_STOPPED,
        "Listening stopped."
      )
    );
    this.pending = null;
  }
}

class BrowserTextToSpeechProvider extends TextToSpeechProvider {
  constructor(browser = typeof window !== "undefined" ? window : null) {
    super();
    this.browser = browser;
    this.active = null;
  }

  isSupported() {
    return Boolean(
      this.browser?.speechSynthesis && this.browser?.SpeechSynthesisUtterance
    );
  }

  async speak(text, { language } = {}) {
    const content = String(text || "").trim();
    if (!content) return { stopped: false };
    if (!this.isSupported()) {
      throw new VoiceProviderError(
        VOICE_ERROR_CODES.UNSUPPORTED,
        "Spoken replies are not supported in this browser."
      );
    }

    this.stopSpeaking();
    const utterance = new this.browser.SpeechSynthesisUtterance(content);
    if (language) utterance.lang = language;

    return new Promise((resolve, reject) => {
      let settled = false;
      const finish = (value, error) => {
        if (settled) return;
        settled = true;
        this.active = null;
        if (error) reject(error);
        else resolve(value);
      };

      this.active = {
        finish: () => finish({ stopped: true }),
        utterance,
      };
      utterance.onend = () => finish({ stopped: false });
      utterance.onerror = (event) => {
        if (event?.error === "canceled" || event?.error === "interrupted") {
          finish({ stopped: true });
          return;
        }
        finish(
          null,
          new VoiceProviderError(
            VOICE_ERROR_CODES.UNAVAILABLE,
            "Spoken output was unavailable."
          )
        );
      };
      this.browser.speechSynthesis.speak(utterance);
    });
  }

  stopSpeaking() {
    if (!this.isSupported()) return;
    this.browser.speechSynthesis.cancel();
    this.active?.finish();
    this.active = null;
  }

  dispose() {
    this.stopSpeaking();
  }
}

module.exports = {
  VOICE_ERROR_CODES,
  VoiceProviderError,
  SpeechToTextProvider,
  TextToSpeechProvider,
  BrowserSpeechToTextProvider,
  BrowserTextToSpeechProvider,
};
