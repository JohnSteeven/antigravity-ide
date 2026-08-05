/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  workflowService.js  —  Enterprise Workflow Service Layer
 *  MyJourney CMS  |  Stage 2 — Phase 11: Enterprise Editorial Workflow
 * ─────────────────────────────────────────────────────────────────────────────
 */

const WorkflowDefinition = require('../models/WorkflowDefinition');
const WorkflowHistory = require('../models/WorkflowHistory');
const EditorialComment = require('../models/EditorialComment');
const PublishingJob = require('../models/PublishingJob');
const NotificationService = require('../notifications/NotificationService');
const Article = require('../models/Article');
const Page = require('../models/Page');
const ContentEntry = require('../models/ContentEntry');

const DEFAULT_WORKFLOW = {
  key: 'default-editorial',
  name: 'Standard Editorial Workflow',
  description: 'Default publishing pipeline: Draft -> In Review -> Approved -> Scheduled -> Published -> Archived',
  isDefault: true,
  states: ['Draft', 'In Review', 'Changes Requested', 'Approved', 'Scheduled', 'Published', 'Archived'],
  transitions: [
    { fromState: 'Draft', toState: 'In Review', allowedRoles: ['Contributor', 'Author', 'Editor', 'Administrator'] },
    { fromState: 'In Review', toState: 'Changes Requested', allowedRoles: ['Reviewer', 'Editor', 'Administrator'] },
    { fromState: 'In Review', toState: 'Approved', allowedRoles: ['Reviewer', 'Editor', 'Administrator'] },
    { fromState: 'Changes Requested', toState: 'In Review', allowedRoles: ['Author', 'Contributor', 'Editor', 'Administrator'] },
    { fromState: 'Approved', toState: 'Scheduled', allowedRoles: ['Editor', 'Administrator'] },
    { fromState: 'Approved', toState: 'Published', allowedRoles: ['Editor', 'Administrator'] },
    { fromState: 'Scheduled', toState: 'Published', allowedRoles: ['Editor', 'Administrator'] },
    { fromState: 'Published', toState: 'Archived', allowedRoles: ['Editor', 'Administrator'] },
    { fromState: 'Archived', toState: 'Draft', allowedRoles: ['Administrator'] },
  ],
};

class WorkflowService {
  /**
   * Seed default workflow definition if empty
   */
  static async seedDefaults(userId = null) {
    try {
      const count = await WorkflowDefinition.countDocuments();
      if (count === 0) {
        console.info('[WorkflowService] Seeding default editorial workflow...');
        const wf = new WorkflowDefinition({ ...DEFAULT_WORKFLOW, createdBy: userId });
        await wf.save();
        console.info('[WorkflowService] Seeded default editorial workflow definition.');
      }
    } catch (err) {
      console.error('[WorkflowService] Seed error:', err.message);
    }
  }

  /**
   * Transition content state (Article, Page, ContentEntry)
   */
  static async transitionState({ contentId, contentType, toState, notes = '', reason = '', user }) {
    await WorkflowService.seedDefaults();

    // 1. Get content document
    let doc = null;
    let Model = null;

    if (contentType === 'article') Model = Article;
    else if (contentType === 'page') Model = Page;
    else if (contentType === 'content_entry') Model = ContentEntry;

    if (Model) {
      doc = await Model.findById(contentId);
    }

    if (!doc) throw new Error(`Content item (${contentType} #${contentId}) not found.`);

    const fromState = doc.status || 'Draft';

    // 2. Update content document status
    let mappedStatus = 'draft';
    const s = toState.toLowerCase();
    if (s.includes('publish')) mappedStatus = 'published';
    else if (s.includes('archive')) mappedStatus = 'archived';
    else mappedStatus = s.replace(/\s+/g, '_');

    doc.status = mappedStatus;
    await doc.save();

    // 3. Record Workflow History
    const history = new WorkflowHistory({
      contentId,
      contentType,
      fromState,
      toState,
      user: user?.id,
      notes,
      reason,
    });
    await history.save();

    // 4. Send Notifications
    NotificationService.sendInApp({
      userId: user?.id,
      title: `Workflow: Item ${toState}`,
      message: `'${doc.title}' transitioned from ${fromState} -> ${toState}`,
    }).catch(() => {});

    return { success: true, fromState, toState, content: doc };
  }

  /**
   * Get Task Inbox items waiting for review or approval
   */
  static async getMyTasks(userRole = 'Editor') {
    const articles = await Article.find({ status: { $in: ['in_review', 'changes_requested'] } }).select('title slug status updatedAt').lean();
    const pages = await Page.find({ status: { $in: ['in_review', 'changes_requested'] } }).select('title slug status updatedAt').lean();
    const entries = await ContentEntry.find({ status: { $in: ['in_review', 'changes_requested'] } }).select('title slug contentTypeKey status updatedAt').lean();

    return [
      ...articles.map((a) => ({ ...a, type: 'article' })),
      ...pages.map((p) => ({ ...p, type: 'page' })),
      ...entries.map((e) => ({ ...e, type: 'content_entry' })),
    ];
  }

  /**
   * Get Publishing Calendar items
   */
  static async getCalendar() {
    const jobs = await PublishingJob.find({ status: 'pending' }).sort({ scheduledFor: 1 }).lean();
    const articles = await Article.find({ publishDate: { $ne: null } }).select('title slug publishDate status').lean();
    const pages = await Page.find({ publishDate: { $ne: null } }).select('title slug publishDate status').lean();

    return {
      scheduledJobs: jobs,
      articles,
      pages,
    };
  }

  /**
   * Get Workflow Analytics
   */
  static async getAnalytics() {
    const totalTransitions = await WorkflowHistory.countDocuments();
    const pendingReviews = await Article.countDocuments({ status: 'in_review' }) + await Page.countDocuments({ status: 'in_review' });
    const scheduledCount = await PublishingJob.countDocuments({ status: 'pending' });

    return {
      totalTransitions,
      pendingReviews,
      scheduledCount,
    };
  }
}

module.exports = WorkflowService;
