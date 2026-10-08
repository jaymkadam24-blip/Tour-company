import { Router, Request, Response } from 'express';
import { AIService } from '../services/aiService';

const router = Router();

// POST /api/ai/test-extract - Test extraction on raw email snippet without saving
router.post('/test-extract', async (req: Request, res: Response) => {
  try {
    const { subject = 'Tour Enquiry', body = '', sender_email = 'test@example.com', sender_name = 'Test User' } = req.body;

    if (!body) {
      return res.status(400).json({ success: false, error: 'Email body text is required for AI extraction.' });
    }

    const extracted = await AIService.extractInformation(subject, body, sender_email, sender_name);

    return res.json({
      success: true,
      data: extracted
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ success: false, error: msg });
  }
});

export default router;
