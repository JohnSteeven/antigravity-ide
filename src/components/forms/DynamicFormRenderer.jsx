/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  DynamicFormRenderer.jsx  —  Public Form Renderer Component
 *  MyJourney CMS  |  Stage 2 — Phase 14: Dynamic Form Builder & Lead Management
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState } from 'react';
import apiService from '../../services/apiService';
import { FiSend, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

export default function DynamicFormRenderer({ schema, onSuccess }) {
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  if (!schema) return <div style={{ color: '#888', fontStyle: 'italic' }}>Form schema not loaded.</div>;

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setStatusMsg(null);
      const res = await apiService.post(`/api/forms/submit/${schema.key}`, formData);
      setStatusMsg({ type: 'success', text: res?.data?.message || 'Thank you for your submission!' });
      setFormData({});
      if (onSuccess) onSuccess(res?.data);
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Submission failed. Please check fields.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ background: '#fff', border: '1px solid #e4ded4', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--cms-accent, #426c67)' }}>{schema.title}</h3>
      {schema.description && <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>{schema.description}</p>}

      {statusMsg && (
        <div style={{ padding: '12px', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: statusMsg.type === 'success' ? '#e8f5ee' : '#fdf1f0', color: statusMsg.type === 'success' ? '#2e7d5a' : '#9d3e32' }}>
          {statusMsg.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {schema.fields?.map((field) => (
        <div key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#333' }}>
            {field.label} {field.required && <span style={{ color: '#9d3e32' }}>*</span>}
          </label>

          {field.type === 'textarea' ? (
            <textarea
              rows={4}
              placeholder={field.placeholder}
              value={formData[field.key] || ''}
              onChange={(e) => handleChange(field.key, e.target.value)}
              required={field.required}
            />
          ) : field.type === 'select' ? (
            <select value={formData[field.key] || ''} onChange={(e) => handleChange(field.key, e.target.value)} required={field.required}>
              <option value="">Select option...</option>
              {field.options?.map((opt, i) => (
                <option key={i} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={field.type === 'email' ? 'email' : field.type === 'number' ? 'number' : field.type === 'url' ? 'url' : 'text'}
              placeholder={field.placeholder}
              value={formData[field.key] || ''}
              onChange={(e) => handleChange(field.key, e.target.value)}
              required={field.required}
            />
          )}
        </div>
      ))}

      <button type="submit" className="primary-btn" disabled={submitting} style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        <FiSend /> {submitting ? 'Submitting...' : 'Submit Form'}
      </button>
    </form>
  );
}
