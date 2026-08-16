import apiService from "../../../services/apiService";

const unwrap = (response) => response?.data ?? response;

const queryString = (params = {}) => {
  const value = new URLSearchParams(
    Object.entries(params).filter(
      ([, item]) => item !== undefined && item !== null && item !== ""
    )
  ).toString();
  return value ? `?${value}` : "";
};

const request = async (path, options = {}) =>
  unwrap(await apiService.request(`/api/agent/v1${path}`, options));

export const agentApi = {
  capabilities: () => request("/capabilities"),

  listConversations: ({ cursor, limit = 20 } = {}) =>
    request(`/conversations${queryString({ cursor, limit })}`),

  createConversation: (payload = {}) =>
    request("/conversations", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getMessages: (conversationId, { cursor, limit = 50 } = {}) =>
    request(
      `/conversations/${encodeURIComponent(conversationId)}/messages${queryString({
        cursor,
        limit,
      })}`
    ),

  sendMessage: (
    conversationId,
    { message, pageContext, clientRequestId, source },
    { signal } = {}
  ) =>
    request(`/conversations/${encodeURIComponent(conversationId)}/messages`, {
      method: "POST",
      body: JSON.stringify({
        message,
        pageContext,
        clientRequestId,
        source,
      }),
      signal,
    }),

  archiveConversation: (conversationId) =>
    request(`/conversations/${encodeURIComponent(conversationId)}`, {
      method: "PATCH",
      body: JSON.stringify({ archived: true }),
    }),
};

export default agentApi;
