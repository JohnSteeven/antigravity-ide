/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  FormBuilderModule.js  —  Dynamic Form Builder & Lead Inbox Dashboard
 *  MyJourney CMS  |  Stage 2 — Phase 14: Dynamic Form Builder & Lead Management
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback } from 'react';
import apiService from '../../services/apiService';
import DynamicFormRenderer from '../forms/DynamicFormRenderer';
import { registerRoute } from '../../core/registerRoute';
import { registerSidebar } from '../../core/registerSidebar';
import {
  FiInbox,
  FiFileText,
  FiPlus,
  FiCheckCircle,
  FiAlertCircle,
  FiBarChart2,
  FiUserCheck,
  FiFilter,
  FiEye,
  FiTag,
  FiLayers,
} from 'react-icons/fi';

export default function FormBuilderModule() {
  const [activeTab, setActiveTab] = useState('forms'); // 'forms', 'leads', 'analytics'
  const [forms, setForms] = useState([]);
  const [leads, setLeads] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Form Creation Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('General');

  // Preview Form State
  const [previewForm, setPreviewForm] = useState(null);

  const fetchForms = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.get('/api/forms');
      if (res?.data) setForms(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLeads = useCallback(async () => {
    try {
      const res = await apiService.get('/api/forms/leads');
      if (res?.data) setLeads(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await apiService.get('/api/forms/analytics');
      if (res?.data) setAnalytics(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchForms();
    fetchLeads();
    fetchAnalytics();
  }, [fetchForms, fetchLeads, fetchAnalytics]);

  const handleCreateForm = async (e) => {
    e.preventDefault();
    if (!newKey || !newTitle) return;

    try {
      await apiService.post('/api/forms', {
        key: newKey,
        title: newTitle,
        description: newDesc,
        category: newCategory,
        fields: [
          { key: 'full_name', label: 'Full Name', type: 'text', required: true },
          { key: 'email', label: 'Email Address', type: 'email', required: true },
          { key: 'message', label: 'Message', type: 'textarea', required: false },
        ],
      });

      setShowCreateModal(false);
      setNewKey('');
      setNewTitle('');
      setNewDesc('');
      setNotification({ type: 'success', text: `Form schema '${newTitle}' created successfully!` });
      fetchForms();
    } catch (err) {
      setNotification({ type: 'error', text: err.message });
    }
  };

  const handleUpdateLeadStatus = async (leadId, newStatus) => {
    try {
      await apiService.patch(`/api/forms/leads/${leadId}`, { status: newStatus });
      setNotification({ type: 'success', text: `Lead status updated to '${newStatus}'` });
      fetchLeads();
      fetchAnalytics();
    } catch (err) {
      setNotification({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="cms-panel wide">
      <div className="cms-panel-heading">
        <div>
          <span className="section-kicker">Stage 2: Post-Launch Engine</span>
          <h2>Enterprise Dynamic Form Builder & Lead Management</h2>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className={activeTab === 'forms' ? 'primary-btn' : 'secondary-btn'}
            onClick={() => setActiveTab('forms')}
          >
            <FiFileText /> Form Schemas ({forms.length})
          </button>
          <button
            type="button"
            className={activeTab === 'leads' ? 'primary-btn' : 'secondary-btn'}
            onClick={() => setActiveTab('leads')}
          >
            <FiInbox /> Lead Inbox ({leads.length})
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

      {/* TAB 1: Form Schemas */}
      {activeTab === 'forms' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '0.82rem', color: '#666' }}>Schema-driven enterprise forms for lead generation</span>
            <button type="button" className="primary-btn" onClick={() => setShowCreateModal(true)}>
              <FiPlus /> Create New Form
            </button>
          </div>

          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#888' }}>Loading form schemas...</div>
          ) : forms.length === 0 ? (
            <div className="empty-state">No form schemas created yet.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {forms.map((form) => (
                <div key={form._id} style={{ background: '#fff', border: '1px solid #e4ded4', borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', background: '#e8f0ef', color: '#426c67', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: '700' }}>
                      {form.category}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#888' }}>{form.fields?.length || 0} fields</span>
                  </div>

                  <strong style={{ fontSize: '1rem' }}>{form.title}</strong>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#666' }}>{form.description || 'No description provided.'}</p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#888' }}>key: {form.key}</span>
                    <button type="button" className="small-outline-btn" onClick={() => setPreviewForm(form)}>
                      <FiEye /> Test Form
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Form Live Test Preview Drawer */}
          {previewForm && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '480px', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0 }}>Live Form Tester: {previewForm.title}</h3>
                  <button type="button" className="secondary-btn" onClick={() => setPreviewForm(null)}>
                    Close
                  </button>
                </div>
                <DynamicFormRenderer schema={previewForm} onSuccess={() => fetchLeads()} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Lead Inbox */}
      {activeTab === 'leads' && (
        <div>
          <h3 style={{ margin: '0 0 12px', fontSize: '1.05rem' }}>Incoming Customer Submissions & Leads</h3>

          {leads.length === 0 ? (
            <div className="empty-state">No lead submissions in inbox.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {leads.map((lead) => (
                <div key={lead._id} style={{ background: '#fff', border: '1px solid #e4ded4', borderRadius: '10px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '0.9rem' }}>{lead.data?.full_name || lead.data?.email || 'Visitor'}</strong>
                      <span style={{ fontSize: '0.72rem', background: '#e8f0ef', color: '#426c67', padding: '2px 8px', borderRadius: '4px' }}>
                        {lead.formKey}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#666', marginTop: '4px' }}>
                      Submissions: {JSON.stringify(lead.data)}
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#888', display: 'block', marginTop: '4px' }}>
                      Received: {new Date(lead.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <select value={lead.status} onChange={(e) => handleUpdateLeadStatus(lead._id, e.target.value)} style={{ padding: '4px 8px', fontSize: '0.8rem' }}>
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="qualified">Qualified</option>
                      <option value="in_progress">In Progress</option>
                      <option value="won">Won</option>
                      <option value="lost">Lost</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Analytics */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div style={{ background: '#fff', border: '1px solid #e4ded4', borderRadius: '12px', padding: '20px' }}>
            <span style={{ fontSize: '0.75rem', color: '#888', fontWeight: '700', textTransform: 'uppercase' }}>Active Form Schemas</span>
            <h3 style={{ margin: '6px 0 0', fontSize: '1.8rem', color: 'var(--cms-accent, #426c67)' }}>{analytics?.totalForms || 0}</h3>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e4ded4', borderRadius: '12px', padding: '20px' }}>
            <span style={{ fontSize: '0.75rem', color: '#888', fontWeight: '700', textTransform: 'uppercase' }}>Total Lead Submissions</span>
            <h3 style={{ margin: '6px 0 0', fontSize: '1.8rem', color: '#2e7d5a' }}>{analytics?.totalSubmissions || 0}</h3>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e4ded4', borderRadius: '12px', padding: '20px' }}>
            <span style={{ fontSize: '0.75rem', color: '#888', fontWeight: '700', textTransform: 'uppercase' }}>New Inbox Leads</span>
            <h3 style={{ margin: '6px 0 0', fontSize: '1.8rem', color: '#b58b5f' }}>{analytics?.newLeads || 0}</h3>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e4ded4', borderRadius: '12px', padding: '20px' }}>
            <span style={{ fontSize: '0.75rem', color: '#888', fontWeight: '700', textTransform: 'uppercase' }}>Lead Conversion Rate</span>
            <h3 style={{ margin: '6px 0 0', fontSize: '1.8rem', color: 'var(--cms-accent, #426c67)' }}>{analytics?.conversionRate || '0%'}</h3>
          </div>
        </div>
      )}

      {/* Create Form Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <form onSubmit={handleCreateForm} style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '380px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ margin: 0 }}>Create Dynamic Form Schema</h3>

            <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>Form Unique Key:</label>
            <input type="text" placeholder="e.g. feedback_form" value={newKey} onChange={(e) => setNewKey(e.target.value)} required />

            <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>Form Title:</label>
            <input type="text" placeholder="e.g. Customer Feedback Form" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required />

            <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>Category:</label>
            <input type="text" placeholder="e.g. Support" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />

            <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>Description:</label>
            <textarea placeholder="Form summary..." value={newDesc} onChange={(e) => setNewDesc(e.target.value)} rows={2} />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <button type="button" className="secondary-btn" onClick={() => setShowCreateModal(false)}>
                Cancel
              </button>
              <button type="submit" className="primary-btn">
                Create Schema
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
  path: '/cms/forms',
  component: FormBuilderModule,
  auth: true,
  permissions: ['form.manage'],
});

registerSidebar({
  key: 'forms',
  label: 'Form Builder & Leads',
  icon: FiInbox,
  path: '/cms/forms',
  group: 'Stage 2 Post-Launch',
  order: 4,
});
