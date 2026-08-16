"use strict";

const fs = require("fs");
const path = require("path");
const { AgentVoiceController } = require("../../src/features/agent/voice/agentVoiceController.cjs");

const read = (...parts) => fs.readFileSync(path.join(__dirname, "..", "..", ...parts), "utf8");

describe("MyJourney Agent — Client Contract & Voice Integration", () => {
  // ───────────────────────────────────────────────────────────────────────────
  // 1. App.js Routes & Integration
  // ───────────────────────────────────────────────────────────────────────────
  describe("App routing & provider shell", () => {
    test("AgentPage and /agent route are registered in App.js", () => {
      const appCode = read("src", "App.js");
      expect(appCode).toContain('import("./features/agent/AgentPage.jsx")');
      expect(appCode).toContain('path: "agent/*"');
      expect(appCode).toContain("AgentProvider");
    });

    test("AppShell includes /agent in immersive check to avoid duplicate widgets/headers", () => {
      const appCode = read("src", "App.js");
      expect(appCode).toContain('location.pathname.startsWith("/agent")');
    });

    test("AskMyJourneyWidget is rendered in normal layout", () => {
      const appCode = read("src", "App.js");
      expect(appCode).toContain("<AskMyJourneyWidget />");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. AskMyJourneyWidget Migration
  // ───────────────────────────────────────────────────────────────────────────
  describe("AskMyJourneyWidget migration", () => {
    test("widget uses AgentContext and does not directly invoke legacy /api/ai/chat", () => {
      const widgetCode = read("src", "components", "shared", "AskMyJourneyWidget.jsx");
      expect(widgetCode).toContain("useAgent");
      expect(widgetCode).toContain("sendMessage");
      expect(widgetCode).not.toContain("apiService.post('/api/ai/chat'");
      expect(widgetCode).not.toContain('apiService.post("/api/ai/chat"');
      expect(widgetCode).toContain('to="/agent"');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. Voice Pipeline Contract
  // ───────────────────────────────────────────────────────────────────────────
  describe("AgentVoiceController state machine & pipeline", () => {
    const createMockSpeechToText = (overrides = {}) => ({
      isSupported: () => true,
      getPermissionState: async () => "granted",
      startListening: async () => "What are today's activities?",
      stopListening: jest.fn(),
      dispose: jest.fn(),
      cancel: jest.fn(),
      ...overrides,
    });

    const createMockTextToSpeech = (overrides = {}) => ({
      isSupported: () => true,
      speak: jest.fn(async () => {}),
      stopSpeaking: jest.fn(),
      dispose: jest.fn(),
      cancel: jest.fn(),
      ...overrides,
    });

    test("startListening transcribes speech, routes through sendMessage, and triggers text-to-speech", async () => {
      const speechToText = createMockSpeechToText();
      const textToSpeech = createMockTextToSpeech();
      const sendMessage = jest.fn(async (transcript, options) => ({
        assistantMessage: { content: "Here are your activities for today: 2 items planned." },
      }));

      const controller = new AgentVoiceController({
        speechToText,
        textToSpeech,
        sendMessage,
      });

      const stateTransitions = [];
      controller.subscribe((state) => stateTransitions.push(state.phase));

      await controller.startListening();

      expect(sendMessage).toHaveBeenCalledWith("What are today's activities?", { source: "voice" });
      expect(textToSpeech.speak).toHaveBeenCalledWith(
        "Here are your activities for today: 2 items planned."
      );
      expect(stateTransitions).toContain("listening");
      expect(stateTransitions).toContain("processing");
      expect(stateTransitions).toContain("speaking");
    });

    test("gracefully handles unsupported speech recognition in browser", async () => {
      const speechToText = createMockSpeechToText({ isSupported: () => false });
      const textToSpeech = createMockTextToSpeech();
      const sendMessage = jest.fn();

      const controller = new AgentVoiceController({
        speechToText,
        textToSpeech,
        sendMessage,
      });

      await controller.startListening();
      const snapshot = controller.getSnapshot();
      expect(snapshot.permissionState).toBe("unsupported");
      expect(snapshot.error).toContain("Voice isn't available in this browser");
      expect(sendMessage).not.toHaveBeenCalled();
    });

    test("gracefully handles microphone permission denied", async () => {
      const speechToText = createMockSpeechToText({ getPermissionState: async () => "denied" });
      const textToSpeech = createMockTextToSpeech();
      const sendMessage = jest.fn();

      const controller = new AgentVoiceController({
        speechToText,
        textToSpeech,
        sendMessage,
      });

      await controller.startListening();
      const snapshot = controller.getSnapshot();
      expect(snapshot.error).toContain("Microphone access is blocked");
      expect(sendMessage).not.toHaveBeenCalled();
    });

    test("stopSpeaking halts speech playback when active", () => {
      const speechToText = createMockSpeechToText();
      const textToSpeech = createMockTextToSpeech();
      const sendMessage = jest.fn();

      const controller = new AgentVoiceController({
        speechToText,
        textToSpeech,
        sendMessage,
      });

      controller.update({ phase: "speaking" });
      controller.stopSpeaking();
      expect(textToSpeech.stopSpeaking).toHaveBeenCalled();
      expect(controller.getSnapshot().phase).toBe("idle");
    });
  });
});
