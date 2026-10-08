import { google } from 'googleapis';
import { db, generateApplicationId } from '../db/database';
import { AIService } from './aiService';
import { EmailMessage } from '../types';

export class EmailService {
  private static oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID || '',
    process.env.GMAIL_CLIENT_SECRET || '',
    process.env.GMAIL_REDIRECT_URI || 'http://localhost:5000/api/emails/oauth/callback'
  );

  public static getAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/userinfo.email'
    ];
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });
  }

  public static async checkAndProcessMessage(msg: EmailMessage): Promise<{ status: 'created' | 'duplicate' | 'ignored'; applicationId?: string; reason?: string }> {
    // 1. Check duplicate protection by email_message_id
    const existing = db.prepare('SELECT id, application_id FROM applications WHERE email_message_id = ?').get(msg.message_id) as { id: number; application_id: string } | undefined;
    
    if (existing) {
      this.logSync(msg.message_id, msg.subject, msg.sender_email, 'Duplicate', `Skipped existing message ID: ${msg.message_id}`);
      return { status: 'duplicate', applicationId: existing.application_id, reason: 'Duplicate email_message_id' };
    }

    // 2. Perform AI Extraction
    const extracted = await AIService.extractInformation(
      msg.subject,
      msg.body,
      msg.sender_email,
      msg.sender_name
    );

    // 3. Check relevance
    if (!extracted.is_relevant_tour_inquiry) {
      this.logSync(msg.message_id, msg.subject, msg.sender_email, 'Ignored', 'Email determined to be non-tour inquiry or spam');
      return { status: 'ignored', reason: 'Email determined to be non-tour inquiry' };
    }

    // 4. Generate Application ID and Determine Application Status
    const appId = generateApplicationId();
    
    // Auto status determination:
    // If confidence < 0.75 or key fields (travel_date, number_of_travelers) missing -> Needs Review
    // Else -> New
    const thresholdSetting = db.prepare('SELECT value FROM settings WHERE key = ?').get('confidence_threshold') as { value: string } | undefined;
    const confidenceThreshold = thresholdSetting ? parseFloat(thresholdSetting.value) : 0.75;
    
    let initialStatus: 'New' | 'Needs Review' = 'New';
    if (extracted.extraction_confidence < confidenceThreshold || extracted.uncertain_fields.length > 0) {
      initialStatus = 'Needs Review';
    }

    const now = new Date().toISOString();

    // 5. Save application to Database
    const stmt = db.prepare(`
      INSERT INTO applications (
        application_id, email_message_id, email_thread_id, email_received_at,
        customer_name, customer_email, customer_phone, tour_package, travel_date,
        number_of_travelers, pickup_location, additional_requirements,
        original_email_subject, original_email_body, original_email_sender,
        original_email_reference, extraction_confidence, uncertain_fields,
        extraction_notes, processing_status, application_status, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `);

    stmt.run(
      appId,
      msg.message_id,
      msg.thread_id || `thread_${Date.now()}`,
      msg.received_at || now,
      extracted.customer_name,
      extracted.customer_email,
      extracted.customer_phone || '',
      extracted.tour_package || '',
      extracted.travel_date || '',
      extracted.number_of_travelers || null,
      extracted.pickup_location || '',
      extracted.additional_requirements || '',
      msg.subject,
      msg.body,
      `${msg.sender_name} <${msg.sender_email}>`,
      msg.reference_link || `https://mail.google.com/mail/u/0/#inbox/${msg.message_id}`,
      extracted.extraction_confidence,
      JSON.stringify(extracted.uncertain_fields),
      extracted.extraction_notes,
      'Processed',
      initialStatus,
      now,
      now
    );

    this.logSync(msg.message_id, msg.subject, msg.sender_email, 'Created', `Successfully created application ${appId} with status ${initialStatus}`);

    return { status: 'created', applicationId: appId };
  }

  private static logSync(messageId: string, subject: string, sender: string, status: string, logMessage: string) {
    db.prepare(`
      INSERT INTO email_logs (message_id, subject, sender, status, log_message, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(messageId, subject, sender, status, logMessage, new Date().toISOString());
  }

  public static async pollGmailInbox(): Promise<{ processedCount: number; duplicatesCount: number; errors: string[] }> {
    const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
    if (!refreshToken) {
      return { processedCount: 0, duplicatesCount: 0, errors: ['Gmail OAuth refresh token not configured in .env. Use simulation mode or authorize Gmail.'] };
    }

    try {
      this.oauth2Client.setCredentials({ refresh_token: refreshToken });
      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

      // List recent unread messages
      const res = await gmail.users.messages.list({
        userId: 'me',
        q: 'is:unread category:primary',
        maxResults: 15
      });

      const messages = res.data.messages || [];
      let processed = 0;
      let duplicates = 0;
      const errors: string[] = [];

      for (const m of messages) {
        if (!m.id) continue;
        try {
          const detail = await gmail.users.messages.get({ userId: 'me', id: m.id });
          const payload = detail.data.payload;
          const headers = payload?.headers || [];

          const subject = headers.find(h => h.name?.toLowerCase() === 'subject')?.value || '(No Subject)';
          const from = headers.find(h => h.name?.toLowerCase() === 'from')?.value || '';
          const date = headers.find(h => h.name?.toLowerCase() === 'date')?.value || new Date().toISOString();

          // Extract sender name and email
          const senderMatch = from.match(/^(?:"?([^"]*)"?\s)?<?([^\s>]+)>?$/);
          const senderName = senderMatch ? (senderMatch[1] || senderMatch[2]) : from;
          const senderEmail = senderMatch ? senderMatch[2] : from;

          // Extract Body
          let body = detail.data.snippet || '';
          if (payload?.parts) {
            const textPart = payload.parts.find(p => p.mimeType === 'text/plain');
            if (textPart?.body?.data) {
              body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
            }
          }

          const result = await this.checkAndProcessMessage({
            message_id: m.id,
            thread_id: detail.data.threadId || undefined,
            sender_name: senderName,
            sender_email: senderEmail,
            subject,
            body,
            received_at: new Date(date).toISOString(),
            reference_link: `https://mail.google.com/mail/u/0/#inbox/${m.id}`
          });

          if (result.status === 'created') processed++;
          if (result.status === 'duplicate') duplicates++;
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          errors.push(`Error processing Gmail msg ${m.id}: ${msg}`);
        }
      }

      return { processedCount: processed, duplicatesCount: duplicates, errors };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { processedCount: 0, duplicatesCount: 0, errors: [msg] };
    }
  }
}
