import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { initDatabase } from './db/database';
import applicationRoutes from './routes/applicationRoutes';
import emailRoutes from './routes/emailRoutes';
import excelRoutes from './routes/excelRoutes';
import aiRoutes from './routes/aiRoutes';
import authRoutes from './routes/authRoutes';
import settingsRoutes from './routes/settingsRoutes';
import { EmailService } from './services/emailService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize SQLite database
initDatabase();

// API Routes
app.use('/api/applications', applicationRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/export', excelRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);

// Base health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'Touring Company Application Management System',
    timestamp: new Date().toISOString()
  });
});

// Setup periodic email polling background timer (runs every 5 minutes if configured)
setInterval(async () => {
  try {
    if (process.env.GMAIL_REFRESH_TOKEN) {
      console.log('[Background Timer] Checking Gmail inbox for new customer emails...');
      await EmailService.pollGmailInbox();
    }
  } catch (err) {
    console.error('[Background Timer] Error checking email:', err);
  }
}, 5 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Touring Company Management Backend running on port ${PORT}`);
  console.log(`📊 API Health: http://localhost:${PORT}/api/health`);
  console.log(`=======================================================`);
});
