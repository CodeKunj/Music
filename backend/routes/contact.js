/* =========================================================
   routes/contact.js — Contact Form Submission
   POST /api/contact
   ========================================================= */

import { Router } from 'express';
import { supabase } from '../lib/supabase.js';

const router = Router();

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/', async (req, res) => {
  try {
    const { name, email, projectType, budget, message } = req.body;

    // Validation
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and message are required.',
      });
    }

    if (!EMAIL_RX.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email address.',
      });
    }

    if (message.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Message must be at least 10 characters.',
      });
    }

    // Insert into Supabase
    const { error } = await supabase
      .from('contact_submissions')
      .insert({
        name:         name.trim(),
        email:        email.trim().toLowerCase(),
        project_type: projectType || null,
        budget:       budget || null,
        message:      message.trim(),
      });

    if (error) throw error;

    // Optional: send email notification (non-blocking)
    sendEmailNotification({ name, email, projectType, budget, message }).catch(
      (e) => console.warn('Email notification failed:', e.message)
    );

    res.status(201).json({
      success: true,
      message: "Thanks for reaching out! Kunj will get back to you within 24 hours.",
    });
  } catch (err) {
    console.error('POST /contact error:', err);
    res.status(500).json({ success: false, error: 'Failed to submit. Please try again.' });
  }
});

// Optional email notification using nodemailer
async function sendEmailNotification(data) {
  if (!process.env.SMTP_HOST || !process.env.NOTIFY_EMAIL) return;

  const { createTransport } = await import('nodemailer');
  const transporter = createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Portfolio Contact" <${process.env.SMTP_USER}>`,
    to: process.env.NOTIFY_EMAIL,
    subject: `New enquiry from ${data.name} — ${data.projectType || 'General'}`,
    html: `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${data.name}</p>
      <p><strong>Email:</strong> ${data.email}</p>
      <p><strong>Project:</strong> ${data.projectType || '—'}</p>
      <p><strong>Budget:</strong> ${data.budget || '—'}</p>
      <p><strong>Message:</strong><br>${data.message.replace(/\n/g, '<br>')}</p>
    `,
  });
}

export default router;
