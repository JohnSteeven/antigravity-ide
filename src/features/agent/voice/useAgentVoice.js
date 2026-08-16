import { useEffect, useRef, useState } from "react";
import voiceProviderModule from "./voiceProviders.cjs";
import voiceControllerModule from "./agentVoiceController.cjs";

const {
  BrowserSpeechToTextProvider,
  BrowserTextToSpeechProvider,
} = voiceProviderModule;
const { AgentVoiceController } = voiceControllerModule;

export default function useAgentVoice(sendMessage) {
  const sendMessageRef = useRef(sendMessage);
  const controllerRef = useRef(null);
  sendMessageRef.current = sendMessage;

  if (!controllerRef.current) {
    controllerRef.current = new AgentVoiceController({
      speechToText: new BrowserSpeechToTextProvider(),
      textToSpeech: new BrowserTextToSpeechProvider(),
      sendMessage: (...args) => sendMessageRef.current(...args),
    });
  }

  const [state, setState] = useState(() =>
    controllerRef.current.getSnapshot()
  );

  useEffect(() => {
    const controller = controllerRef.current;
    const unsubscribe = controller.subscribe(setState);
    controller.refreshPermission().catch(() => {});
    return () => {
      unsubscribe();
      controller.dispose();
    };
  }, []);

  const controller = controllerRef.current;
  return {
    ...state,
    startListening: () => controller.startListening(),
    stopListening: () => controller.stopListening(),
    stopSpeaking: () => controller.stopSpeaking(),
    setVoiceRepliesEnabled: (enabled) =>
      controller.setVoiceRepliesEnabled(enabled),
    refreshPermission: () => controller.refreshPermission(),
  };
}
