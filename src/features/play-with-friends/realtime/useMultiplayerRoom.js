import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const getSocketOrigin = () => {
  if (typeof process !== "undefined" && process.env?.PARCEL_API_URL) {
    return process.env.PARCEL_API_URL.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    const loc = window.location;
    if ((loc.hostname === "localhost" || loc.hostname === "127.0.0.1") && loc.port === "1234") {
      return `${loc.protocol}//${loc.hostname}:5000`;
    }
    return loc.origin;
  }
  return "";
};

const makeRequestId = () => globalThis.crypto?.randomUUID?.() ||
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
    const value = Math.random() * 16 | 0;
    return (character === "x" ? value : (value & 0x3) | 0x8).toString(16);
  });

const useMultiplayerRoom = ({ token, initialRoom, onInvalidSession }) => {
  const socketRef = useRef(null);
  const [room, setRoom] = useState(initialRoom || null);
  const [connection, setConnection] = useState(token ? "connecting" : "idle");
  const [error, setError] = useState("");

  useEffect(() => {
    setRoom(initialRoom || null);
  }, [initialRoom]);

  useEffect(() => {
    if (!token) return undefined;
    const socketOrigin = getSocketOrigin();
    const socket = io(`${socketOrigin}/multiplayer`, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });
    socketRef.current = socket;
    setConnection("connecting");

    socket.on("connect", () => {
      setConnection("connected");
      setError("");
    });
    socket.on("disconnect", (reason) => {
      setConnection(reason === "io client disconnect" ? "idle" : "disconnected");
    });
    socket.on("connect_error", (socketError) => {
      setConnection("disconnected");
      if (socketError.data?.code === "MULTIPLAYER_INVALID_TOKEN") {
        setError(socketError.data?.message || "This game session is no longer active.");
        onInvalidSession?.();
      } else {
        console.warn("Multiplayer connection retrying...", socketError.message);
      }
    });
    socket.on("room:update", (state) => {
      setRoom(state);
      setError("");
    });
    socket.on("game:error", (payload) => setError(payload.message));
    socket.on("session:removed", (payload) => {
      setError(payload.message);
      onInvalidSession?.();
    });
    socket.on("session:replaced", (payload) => {
      setError(payload.message);
      setConnection("idle");
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, onInvalidSession]);

  const command = useCallback((eventName, payload = {}) => new Promise((resolve, reject) => {
    const socket = socketRef.current;
    if (!socket?.connected) {
      const unavailable = new Error("The room is reconnecting. Try again in a moment.");
      unavailable.code = "MULTIPLAYER_SERVER_UNAVAILABLE";
      reject(unavailable);
      return;
    }
    const timer = window.setTimeout(() => reject(new Error("The game server did not respond in time.")), 8000);
    socket.emit(eventName, { requestId: makeRequestId(), ...payload }, (response) => {
      window.clearTimeout(timer);
      if (!response?.ok) {
        const commandError = new Error(response?.error?.message || "That action could not be completed.");
        Object.assign(commandError, response?.error);
        reject(commandError);
        return;
      }
      if (response.room) setRoom(response.room);
      setError("");
      resolve(response);
    });
  }), []);

  return { command, connection, error, room, setError };
};

export default useMultiplayerRoom;
