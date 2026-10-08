import { Router, Request, Response } from 'express';
import { EmailService } from '../services/emailService';
import { db } from '../db/database';

const router = Router();

// GET /api/emails/status
router.get('/status', (req: Request, res: Response) => {
  try {
    const gmailEmail = db.prepare("SELECT value FROM settings WHERE key = 'gmail_email'").get() as { value: string } | undefined;
    const gmailConnected = db.prepare("SELECT value FROM settings WHERE key = 'gmail_connected'").get() as { value: string } | undefined;
    const lastLog = db.prepare("SELECT * FROM email_logs ORDER BY id DESC LIMIT 1").get();

    res.json({
      success: true,
      data: {
        gmail_connected: gmailConnected?.value === 'true' || !!process.env.GMAIL_REFRESH_TOKEN,
        gmail_email: gmailEmail?.value || process.env.GMAIL_USER || 'admin@wanderlust-tours.com',
        last_sync: lastLog
      }
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

// POST /api/emails/sync - Trigger inbox sync
router.post('/sync', async (req: Request, res: Response) => {
  try {
    const result = await EmailService.pollGmailInbox();
    res.json({
      success: true,
      message: `Sync completed. ${result.processedCount} processed, ${result.duplicatesCount} duplicates skipped.`,
      result
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

// POST /api/emails/simulate - Live Email Simulator tool endpoint
router.post('/simulate', async (req: Request, res: Response) => {
  try {
    const {
      sender_name = 'Alex Morgan',
      sender_email = 'alex.morgan@example.org',
      subject = 'Booking Request: Amalfi Coast 3-Day Boat Tour',
      body = `Hi Wandurlust Tours team,\n\nI want to book the Amalfi Coast Private Boat Tour for 3 passengers on October 28th, 2026.\nWe will be staying at Hotel Positano. Can you arrange pick up at 9:00 AM?\nAlso my phone number is +1 (415) 890-1234.\n\nThank you,\nAlex Morgan`,
      received_at = new Date().toISOString()
    } = req.body;

    const message_id = `sim_msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const thread_id = `sim_thread_${Date.now()}`;

    const result = await EmailService.checkAndProcessMessage({
      message_id,
      thread_id,
      sender_name,
      sender_email,
      subject,
      body,
      received_at,
      reference_link: `https://mail.google.com/mail/u/0/#inbox/${message_id}`
    });

    if (result.status === 'duplicate') {
      return res.status(409).json({
        success: false,
        message: 'Duplicate email detected! This email message_id has already been processed into an application.',
        result
      });
    }

    if (result.status === 'ignored') {
      return res.json({
        success: true,
        message: 'Email processed, but flagged as non-tour inquiry or irrelevant.',
        result
      });
    }

    const createdApp = db.prepare('SELECT * FROM applications WHERE application_id = ?').get(result.applicationId);

    return res.status(201).json({
      success: true,
      message: `Simulated email processed into application ${result.applicationId}`,
      result,
      application: createdApp
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ success: false, error: msg });
  }
});

// GET /api/emails/logs - Sync History
router.get('/logs', (req: Request, res: Response) => {
  try {
    const logs = db.prepare('SELECT * FROM email_logs ORDER BY id DESC LIMIT 50').all();
    res.json({ success: true, data: logs });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

export default router;
