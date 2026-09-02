/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  aiAssistantService.js  —  Full RAG Pipeline Orchestrator
 *  MyJourney CMS  |  Stage 3 — Phase 20B: AI Knowledge Assistant
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Implements the full pipeline:
 *
 *  User Question
 *        │
 *        ▼
 *  Intent Detection  (via knowledgeSearchService)
 *        │
 *        ▼
 *  Knowledge Search  (published articles only)
 *        │
 *        ▼
 *  Build Context     (relevant excerpts + citations)
 *        │
 *        ▼
 *  Send to AI        (via aiProviderService)
 *        │
 *        ▼
 *  Return Answer + Sources
 *
 *  Modes:
 *    knowledge-only   — Only MyJourney content; refuses to answer without sources
 *    hybrid           — MyJourney first; falls back to general AI if no content found
 *    general          — Normal AI chat; no knowledge search
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const AIProviderService = require('./aiProviderService');
const KnowledgeSearchService = require('./knowledgeSearchService');
const AIConversation = require('../models/AIConversation');

// ─── System Prompts ───────────────────────────────────────────────────────────

function buildSystemPrompt(mode, interfaceType, contextText) {
  const persona = interfaceType === 'admin'
    ? `You are MyJourney CMS AI, an expert assistant for the MyJourney content management system.
       You help administrators manage content, understand analytics, find articles, and improve SEO.`
    : `You are MyJourney AI, a friendly and knowledgeable reading companion for the MyJourney personal publishing platform.
       You help readers explore articles, understand topics, and continue their learning journey.`;

  if (mode === 'general') {
    return `${persona}
You are operating in General AI mode — you can answer from your general knowledge.
Be concise, accurate, and helpful. Use markdown formatting where appropriate.`;
  }

  const sourceInstructions = mode === 'knowledge-only'
    ? `IMPORTANT: Answer ONLY using the provided MyJourney sources below. 
       If the sources do not contain enough information to answer the question, say:
       "I couldn't find specific information about that in MyJourney. Try browsing the articles or ask about a different topic."
       Do NOT use knowledge outside of the provided sources.`
    : `Answer primarily from the provided MyJourney sources. 
       If the sources contain a good answer, use them.
       If they don't fully answer the question, you may supplement with your general knowledge — but clearly separate the two parts.
       Label MyJourney content with "📚 From MyJourney:" and general knowledge with "💡 General knowledge:"`;

  return `${persona}

${sourceInstructions}

FORMATTING RULES:
- Use markdown: bold for key terms, bullet points for lists, code blocks for code
- Keep answers focused and scannable
- End with 1-2 follow-up questions the reader might want to ask (only if there's relevant context)
- Do NOT mention the sources by saying "SOURCE 1:" — write naturally and let the citations appear separately

MYJOURNEY SOURCES:
${contextText || '(No relevant articles found in MyJourney for this query)'}`;
}

// ─── Conversation Memory ──────────────────────────────────────────────────────

const MAX_HISTORY_MESSAGES = 10; // Keep last 10 messages for context window

/**
 * Load or create a conversation session.
 */
async function getOrCreateConversation(conversationId, sessionData) {
  if (conversationId) {
    const existing = await AIConversation.findById(conversationId);
    if (existing) return existing;
  }

  return AIConversation.create({
    userId:    sessionData.userId    || null,
    sessionId: sessionData.sessionId || null,
    mode:      sessionData.mode      || 'hybrid',
    interface: sessionData.interface || 'reader',
    contextArticleId:   sessionData.contextArticleId   || null,
    contextArticleSlug: sessionData.contextArticleSlug || null,
  });
}

/**
 * Build the messages array for the AI call, injecting conversation history.
 */
function buildMessagesWithHistory(systemPrompt, conversation, newUserMessage) {
  const messages = [{ role: 'system', content: systemPrompt }];

  // Inject last N messages from conversation history (sliding window)
  const history = (conversation.messages || []).slice(-MAX_HISTORY_MESSAGES);
  for (const msg of history) {
    if (msg.role === 'user' || msg.role === 'assistant') {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  // Add the current user message
  messages.push({ role: 'user', content: newUserMessage });

  return messages;
}

/**
 * Save the turn (user + assistant messages) to the conversation.
 */
async function saveTurn(conversation, userMessage, assistantMessage, citations, sourceType, tokens, latencyMs) {
  const userMsg = { role: 'user', content: userMessage, source: 'system' };
  const assistantMsg = {
    role: 'assistant',
    content: assistantMessage,
    citations,
    source: sourceType,
    tokenCount: tokens?.total || 0,
    latencyMs,
  };

  // Auto-generate conversation title from first question
  if (!conversation.title && conversation.messages.length === 0) {
    conversation.title = userMessage.slice(0, 80);
  }

  // Sliding window: keep last 20 messages
  conversation.messages.push(userMsg, assistantMsg);
  if (conversation.messages.length > 20) {
    conversation.messages = conversation.messages.slice(-20);
  }

  conversation.messageCount += 1;
  conversation.totalTokens += tokens?.total || 0;
  conversation.lastActivityAt = new Date();

  await conversation.save();
}

// ─── Main Pipeline ────────────────────────────────────────────────────────────

class AIAssistantService {
  /**
   * Main RAG pipeline entry point.
   *
   * @param {object} params
   * @param {string} params.query               - User's question
   * @param {string} params.mode                - 'knowledge-only' | 'hybrid' | 'general'
   * @param {string} params.interface           - 'reader' | 'admin'
   * @param {string} [params.conversationId]    - Resume existing conversation
   * @param {string} [params.sessionId]         - Anonymous session fingerprint
   * @param {string} [params.userId]            - Authenticated user ID
   * @param {string} [params.contextArticleSlug]- Article currently being read
   * @param {string} [params.category]          - Filter search to this category
   */
  static async chat(params) {
    const {
      query,
      mode = 'hybrid',
      interfaceType = 'reader',
      conversationId = null,
      sessionId = null,
      userId = null,
      contextArticleSlug = null,
      category = null,
    } = params;

    if (!query?.trim()) throw new Error('Query is required.');

    const startTime = Date.now();

    // ── Step 1: Load or create conversation ──────────────────────────────────
    const conversation = await getOrCreateConversation(conversationId, {
      userId, sessionId, mode, interface: interfaceType, contextArticleSlug,
    });

    // ── Step 2: Knowledge Search ──────────────────────────────────────────────
    let searchResult = { articles: [], contextText: '', citations: [], intent: 'general', keywords: [], searchMethod: 'none', isPopularFallback: false };
    let sourceType = 'general';

    if (mode !== 'general') {
      searchResult = await KnowledgeSearchService.search(query, {
        category,
        contextArticleSlug,
        limit: 5,
      });

      const hasRelevantContent = searchResult.articles.length > 0 && !searchResult.isPopularFallback;

      if (hasRelevantContent) {
        sourceType = mode === 'hybrid' ? 'hybrid-knowledge' : 'knowledge';
      } else if (mode === 'knowledge-only') {
        sourceType = 'knowledge'; // Will tell AI to say it can't answer
      } else {
        sourceType = 'hybrid-ai'; // Hybrid mode, no knowledge found → use general AI
      }
    }

    // ── Step 3: Build System Prompt ──────────────────────────────────────────
    const systemPrompt = buildSystemPrompt(mode, interfaceType, searchResult.contextText);

    // ── Step 4: Build messages with conversation history ─────────────────────
    const messages = buildMessagesWithHistory(systemPrompt, conversation, query);

    // ── Step 5: Send to AI Provider ───────────────────────────────────────────
    let aiResult;
    try {
      aiResult = await AIProviderService.complete({
        messages,
        action: 'chat',
        source: interfaceType === 'admin' ? 'cms-writer' : 'public-assistant',
        userId,
        overrides: { temperature: 0.6, maxTokens: 1024 },
      });
    } catch (err) {
      throw new Error(`AI generation failed: ${err.message}`);
    }

    const latencyMs = Date.now() - startTime;

    // ── Step 6: Save conversation turn ────────────────────────────────────────
    await saveTurn(
      conversation,
      query,
      aiResult.content,
      searchResult.citations,
      sourceType,
      aiResult.tokens,
      latencyMs
    );

    // ── Step 7: Return response ───────────────────────────────────────────────
    return {
      answer: aiResult.content,
      citations: searchResult.citations,
      intent: searchResult.intent,
      searchMethod: searchResult.searchMethod,
      sourceType,
      conversationId: conversation._id.toString(),
      tokens: aiResult.tokens,
      latencyMs,
      provider: aiResult.provider,
      model: aiResult.model,
    };
  }

  /**
   * Submit feedback on an assistant message.
   */
  static async submitFeedback(conversationId, messageId, feedback) {
    const conversation = await AIConversation.findById(conversationId);
    if (!conversation) throw new Error('Conversation not found.');

    const message = conversation.messages.id(messageId);
    if (!message) throw new Error('Message not found.');

    message.feedback = feedback;
    await conversation.save();
    return true;
  }

  /**
   * Get conversation history.
   */
  static async getConversation(conversationId) {
    const conversation = await AIConversation.findById(conversationId).lean();
    if (!conversation) throw new Error('Conversation not found.');
    return conversation;
  }

  /**
   * List conversations for a user or session.
   */
  static async listConversations(filter, limit = 20) {
    return AIConversation.find(filter)
      .sort({ lastActivityAt: -1 })
      .limit(limit)
      .select('title mode interface messageCount lastActivityAt createdAt')
      .lean();
  }

  /**
   * Generate suggested questions based on what content exists.
   * Called when the assistant first opens.
   */
  static async getSuggestedQuestions(contextArticleSlug = null, category = null) {
    // If on a specific article, suggest relevant questions
    if (contextArticleSlug) {
      return [
        'Summarize this article for me',
        'What are the key takeaways?',
        'What should I read next?',
        'Generate a quiz from this article',
        'Explain the most complex concept here',
      ];
    }

    // Category-specific suggestions
    const categoryQuestions = {
      coding: ['How do I learn React?', 'Explain JWT authentication', 'Best backend articles', 'What is system design?'],
      life: ['Share articles about productivity', 'Recommend personal growth reads', 'Daily habits articles'],
      travel: ['Best travel guides', 'Budget travel tips', 'Recommend travel articles'],
      reflections: ['Mindfulness articles', 'Career reflection pieces', 'Life lesson articles'],
      incidents: ['Real-life lessons', 'Failure stories', 'Success stories'],
      lessons: ['Leadership lessons', 'Business insights', 'Technology lessons'],
    };

    const defaults = [
      'How do I learn React?',
      'Recommend backend articles',
      'Explain JWT',
      'Best travel guides',
      'Continue my learning',
      'What should I read today?',
    ];

    return categoryQuestions[category] || defaults;
  }

  /**
   * Generate a quiz from a published article.
   */
  static async generateQuiz(articleSlug, questionCount = 5) {
    const Article = require('../models/Article');
    const article = await Article.findOne({ slug: articleSlug, status: 'published', isDeleted: false })
      .select('title body description')
      .lean();

    if (!article) throw new Error('Article not found or not published.');

    const plainText = article.body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

    return AIProviderService.complete({
      messages: [
        {
          role: 'system',
          content: 'You are a quiz generator. Create clear, educational multiple-choice questions from article content.',
        },
        {
          role: 'user',
          content: `Generate ${questionCount} multiple-choice questions from this article titled "${article.title}".

Content:
"""
${plainText.slice(0, 4000)}
"""

Format each question as:
Q: [question]
A) [option]
B) [option]  
C) [option]
D) [option]
Answer: [correct letter]
Explanation: [brief explanation]

Return only the questions, no preamble.`,
        },
      ],
      action: 'quiz_generate',
      source: 'public-assistant',
      overrides: { temperature: 0.5, maxTokens: 1500 },
    });
  }
}

module.exports = AIAssistantService;
