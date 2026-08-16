"use strict";

/**
 * MockAgentProvider
 *
 * Development-only provider that works without any external AI API.
 *
 * How it works:
 *   1. Matches the user message against intent patterns.
 *   2. Returns structured tool_call requests to the orchestrator.
 *   3. The orchestrator executes each tool through the REAL auth/permission/
 *      entitlement/ownership pipeline — nothing is fabricated.
 *   4. Tool results are returned to the provider.
 *   5. The provider formats a plain-language response from actual data.
 *
 * This exercises the complete Agent architecture for development/CI without
 * requiring a paid AI provider.
 */

const { AgentError, errorCodes } = require("../errors");
const { PROVIDER_KEYS } = require("../constants");

const PROVIDER_KEY = PROVIDER_KEYS.MOCK;
const MODEL_NAME = "mock-deterministic-v1";

// ─── Intent patterns ─────────────────────────────────────────────────────────

const INTENT_RULES = [
  {
    name: "today_activities",
    patterns: [/today.{0,30}activit/i, /what.{0,20}(today|schedule|plan)/i, /my day/i, /activities.{0,20}today/i],
    tools: ["life.getToday", "life.getHabits"],
  },
  {
    name: "goals",
    patterns: [/my goals/i, /goal progress/i, /what.{0,20}goals/i, /goals.*today/i],
    tools: ["life.getGoals"],
  },
  {
    name: "habits",
    patterns: [/my habits/i, /habit/i, /streaks/i],
    tools: ["life.getHabits"],
  },
  {
    name: "progress",
    patterns: [/recent progress/i, /what.{0,20}done/i, /completed.{0,20}lately/i],
    tools: ["life.getRecentProgress"],
  },
  {
    name: "profile",
    patterns: [/my profile/i, /my account/i, /who am i/i, /my name/i],
    tools: ["account.getProfile"],
  },
  {
    name: "subscription",
    patterns: [/subscription/i, /premium/i, /my plan/i, /entitlement/i],
    tools: ["account.getSubscription"],
  },
  {
    name: "courses",
    patterns: [/course/i, /learn/i, /class/i, /study/i, /enrollment/i],
    tools: ["learn.getEnrollments", "learn.getNextLesson"],
  },
  {
    name: "search_courses",
    patterns: [/find.{0,20}course/i, /search.{0,20}course/i, /courses? about/i],
    tools: ["learn.searchCourses"],
    extractQuery: true,
  },
  {
    name: "articles",
    patterns: [/article/i, /read/i, /recommend.*read/i, /blog/i],
    tools: ["content.searchArticles"],
    extractQuery: true,
  },
  {
    name: "stories",
    patterns: [/stor(?:y|ies)/i, /story.{0,20}about/i],
    tools: ["content.searchStories"],
    extractQuery: true,
  },
  {
    name: "creators",
    patterns: [/creator/i, /author/i, /find.{0,20}creator/i],
    tools: ["creators.search"],
    extractQuery: true,
  },
  {
    name: "knowledge",
    patterns: [/.+/], // Catch-all — always try knowledge search
    tools: ["knowledge.search"],
    extractQuery: true,
  },
];

const extractQuery = (message) => {
  // Remove common filler phrases and use remainder as the search query
  return message
    .replace(/^(find|search for|look up|tell me about|show me|what (is|are|do you know about))/i, "")
    .replace(/[?!.]+$/, "")
    .trim()
    .slice(0, 200) || message.slice(0, 200);
};

const matchIntent = (message) => {
  for (const rule of INTENT_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(message)) return rule;
    }
  }
  return INTENT_RULES[INTENT_RULES.length - 1]; // fallback: knowledge.search
};

// ─── Response formatter ──────────────────────────────────────────────────────

const formatTodayResponse = (todayResult, habitsResult) => {
  if (!todayResult) return "I couldn't load your today data right now.";

  const { date, activities = [], goals = [], summary = {} } = todayResult;
  const parts = [`Here are your activities for ${date || "today"}:`];

  if (activities.length === 0) {
    parts.push("You have no scheduled activities today.");
  } else {
    const shown = activities.slice(0, 8);
    shown.forEach((item) => {
      const time = item.scheduledTime ? ` at ${item.scheduledTime}` : "";
      const status = item.status && item.status !== "scheduled" ? ` (${item.status})` : "";
      parts.push(`• ${item.title}${time}${status}`);
    });
    if (activities.length > 8) parts.push(`…and ${activities.length - 8} more.`);
  }

  if (summary.planned) {
    parts.push(`\nSummary: ${summary.completed || 0} of ${summary.planned} planned items completed.`);
  }

  if (goals.length > 0) {
    parts.push(`\nActive goals: ${goals.slice(0, 3).map((g) => g.title).join(", ")}.`);
  }

  if (habitsResult?.items?.length > 0) {
    const activeHabits = habitsResult.items.slice(0, 4).map((h) => h.name);
    parts.push(`\nHabits to maintain: ${activeHabits.join(", ")}.`);
  }

  return parts.join("\n");
};

const formatGoalsResponse = (goalsResult) => {
  if (!goalsResult?.items?.length) return "You don't have any active goals set up yet.";
  const lines = ["Your active goals:"];
  goalsResult.items.slice(0, 6).forEach((goal) => {
    const progress = goal.progress !== undefined ? ` — ${Math.round(goal.progress * 100)}%` : "";
    lines.push(`• ${goal.title}${progress}`);
  });
  return lines.join("\n");
};

const formatHabitsResponse = (habitsResult) => {
  if (!habitsResult?.items?.length) return "You have no active habits tracked.";
  const lines = ["Your active habits:"];
  habitsResult.items.slice(0, 8).forEach((habit) => {
    const period = habit.preferredPeriod ? ` (${habit.preferredPeriod})` : "";
    lines.push(`• ${habit.name}${period}`);
  });
  return lines.join("\n");
};

const formatProgressResponse = (progressResult) => {
  if (!Array.isArray(progressResult) || progressResult.length === 0) {
    return "No recent progress events found.";
  }
  const lines = ["Recent progress:"];
  progressResult.slice(0, 6).forEach((item) => {
    const type = item.itemType ? `${item.itemType} ` : "";
    lines.push(`• ${type}${item.status} on ${item.scheduledDate || item.occurredAt?.slice?.(0, 10) || "recent date"}`);
  });
  return lines.join("\n");
};

const formatProfileResponse = (profileResult) => {
  if (!profileResult) return "Could not load your profile.";
  const name = [profileResult.firstName, profileResult.lastName].filter(Boolean).join(" ") || profileResult.username;
  return `Your profile: ${name}${profileResult.profile?.bio ? `\n${profileResult.profile.bio.slice(0, 300)}` : ""}`;
};

const formatSubscriptionResponse = (subResult) => {
  if (!subResult) return "Could not load subscription info.";
  return `Plan: ${subResult.plan || "free"}. ${subResult.accessReason ? `Access: ${subResult.accessReason}.` : ""}`;
};

const formatEnrollmentsResponse = (enrollments, nextLesson) => {
  const lines = [];
  if (!Array.isArray(enrollments) || enrollments.length === 0) {
    lines.push("You have no active course enrollments.");
  } else {
    lines.push("Your courses:");
    enrollments.slice(0, 4).forEach((e) => {
      if (e.course) {
        lines.push(`• ${e.course.title} — ${e.completedLessonCount || 0}/${e.course.lessonCount || "?"} lessons`);
      }
    });
  }
  if (nextLesson?.lesson) {
    lines.push(`\nNext up: "${nextLesson.lesson.title}" in ${nextLesson.course?.title || "your course"}.`);
  }
  return lines.join("\n");
};

const formatSearchResponse = (results, type) => {
  const items = results?.courses || results?.creators || results?.items || results || [];
  if (!Array.isArray(items) || items.length === 0) return `No ${type} found matching your search.`;
  const lines = [`Found ${type}:`];
  items.slice(0, 5).forEach((item) => {
    lines.push(`• ${item.title || item.displayName || item.name || "Item"}`);
  });
  return lines.join("\n");
};

const formatKnowledgeResponse = (knowledgeResult, originalMessage) => {
  if (!knowledgeResult?.contextText) {
    return `I searched the MyJourney knowledge base for "${originalMessage.slice(0, 80)}" but couldn't find relevant information. Try rephrasing or ask about MyJourney features, articles, courses, or your personal data.`;
  }
  const { contextText, citations = [] } = knowledgeResult;
  const summary = contextText.slice(0, 1200).trim();
  const citationNote = citations.length
    ? `\n\nSources: ${citations.slice(0, 3).map((c) => c.title).join(", ")}.`
    : "";
  return `${summary}${citationNote}`;
};

// ─── Build response from tool results ────────────────────────────────────────

const buildResponse = (intent, toolResults, originalMessage) => {
  const resultMap = {};
  for (const { tool, output } of toolResults) {
    resultMap[tool.key] = output;
  }

  switch (intent.name) {
    case "today_activities":
      return formatTodayResponse(resultMap["life.getToday"], resultMap["life.getHabits"]);
    case "goals":
      return formatGoalsResponse(resultMap["life.getGoals"]);
    case "habits":
      return formatHabitsResponse(resultMap["life.getHabits"]);
    case "progress":
      return formatProgressResponse(resultMap["life.getRecentProgress"]);
    case "profile":
      return formatProfileResponse(resultMap["account.getProfile"]);
    case "subscription":
      return formatSubscriptionResponse(resultMap["account.getSubscription"]);
    case "courses":
      return formatEnrollmentsResponse(
        resultMap["learn.getEnrollments"],
        resultMap["learn.getNextLesson"]
      );
    case "search_courses":
      return formatSearchResponse(resultMap["learn.searchCourses"], "courses");
    case "articles":
      return formatSearchResponse(resultMap["content.searchArticles"], "articles");
    case "stories":
      return formatSearchResponse(resultMap["content.searchStories"], "stories");
    case "creators":
      return formatSearchResponse(resultMap["creators.search"], "creators");
    case "knowledge":
    default:
      return formatKnowledgeResponse(resultMap["knowledge.search"], originalMessage);
  }
};

// ─── Provider class ───────────────────────────────────────────────────────────

class MockAgentProvider {
  get key() {
    return PROVIDER_KEY;
  }

  get model() {
    return MODEL_NAME;
  }

  isAvailable() {
    return true;
  }

  async health() {
    return { available: true, provider: PROVIDER_KEY, model: MODEL_NAME, latencyMs: 0 };
  }

  /**
   * Execute one Agent turn.
   *
   * @param {object} params
   * @param {string} params.userMessage  — The user's text
   * @param {Array}  params.contextMessages — Bounded conversation history
   * @param {Function} params.executeTool — (toolKey, input) → output (runs real services)
   * @param {object} params.toolContext   — {userId, user, entitlementResolution}
   * @returns {{ content: string, toolCalls: Array, inputTokens: number, outputTokens: number }}
   */
  async turn({ userMessage, contextMessages = [], executeTool, toolContext }) {
    if (typeof executeTool !== "function") {
      throw new AgentError(errorCodes.INTERNAL, "MockAgentProvider requires an executeTool callback.", 500);
    }

    const intent = matchIntent(userMessage);
    const query = extractQuery(userMessage);
    const toolCalls = [];
    const toolResults = [];

    // Build input args for each tool the intent requires
    for (const toolKey of intent.tools) {
      let input = {};

      if (intent.extractQuery) {
        if (toolKey === "knowledge.search" || toolKey === "content.searchArticles" || toolKey === "content.searchStories") {
          input = { query: query.length >= 2 ? query : userMessage.slice(0, 200) };
        } else if (toolKey === "learn.searchCourses") {
          input = { query: query.length >= 2 ? query : userMessage.slice(0, 100) };
        } else if (toolKey === "creators.search") {
          input = { query: query.length >= 2 ? query : userMessage.slice(0, 80) };
        }
      }

      try {
        const result = await executeTool(toolKey, input, toolContext);
        toolCalls.push({ toolKey, input, status: "succeeded" });
        toolResults.push(result);
      } catch (toolError) {
        // Tool call failed (auth, entitlement, unavailable) — record but continue
        toolCalls.push({ toolKey, input, status: "failed", error: toolError?.code || toolError?.message });
        // For auth/entitlement failures, propagate to give appropriate user message
        if (
          toolError?.code === errorCodes.AUTH_REQUIRED ||
          toolError?.code === errorCodes.ENTITLEMENT_REQUIRED
        ) {
          const readableKey = toolKey.replace(".", " ");
          return {
            content: toolError.code === errorCodes.AUTH_REQUIRED
              ? `Sign in to MyJourney to access your ${readableKey} data.`
              : `MyJourney Premium is required to access ${readableKey}. Upgrade to get full access.`,
            toolCalls,
            inputTokens: 0,
            outputTokens: 0,
          };
        }
      }
    }

    const content = buildResponse(intent, toolResults, userMessage);
    return {
      content,
      toolCalls,
      inputTokens: Math.ceil((userMessage.length + (contextMessages.length * 100)) / 4),
      outputTokens: Math.ceil(content.length / 4),
    };
  }
}

module.exports = { MockAgentProvider };
