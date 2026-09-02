/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  WorkflowManagerModule.js  —  Enterprise Workflow & Publishing Engine
 *  MyJourney CMS  |  Stage 2 — Phase 11: Editorial Workflow
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback } from 'react';
import apiService from '../../services/apiService';
import { registerRoute } from '../../core/registerRoute';
import { registerSidebar } from '../../core/registerSidebar';
import {
  FiGitPullRequest,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiCalendar,
  FiInbox,
  FiBarChart2,
  FiMessageSquare,
  FiSend,
  FiCornerDownRight,
  FiArchive,
} from 'react-icons/fi';

export default function WorkflowManagerModule() {
  const [activeTab, setActiveTab] = useState('inbox'); // 'inbox', 'calendar', 'analytics', 'definitions'
  const [tasks, setTasks] = useState([]);
  const [calendar, setCalendar] = useState({ scheduledJobs: [], articles: [], pages: [] });
  const [analytics, setAnalytics] = useState(null);
  const [definitions, setDefinitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Transition Modal State
  const [showTransitionModal, setShowTransitionModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [targetState, setTargetState] = useState('Approved');
  const [transitionNotes, setTransitionNotes] = useState('');

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.get('/api/workflows/my-tasks');
      if (res?.data) setTasks(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCalendar = useCallback(async () => {
    try {
      const res = await apiService.get('/api/workflows/calendar');
      if (res?.data) setCalendar(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await apiService.get('/api/workflows/analytics');
      if (res?.data) setAnalytics(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchDefinitions = useCallback(async () => {
    try {
      const res = await apiService.get('/api/workflows/definitions');
      if (res?.data) setDefinitions(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchCalendar();
    fetchAnalytics();
    fetchDefinitions();
  }, [fetchTasks, fetchCalendar, fetchAnalytics, fetchDefinitions]);

  const handleTransition = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;

    try {
      await apiService.post('/api/workflows/transition', {
        contentId: selectedTask._id,
        contentType: selectedTask.type || 'article',
        toState: targetState,
        notes: transitionNotes,
      });

      setShowTransitionModal(false);
      setSelectedTask(null);
      setTransitionNotes('');
      fetchTasks();
      fetchAnalytics();
      setNotification({ type: 'success', text: `Item transitioned to '${targetState}'` });
    } catch (err) {
      setNotification({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="cms-panel wide">
      <div className="cms-panel-heading">
        <div>
          <span className="section-kicker">Stage 2: Post-Launch Engine</span>
          <h2>Enterprise Editorial Workflow & Publishing Engine</h2>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className={activeTab === 'inbox' ? 'primary-btn' : 'secondary-btn'}
            onClick={() => setActiveTab('inbox')}
          >
            <FiInbox /> My Tasks ({tasks.length})
          </button>
          <button
            type="button"
            className={activeTab === 'calendar' ? 'primary-btn' : 'secondary-btn'}
            onClick={() => setActiveTab('calendar')}
          >
            <FiCalendar /> Publishing Calendar
          </button>
          <button
            type="button"
            className={activeTab === 'analytics' ? 'primary-btn' : 'secondary-btn'}
            onClick={() => setActiveTab('analytics')}
          >
            <FiBarChart2 /> Analytics
          </button>
        </div>
      </div>

      {notification && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: notification.type === 'success' ? '#e8f5ee' : '#fdf1f0', color: notification.type === 'success' ? '#2e7d5a' : '#9d3e32' }}>
          {notification.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
          <span>{notification.text}</span>
        </div>
      )}

      {/* ── TAB 1: Task Inbox ("My Tasks") ─────────────────────────────────── */}
      {activeTab === 'inbox' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '0.82rem', color: '#666' }}>Content items requiring review, approval, or revisions</span>
            <button type="button" className="secondary-btn" onClick={fetchTasks}>
              Refresh Tasks
            </button>
          </div>

          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#888' }}>Loading editorial tasks...</div>
          ) : tasks.length === 0 ? (
            <div className="empty-state">No pending editorial tasks in your inbox. All content reviews are up to date!</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {tasks.map((task) => (
                <div key={task._id} style={{ background: '#fff', border: '1px solid #e4ded4', borderRadius: '10px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '0.95rem' }}>{task.title}</strong>
                      <span style={{ fontSize: '0.72rem', background: '#e8f0ef', color: '#426c67', padding: '2px 8px', borderRadius: '4px', textTransform: 'capitalize' }}>
                        {task.type}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.78rem', color: '#888' }}>
                      Status: <strong style={{ color: '#b58b5f' }}>{task.status}</strong> • Updated: {new Date(task.updatedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="primary-btn"
                    style={{ fontSize: '0.8rem' }}
                    onClick={() => {
                      setSelectedTask(task);
                      setShowTransitionModal(true);
                    }}
                  >
                    Review Action
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: Publishing Calendar ─────────────────────────────────────── */}
      {activeTab === 'calendar' && (
        <div>
          <h3 style={{ margin: '0 0 12px', fontSize: '1.05rem' }}>Scheduled Publishing Jobs</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
            {calendar.scheduledJobs?.length === 0 ? (
              <div className="empty-state" style={{ gridColumn: '1/-1' }}>No upcoming scheduled publishing jobs.</div>
            ) : (
              calendar.scheduledJobs.map((job) => (
                <div key={job._id} style={{ background: '#fff', border: '1px solid #e4ded4', borderRadius: '8px', padding: '14px' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--cms-accent, #426c67)', fontWeight: '700' }}>{job.action.toUpperCase()}</span>
                  <div style={{ fontSize: '0.88rem', fontWeight: '600', margin: '4px 0' }}>Scheduled: {new Date(job.scheduledFor).toLocaleString()}</div>
                  <span style={{ fontSize: '0.75rem', color: '#888' }}>Status: {job.status}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: Workflow Analytics ─────────────────────────────────────── */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div style={{ background: '#fff', border: '1px solid #e4ded4', borderRadius: '12px', padding: '20px' }}>
            <span style={{ fontSize: '0.75rem', color: '#888', fontWeight: '700', textTransform: 'uppercase' }}>Total Transitions Logged</span>
            <h3 style={{ margin: '6px 0 0', fontSize: '1.8rem', color: 'var(--cms-accent, #426c67)' }}>{analytics?.totalTransitions || 0}</h3>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e4ded4', borderRadius: '12px', padding: '20px' }}>
            <span style={{ fontSize: '0.75rem', color: '#888', fontWeight: '700', textTransform: 'uppercase' }}>Items Pending Review</span>
            <h3 style={{ margin: '6px 0 0', fontSize: '1.8rem', color: '#b58b5f' }}>{analytics?.pendingReviews || 0}</h3>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e4ded4', borderRadius: '12px', padding: '20px' }}>
            <span style={{ fontSize: '0.75rem', color: '#888', fontWeight: '700', textTransform: 'uppercase' }}>Scheduled Jobs Queued</span>
            <h3 style={{ margin: '6px 0 0', fontSize: '1.8rem', color: '#2e7d5a' }}>{analytics?.scheduledCount || 0}</h3>
          </div>
        </div>
      )}

      {/* Transition Action Modal */}
      {showTransitionModal && selectedTask && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <form onSubmit={handleTransition} style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '380px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ margin: 0 }}>Workflow Action: {selectedTask.title}</h3>
            <label style={{ fontSize: '0.82rem', fontWeight: '600' }}>Target Transition State:</label>
            <select value={targetState} onChange={(e) => setTargetState(e.target.value)}>
              <option value="Approved">Approve Content</option>
              <option value="Changes Requested">Request Changes</option>
              <option value="Scheduled">Schedule Publication</option>
              <option value="Published">Publish Now</option>
              <option value="Archived">Archive Item</option>
            </select>

            <textarea
              placeholder="Editorial review notes / feedback..."
              value={transitionNotes}
              onChange={(e) => setTransitionNotes(e.target.value)}
              rows={3}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" className="secondary-btn" onClick={() => setShowTransitionModal(false)}>
                Cancel
              </button>
              <button type="submit" className="primary-btn">
                Submit Transition
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
  path: '/cms/workflow',
  component: WorkflowManagerModule,
  auth: true,
  permissions: ['workflow.manage'],
});

registerSidebar({
  key: 'workflow',
  label: 'Workflow Engine',
  icon: FiGitPullRequest,
  path: '/cms/workflow',
  group: 'Stage 2 Post-Launch',
  order: 1,
});
