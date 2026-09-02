/**
 * Read-only launch evidence endpoints.
 * Empty history is returned honestly and never replaced with sample records.
 */

'use strict';

const ReleaseVersion = require('../models/ReleaseVersion');
const TestExecution = require('../models/TestExecution');
const DeploymentHistory = require('../models/DeploymentHistory');
const LaunchReadinessService = require('../services/launchReadinessService');

// Earlier launch-center code inserted this exact demo record from a GET request.
// Keep the stored record available for an operator-led data cleanup, but never
// present it as release evidence.
const LEGACY_DEMO_RELEASE = Object.freeze({
  version: '6.0.0',
  releaseName: 'MyJourney Enterprise Edition',
  featuresCount: 30,
});

exports.getAuditReport = async (_req, res, next) => {
  try {
    const report = await LaunchReadinessService.runReadinessAudit();
    return res.json({ success: true, data: report });
  } catch (error) {
    return next(error);
  }
};

exports.getReleases = async (_req, res, next) => {
  try {
    const releases = await ReleaseVersion.find({ $nor: [LEGACY_DEMO_RELEASE] })
      .sort({ releasedAt: -1 })
      .limit(100)
      .lean();
    return res.json({
      success: true,
      data: releases,
      message: releases.length ? undefined : 'No verified release records.',
    });
  } catch (error) {
    return next(error);
  }
};

exports.LEGACY_DEMO_RELEASE = LEGACY_DEMO_RELEASE;

exports.getDeployments = async (_req, res, next) => {
  try {
    const deployments = await DeploymentHistory.find().sort({ createdAt: -1 }).limit(100).lean();
    return res.json({
      success: true,
      data: deployments,
      message: deployments.length ? undefined : 'No recorded deployments.',
    });
  } catch (error) {
    return next(error);
  }
};

exports.getTests = async (_req, res, next) => {
  try {
    const tests = await TestExecution.find().sort({ createdAt: -1 }).limit(100).lean();
    return res.json({
      success: true,
      data: tests,
      message: tests.length ? undefined : 'No recorded test executions.',
    });
  } catch (error) {
    return next(error);
  }
};
