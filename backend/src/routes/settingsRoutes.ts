import { Router, Request, Response } from 'express';
import { db } from '../db/database';

const router = Router();

// GET /api/settings - Get settings
router.get('/', (req: Request, res: Response) => {
  try {
    const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
    const settings: Record<string, string | number | boolean> = {};

    rows.forEach(r => {
      if (r.value === 'true') settings[r.key] = true;
      else if (r.value === 'false') settings[r.key] = false;
      else if (!isNaN(Number(r.value)) && r.value !== '') settings[r.key] = Number(r.value);
      else settings[r.key] = r.value;
    });

    // Hide sensitive keys partial text
    if (typeof settings.gemini_api_key === 'string' && settings.gemini_api_key.length > 8) {
      settings.gemini_api_key_masked = settings.gemini_api_key.slice(0, 4) + '...' + settings.gemini_api_key.slice(-4);
    }
    if (typeof settings.openai_api_key === 'string' && settings.openai_api_key.length > 8) {
      settings.openai_api_key_masked = settings.openai_api_key.slice(0, 4) + '...' + settings.openai_api_key.slice(-4);
    }

    res.json({ success: true, data: settings });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

// POST /api/settings - Save settings
router.post('/', (req: Request, res: Response) => {
  try {
    const newSettings = req.body;
    const insertStmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');

    Object.entries(newSettings).forEach(([k, v]) => {
      insertStmt.run(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
    });

    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

export default router;
