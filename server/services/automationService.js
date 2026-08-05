/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  automationService.js  —  Enterprise Content Automation Service
 *  MyJourney CMS  |  Stage 2 — Phase 13: Content Scheduler & Automation Engine
 * ─────────────────────────────────────────────────────────────────────────────
 */

const AutomationJob = require('../models/AutomationJob');
const AutomationExecution = require('../models/AutomationExecution');
const WorkflowService = require('./workflowService');
const VersionControlService = require('./versionControlService');
const NotificationService = require('../notifications/NotificationService');
const Article = require('../models/Article');
const Page = require('../models/Page');
const ContentEntry = require('../models/ContentEntry');

class AutomationService {
  /**
   * Schedule a new automation job
   */
  static async createJob({ entityType, entityId, action, scheduledAt, recurrence = 'once', payload = {}, user }) {
    const job = new AutomationJob({
      entityId,
      entityType: entityType.toLowerCase(),
      action: action || 'publish',
      scheduledAt: new Date(scheduledAt),
      recurrence,
      payload,
      createdBy: user?.id || user,
      status: 'pending',
    });

    job.logs.push({ level: 'info', message: `Job scheduled for ${new Date(scheduledAt).toISOString()} (${action})` });
    await job.save();
    return job;
  }

  /**
   * Process due automation jobs (called via cron or background queue worker)
   */
  static async processDueJobs() {
    const now = new Date();
    const dueJobs = await AutomationJob.find({
      status: 'pending',
      scheduledAt: { $lte: now },
    });

    const results = [];

    for (const job of dueJobs) {
      const startTime = Date.now();
      job.status = 'running';
      job.lastRun = now;
      await job.save();

      try {
        // Execute automation action
        let Model = null;
        const eType = job.entityType.toLowerCase();

        if (eType === 'article') Model = Article;
        else if (eType === 'page') Model = Page;
        else if (eType === 'headless_entry') Model = ContentEntry;

        let targetDoc = null;
        if (Model) {
          targetDoc = await Model.findById(job.entityId);
        }

        if (targetDoc) {
          if (job.action === 'publish') targetDoc.status = 'published';
          else if (job.action === 'unpublish') targetDoc.status = 'draft';
          else if (job.action === 'archive') targetDoc.status = 'archived';
          await targetDoc.save();

          // Create Version Control Snapshot automatically
          await VersionControlService.createSnapshot({
            entityType: eType,
            entityId: job.entityId,
            title: targetDoc.title || `${eType} (Automated ${job.action})`,
            data: targetDoc,
            notes: `Automated ${job.action} executed via Scheduler Engine`,
          }).catch(() => {});

          // Transition Workflow status
          await WorkflowService.transitionState({
            contentId: job.entityId,
            contentType: eType,
            toState: job.action === 'publish' ? 'Published' : 'Archived',
            notes: `Automated ${job.action} execution`,
          }).catch(() => {});
        }

        const durationMs = Date.now() - startTime;
        job.status = 'completed';
        job.logs.push({ level: 'info', message: `Execution completed successfully in ${durationMs}ms.` });
        await job.save();

        const execLog = new AutomationExecution({
          jobId: job._id,
          startedAt: new Date(startTime),
          finishedAt: new Date(),
          durationMs,
          result: 'success',
        });
        await execLog.save();

        // Notify user
        NotificationService.sendInApp({
          userId: job.createdBy,
          title: `Automation Executed: ${job.action}`,
          message: `Scheduled ${job.action} job completed successfully.`,
        }).catch(() => {});

        results.push({ jobId: job._id, status: 'success' });
      } catch (err) {
        const durationMs = Date.now() - startTime;
        job.retryCount += 1;

        if (job.retryCount >= job.maxRetries) {
          job.status = 'failed';
          job.logs.push({ level: 'error', message: `Execution failed after ${job.retryCount} retries: ${err.message}` });
        } else {
          job.status = 'pending';
          job.logs.push({ level: 'warn', message: `Retry ${job.retryCount}/${job.maxRetries} failed: ${err.message}` });
        }

        await job.save();

        const execLog = new AutomationExecution({
          jobId: job._id,
          startedAt: new Date(startTime),
          finishedAt: new Date(),
          durationMs,
          result: 'failure',
          error: err.message,
        });
        await execLog.save();

        results.push({ jobId: job._id, status: 'failed', error: err.message });
      }
    }

    return results;
  }

  /**
   * Retry a failed job manually
   */
  static async retryJob(jobId) {
    const job = await AutomationJob.findById(jobId);
    if (!job) throw new Error('Job not found');

    job.status = 'pending';
    job.scheduledAt = new Date(); // Execute immediately
    job.logs.push({ level: 'info', message: 'Manual retry triggered.' });
    await job.save();
    return job;
  }

  /**
   * Cancel a pending job
   */
  static async cancelJob(jobId) {
    const job = await AutomationJob.findById(jobId);
    if (!job) throw new Error('Job not found');

    job.status = 'cancelled';
    job.logs.push({ level: 'warn', message: 'Job cancelled by admin.' });
    await job.save();
    return job;
  }
}

module.exports = AutomationService;
