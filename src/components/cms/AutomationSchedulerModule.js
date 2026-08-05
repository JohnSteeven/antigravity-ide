/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  AutomationSchedulerModule.js  —  Content Scheduler & Automation Dashboard
 *  MyJourney CMS  |  Stage 2 — Phase 13: Content Scheduler & Automation Engine
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback } from 'react';
import apiService from '../../services/apiService';
import { registerRoute } from '../../core/registerRoute';
import { registerSidebar } from '../../core/registerSidebar';
import {
  FiClock,
  FiCalendar,
  FiCheckCircle,
  FiAlertCircle,
  FiPlay,
  FiRefreshCw,
  FiXCircle,
  FiPlus,
  FiList,
  FiActivity,
} from 'react-icons/fi';

export default function AutomationSchedulerModule() {
  const [activeStatus, setActiveStatus] = useState('pending');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [entityType, setEntityType] = useState('article');
  const [entityId, setEntityId] = useState('');
  const [action, setAction] = useState('publish');
  const [scheduledAt, setScheduledAt] = useState('');
  const [recurrence, setRecurrence] = useState('once');

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.get(`/api/automation/jobs?status=${activeStatus}`);
      if (res?.data) setJobs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeStatus]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (!entityId || !scheduledAt) return;

    try {
      await apiService.post('/api/automation/jobs', {
        entityType,
        entityId,
        action,
        scheduledAt,
        recurrence,
      });

      setShowModal(false);
      setEntityId('');
      setScheduledAt('');
      setNotification({ type: 'success', text: 'Automation job scheduled successfully!' });
      fetchJobs();
    } catch (err) {
      setNotification({ type: 'error', text: err.message });
    }
  };

  const handleRunDue = async () => {
    try {
      setLoading(true);
      const res = await apiService.post('/api/automation/run-due');
      setNotification({ type: 'success', text: `Processed ${res?.data?.length || 0} due jobs.` });
      fetchJobs();
    } catch (err) {
      setNotification({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (jobId) => {
    try {
      await apiService.post(`/api/automation/jobs/${jobId}/retry`);
      setNotification({ type: 'success', text: 'Job retry queued.' });
      fetchJobs();
    } catch (err) {
      setNotification({ type: 'error', text: err.message });
    }
  };

  const handleCancel = async (jobId) => {
    try {
      await apiService.post(`/api/automation/jobs/${jobId}/cancel`);
      setNotification({ type: 'success', text: 'Job cancelled.' });
      fetchJobs();
    } catch (err) {
      setNotification({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="cms-panel wide">
      <div className="cms-panel-heading">
        <div>
          <span className="section-kicker">Stage 2: Post-Launch Engine</span>
          <h2>Enterprise Content Scheduler & Automation Engine</h2>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" className="secondary-btn" onClick={handleRunDue}>
            <FiPlay /> Run Due Jobs Now
          </button>
          <button type="button" className="primary-btn" onClick={() => setShowModal(true)}>
            <FiPlus /> Schedule New Automation
          </button>
        </div>
      </div>

      {notification && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: notification.type === 'success' ? '#e8f5ee' : '#fdf1f0', color: notification.type === 'success' ? '#2e7d5a' : '#9d3e32' }}>
          {notification.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {['pending', 'completed', 'failed', 'cancelled'].map((st) => (
          <button
            key={st}
            type="button"
            className={activeStatus === st ? 'primary-btn' : 'secondary-btn'}
            style={{ textTransform: 'capitalize' }}
            onClick={() => setActiveStatus(st)}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Jobs Table */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#888' }}>Loading automation jobs...</div>
      ) : jobs.length === 0 ? (
        <div className="empty-state">No {activeStatus} automation jobs found.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {jobs.map((job) => (
            <div key={job._id} style={{ background: '#fff', border: '1px solid #e4ded4', borderRadius: '10px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: '700', fontSize: '0.82rem', background: 'var(--cms-accent, #426c67)', color: '#fff', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                    {job.action}
                  </span>
                  <strong style={{ fontSize: '0.9rem' }}>{job.entityType}</strong>
                  <span style={{ fontSize: '0.75rem', color: '#888' }}>#{job.entityId}</span>
                </div>

                <div style={{ marginTop: '6px', fontSize: '0.78rem', color: '#666', display: 'flex', gap: '14px' }}>
                  <span>Scheduled: <strong>{new Date(job.scheduledAt).toLocaleString()}</strong></span>
                  <span>Recurrence: <strong>{job.recurrence}</strong></span>
                  <span>Retries: <strong>{job.retryCount}/{job.maxRetries}</strong></span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                {job.status === 'failed' && (
                  <button type="button" className="small-outline-btn" onClick={() => handleRetry(job._id)}>
                    <FiRefreshCw /> Retry
                  </button>
                )}
                {job.status === 'pending' && (
                  <button type="button" className="small-outline-btn" style={{ color: '#9d3e32' }} onClick={() => handleCancel(job._id)}>
                    <FiXCircle /> Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schedule Job Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <form onSubmit={handleCreateJob} style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '400px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ margin: 0 }}>Schedule Content Automation</h3>

            <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>Entity Type:</label>
            <select value={entityType} onChange={(e) => setEntityType(e.target.value)}>
              <option value="article">Article</option>
              <option value="page">Page</option>
              <option value="headless_entry">Headless Entry</option>
              <option value="layout">Layout</option>
              <option value="theme">Theme</option>
              <option value="navigation">Navigation</option>
            </select>

            <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>Target Entity ID (Mongo ObjectId):</label>
            <input type="text" placeholder="e.g. 64a8b..." value={entityId} onChange={(e) => setEntityId(e.target.value)} required />

            <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>Action:</label>
            <select value={action} onChange={(e) => setAction(e.target.value)}>
              <option value="publish">Publish</option>
              <option value="unpublish">Unpublish</option>
              <option value="archive">Archive</option>
              <option value="restore">Restore</option>
              <option value="feature">Feature</option>
            </select>

            <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>Scheduled Date & Time:</label>
            <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} required />

            <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>Recurrence:</label>
            <select value={recurrence} onChange={(e) => setRecurrence(e.target.value)}>
              <option value="once">Run Once</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button type="submit" className="primary-btn">
                Schedule Job
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ── Self Registration with CMS Core ─────────────────────────────────────────

registerRoute({
  path: '/cms/automation',
  component: AutomationSchedulerModule,
  auth: true,
  permissions: ['automation.manage'],
});

registerSidebar({
  key: 'automation',
  label: 'Content Scheduler Queue',
  icon: FiClock,
  path: '/cms/automation',
  group: 'Stage 2 Post-Launch',
  order: 3,
});
