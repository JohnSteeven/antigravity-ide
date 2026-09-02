/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  formService.js  —  Enterprise Dynamic Form Service
 *  MyJourney CMS  |  Stage 2 — Phase 14: Dynamic Form Builder & Lead Management
 * ─────────────────────────────────────────────────────────────────────────────
 */

const FormSchema = require('../models/FormSchema');
const FormSubmission = require('../models/FormSubmission');
const NotificationService = require('../notifications/NotificationService');
const VersionControlService = require('./versionControlService');

const DEFAULT_FORMS = [
  {
    key: 'contact_us',
    title: 'General Contact Us Form',
    description: 'Get in touch with our team for inquiries and feedback.',
    category: 'Customer Support',
    fields: [
      { key: 'full_name', label: 'Full Name', type: 'text', required: true, placeholder: 'Enter your name' },
      { key: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'you@domain.com' },
      { key: 'subject', label: 'Subject', type: 'text', required: true, placeholder: 'How can we help?' },
      { key: 'message', label: 'Message', type: 'textarea', required: true, placeholder: 'Your message here...' },
    ],
  },
  {
    key: 'newsletter_signup',
    title: 'Newsletter Subscription Form',
    description: 'Subscribe to receive news, updates, and story releases.',
    category: 'Marketing',
    fields: [
      { key: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'name@domain.com' },
      { key: 'interests', label: 'Interests', type: 'select', required: false, options: ['Technology', 'Travel', 'Coding', 'Design'] },
    ],
  },
  {
    key: 'job_application',
    title: 'Career & Job Application Form',
    description: 'Apply for open positions at MyJourney CMS.',
    category: 'Human Resources',
    isMultiStep: true,
    fields: [
      { key: 'full_name', label: 'Full Name', type: 'text', required: true, stepIndex: 1 },
      { key: 'email', label: 'Email Address', type: 'email', required: true, stepIndex: 1 },
      { key: 'phone', label: 'Phone Number', type: 'phone', required: false, stepIndex: 1 },
      { key: 'position', label: 'Desired Position', type: 'select', required: true, options: ['Frontend Developer', 'Backend Developer', 'UX Designer', 'Content Editor'], stepIndex: 2 },
      { key: 'resume', label: 'Resume / Portfolio Link', type: 'url', required: true, stepIndex: 2 },
      { key: 'cover_letter', label: 'Cover Letter', type: 'textarea', required: false, stepIndex: 2 },
    ],
  },
];

class FormService {
  /**
   * Seed default form schemas if database is empty
   */
  static async seedDefaults(userId = null) {
    try {
      const count = await FormSchema.countDocuments();
      if (count === 0) {
        console.info('[FormService] Seeding default form schemas...');
        await FormSchema.insertMany(DEFAULT_FORMS.map((f) => ({ ...f, createdBy: userId })));
        console.info(`[FormService] Seeded ${DEFAULT_FORMS.length} default forms.`);
      }
    } catch (err) {
      console.error('[FormService] Seed error:', err.message);
    }
  }

  /**
   * Submit form data and create Lead
   */
  static async submitForm({ formKey, data, req }) {
    await FormService.seedDefaults();

    const form = await FormSchema.findOne({ key: formKey.toLowerCase(), status: 'published' });
    if (!form) throw new Error(`Form schema '${formKey}' not found or inactive.`);

    // 1. Field level validation
    for (const field of form.fields) {
      if (field.required && (!data[field.key] || String(data[field.key]).trim() === '')) {
        throw new Error(`Field '${field.label}' is required.`);
      }
    }

    // 2. Create Submission (Lead)
    const submission = new FormSubmission({
      formId: form._id,
      formKey: form.key,
      data,
      ipAddress: req?.ip || req?.headers?.['x-forwarded-for'] || '',
      userAgent: req?.headers?.['user-agent'] || '',
      status: 'new',
    });

    await submission.save();

    // 3. Trigger Version Control Snapshot
    await VersionControlService.createSnapshot({
      entityType: 'setting',
      entityId: form._id,
      title: `Form Submission: ${form.title}`,
      data: submission,
      notes: `Lead submission logged for form '${form.title}'`,
    }).catch(() => {});

    // 4. Send Notifications
    NotificationService.sendInApp({
      userId: form.createdBy,
      title: `New Lead: ${form.title}`,
      message: `Received new form submission from ${data.email || data.full_name || 'visitor'}.`,
    }).catch(() => {});

    return { success: true, message: form.successMessage, submissionId: submission._id };
  }

  /**
   * Get analytics metrics
   */
  static async getAnalytics() {
    const totalForms = await FormSchema.countDocuments();
    const totalSubmissions = await FormSubmission.countDocuments();
    const newLeads = await FormSubmission.countDocuments({ status: 'new' });
    const wonLeads = await FormSubmission.countDocuments({ status: 'won' });

    return {
      totalForms,
      totalSubmissions,
      newLeads,
      wonLeads,
      conversionRate: totalSubmissions > 0 ? ((wonLeads / totalSubmissions) * 100).toFixed(1) + '%' : '0%',
    };
  }
}

module.exports = FormService;
