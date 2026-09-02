import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import agentApi from "./api/agentApi";

const AgentContext = createContext(null);

const conversationIdOf = (conversation) => conversation?._id || conversation?.id || null;
const messageIdOf = (message) =>
  message?._id || message?.id || message?.clientRequestId || null;

const makeRequestId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `agent-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const conversationsFrom = (result) =>
  Array.isArray(result)
    ? result
    : result?.conversations || result?.items || [];

const messagesFrom = (result) =>
  Array.isArray(result) ? result : result?.messages || result?.items || [];

export function AgentProvider({ children }) {
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [capabilities, setCapabilities] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [conversationCursor, setConversationCursor] = useState(null);
  const [messageCursor, setMessageCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const activeConversationIdRef = useRef(null);
  const requestControllerRef = useRef(null);
  const identityRef = useRef(null);

  const pageContext = useMemo(
    () => ({ currentRoute: location.pathname }),
    [location.pathname]
  );

  const rememberConversation = useCallback((conversation) => {
    const id = conversationIdOf(conversation);
    if (!id) return;
    setConversations((current) => {
      const without = current.filter((item) => conversationIdOf(item) !== id);
      return [conversation, ...without];
    });
  }, []);

  const resetForIdentity = useCallback(() => {
    requestControllerRef.current?.abort();
    requestControllerRef.current = null;
    activeConversationIdRef.current = null;
    setCapabilities(null);
    setConversations([]);
    setActiveConversationId(null);
    setMessages([]);
    setConversationCursor(null);
    setMessageCursor(null);
    setSending(false);
    setError("");
  }, []);

  const loadConversations = useCallback(async ({ append = false } = {}) => {
    const cursor = append ? conversationCursor : null;
    setLoading(true);
    setError("");
    try {
      const result = await agentApi.listConversations({ cursor });
      const next = conversationsFrom(result);
      setConversations((current) => (append ? [...current, ...next] : next));
      setConversationCursor(result?.nextCursor || null);
      return next;
    } catch (loadError) {
      setError(loadError.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [conversationCursor]);

  useEffect(() => {
    if (authLoading) return undefined;
    const identity = user?._id || user?.id || "anonymous";
    if (identityRef.current === identity) return undefined;
    identityRef.current = identity;
    resetForIdentity();
    let active = true;

    const requests = user
      ? [agentApi.capabilities(), agentApi.listConversations()]
      : [agentApi.capabilities()];
    Promise.allSettled(requests).then(
      ([capabilityResult, conversationResult]) => {
        if (!active) return;
        if (capabilityResult.status === "fulfilled") {
          setCapabilities(capabilityResult.value);
        }
        if (conversationResult?.status === "fulfilled") {
          const result = conversationResult.value;
          setConversations(conversationsFrom(result));
          setConversationCursor(result?.nextCursor || null);
        }
      }
    );

    return () => {
      active = false;
    };
  }, [authLoading, resetForIdentity, user, user?._id, user?.id]);

  useEffect(
    () => () => {
      requestControllerRef.current?.abort();
    },
    []
  );

  const createConversation = useCallback(async () => {
    if (sending) return null;
    setLoading(true);
    setError("");
    try {
      const result = await agentApi.createConversation();
      const conversation = result?.conversation || result;
      const id = conversationIdOf(conversation);
      if (!id) throw new Error("The Agent did not return a conversation.");
      rememberConversation(conversation);
      activeConversationIdRef.current = id;
      setActiveConversationId(id);
      setMessages([]);
      setMessageCursor(null);
      return conversation;
    } catch (createError) {
      setError(createError.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [rememberConversation, sending]);

  const selectConversation = useCallback(async (conversationId) => {
    if (!conversationId || sending) return;
    activeConversationIdRef.current = conversationId;
    setActiveConversationId(conversationId);
    setLoading(true);
    setMessages([]);
    setMessageCursor(null);
    setError("");
    try {
      const result = await agentApi.getMessages(conversationId);
      if (activeConversationIdRef.current !== conversationId) return;
      setMessages(messagesFrom(result));
      setMessageCursor(result?.nextCursor || null);
    } catch (loadError) {
      if (activeConversationIdRef.current === conversationId) {
        if (loadError.status === 404) {
          // Stale/deleted conversation: remove from list and clear active selection
          setConversations((current) =>
            current.filter((item) => conversationIdOf(item) !== conversationId)
          );
          activeConversationIdRef.current = null;
          setActiveConversationId(null);
          setMessages([]);
        } else {
          setError(loadError.message);
        }
      }
    } finally {
      if (activeConversationIdRef.current === conversationId) setLoading(false);
    }
  }, [sending]);

  const loadEarlierMessages = useCallback(async () => {
    const conversationId = activeConversationIdRef.current;
    if (!conversationId || !messageCursor || loading) return;
    setLoading(true);
    try {
      const result = await agentApi.getMessages(conversationId, {
        cursor: messageCursor,
      });
      if (activeConversationIdRef.current !== conversationId) return;
      setMessages((current) => [...messagesFrom(result), ...current]);
      setMessageCursor(result?.nextCursor || null);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [loading, messageCursor]);

  const sendMessage = useCallback(
    async (rawMessage, { source = "typed", pageContext: overrideContext } = {}) => {
      const message = String(rawMessage || "").trim();
      if (!message) throw new Error("Enter a message for MyJourney.");
      if (sending) throw new Error("MyJourney is already processing a message.");

      setSending(true);
      setError("");
      let conversationId = activeConversationIdRef.current;
      try {
        if (!conversationId) {
          const createdResult = await agentApi.createConversation();
          const conversation = createdResult?.conversation || createdResult;
          conversationId = conversationIdOf(conversation);
          if (!conversationId) {
            throw new Error("The Agent did not return a conversation.");
          }
          activeConversationIdRef.current = conversationId;
          setActiveConversationId(conversationId);
          rememberConversation(conversation);
          setMessages([]);
        }

        const clientRequestId = makeRequestId();
        const optimisticMessage = {
          id: clientRequestId,
          clientRequestId,
          role: "user",
          content: message,
          status: "sending",
          createdAt: new Date().toISOString(),
        };
        setMessages((current) => [...current, optimisticMessage]);

        const controller = new AbortController();
        requestControllerRef.current = controller;

        let result;
        try {
          result = await agentApi.sendMessage(
            conversationId,
            {
              message,
              pageContext: overrideContext || pageContext,
              clientRequestId,
              source,
            },
            { signal: controller.signal }
          );
        } catch (sendError) {
          if (sendError?.status === 404) {
            // Stale conversation ID — create a fresh conversation and retry seamlessly
            const createdRetry = await agentApi.createConversation();
            const freshConv = createdRetry?.conversation || createdRetry;
            conversationId = conversationIdOf(freshConv);
            if (!conversationId) throw sendError;
            activeConversationIdRef.current = conversationId;
            setActiveConversationId(conversationId);
            rememberConversation(freshConv);

            result = await agentApi.sendMessage(
              conversationId,
              {
                message,
                pageContext: overrideContext || pageContext,
                clientRequestId,
                source,
              },
              { signal: controller.signal }
            );
          } else {
            throw sendError;
          }
        }

        const userMessage = result?.userMessage || optimisticMessage;
        const assistantMessage = result?.assistantMessage;
        if (!assistantMessage?.content) {
          throw new Error("MyJourney returned an empty response.");
        }
        const responseMessages = [
          { ...userMessage, status: "sent" },
          {
            ...assistantMessage,
            toolExecutions:
              assistantMessage.toolExecutions || result.toolExecutions || [],
          },
        ];
        setMessages((current) => {
          const withoutOptimistic = current.filter(
            (item) =>
              messageIdOf(item) !== clientRequestId &&
              item.clientRequestId !== clientRequestId
          );
          return [...withoutOptimistic, ...responseMessages];
        });
        if (result.conversation) rememberConversation(result.conversation);
        return result;
      } catch (sendError) {
        setMessages((current) =>
          current.map((item) =>
            item.status === "sending" ? { ...item, status: "failed" } : item
          )
        );
        setError(sendError.message);
        throw sendError;
      } finally {
        requestControllerRef.current = null;
        setSending(false);
      }
    },
    [pageContext, rememberConversation, sending]
  );

  const cancelMessage = useCallback(() => {
    requestControllerRef.current?.abort();
  }, []);

  const archiveConversation = useCallback(async (conversationId) => {
    if (!conversationId || sending) return false;
    setLoading(true);
    setError("");
    try {
      await agentApi.archiveConversation(conversationId);
      setConversations((current) =>
        current.filter((item) => conversationIdOf(item) !== conversationId)
      );
      if (activeConversationIdRef.current === conversationId) {
        activeConversationIdRef.current = null;
        setActiveConversationId(null);
        setMessages([]);
        setMessageCursor(null);
      }
      return true;
    } catch (archiveError) {
      setError(archiveError.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [sending]);

  const value = useMemo(
    () => ({
      capabilities,
      conversations,
      activeConversationId,
      messages,
      loading,
      sending,
      error,
      conversationCursor,
      messageCursor,
      pageContext,
      createConversation,
      selectConversation,
      loadConversations,
      loadEarlierMessages,
      sendMessage,
      cancelMessage,
      archiveConversation,
      clearError: () => setError(""),
    }),
    [
      activeConversationId,
      archiveConversation,
      cancelMessage,
      capabilities,
      conversationCursor,
      conversations,
      createConversation,
      error,
      loadConversations,
      loadEarlierMessages,
      loading,
      messageCursor,
      messages,
      pageContext,
      selectConversation,
      sendMessage,
      sending,
    ]
  );

  return <AgentContext.Provider value={value}>{children}</AgentContext.Provider>;
}

export function useAgent() {
  const context = useContext(AgentContext);
  if (!context) throw new Error("useAgent must be used inside AgentProvider.");
  return context;
}

export { conversationIdOf, messageIdOf };
