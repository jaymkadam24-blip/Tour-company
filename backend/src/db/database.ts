import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { Application, SystemSettings } from '../types';

const dbDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'touring_system.db');
export const db = new Database(dbPath);

// Enable WAL mode for better concurrency performance
db.pragma('journal_mode = WAL');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id TEXT UNIQUE NOT NULL,
      email_message_id TEXT UNIQUE NOT NULL,
      email_thread_id TEXT,
      email_received_at TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT,
      tour_package TEXT,
      travel_date TEXT,
      number_of_travelers INTEGER,
      pickup_location TEXT,
      additional_requirements TEXT,
      original_email_subject TEXT NOT NULL,
      original_email_body TEXT NOT NULL,
      original_email_sender TEXT NOT NULL,
      original_email_reference TEXT,
      extraction_confidence REAL DEFAULT 1.0,
      uncertain_fields TEXT,
      extraction_notes TEXT,
      processing_status TEXT DEFAULT 'Processed',
      application_status TEXT DEFAULT 'New',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS email_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id TEXT,
      subject TEXT,
      sender TEXT,
      status TEXT,
      log_message TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // Default settings if empty
  const getSetting = db.prepare('SELECT value FROM settings WHERE key = ?');
  if (!getSetting.get('ai_provider')) {
    const defaultSettings: SystemSettings = {
      ai_provider: 'heuristic',
      gemini_api_key: process.env.GEMINI_API_KEY || '',
      openai_api_key: process.env.OPENAI_API_KEY || '',
      ai_model_name: 'gemini-1.5-flash',
      auto_sync_enabled: true,
      sync_interval_minutes: 5,
      confidence_threshold: 0.75,
      gmail_connected: false,
      gmail_email: ''
    };
    
    const insertSetting = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    Object.entries(defaultSettings).forEach(([k, v]) => {
      insertSetting.run(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
    });
  }

  // Seed initial applications if database is empty
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM applications');
  const count = (countStmt.get() as { count: number }).count;

  if (count === 0) {
    seedInitialData();
  }
}

export function generateApplicationId(): string {
  const row = db.prepare('SELECT id FROM applications ORDER BY id DESC LIMIT 1').get() as { id: number } | undefined;
  const nextId = (row?.id || 0) + 1;
  return `TOUR-${String(nextId).padStart(6, '0')}`;
}

function seedInitialData() {
  const sampleApplications = [
    {
      application_id: 'TOUR-000001',
      email_message_id: 'msg_sample_001',
      email_thread_id: 'thread_001',
      email_received_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      customer_name: 'Sarah Jenkins',
      customer_email: 'sarah.jenkins@example.com',
      customer_phone: '+1 (555) 234-5678',
      tour_package: 'Serengeti Wildlife Safari & Ngorongoro Crater',
      travel_date: '2026-11-15',
      number_of_travelers: 4,
      pickup_location: 'Kilimanjaro International Airport (JRO)',
      additional_requirements: 'Require 2 dietary vegetarian meals and 1 room with ground level access for senior family member.',
      original_email_subject: 'Booking Inquiry for Serengeti Safari 4 People in November',
      original_email_body: `Hi Wanderlust Expeditions Team,\n\nI would like to book a 5-day safari package to Serengeti and Ngorongoro for my family. We are 4 adults in total.\nWe are planning to land at Kilimanjaro International Airport on November 15, 2026. Could you pick us up from the airport?\nAlso, 2 of us are strict vegetarians, and my mother prefers a ground floor lodge room.\n\nPlease send over pricing details and itinerary confirmation.\n\nBest regards,\nSarah Jenkins\n+1 (555) 234-5678`,
      original_email_sender: 'Sarah Jenkins <sarah.jenkins@example.com>',
      original_email_reference: 'https://mail.google.com/mail/u/0/#inbox/msg_sample_001',
      extraction_confidence: 0.98,
      uncertain_fields: JSON.stringify([]),
      extraction_notes: 'All core booking fields extracted with high confidence.',
      processing_status: 'Processed',
      application_status: 'New',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      updated_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
    },
    {
      application_id: 'TOUR-000002',
      email_message_id: 'msg_sample_002',
      email_thread_id: 'thread_002',
      email_received_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
      customer_name: 'Marcus Vance',
      customer_email: 'marcus.vance@techcorp.io',
      customer_phone: '+44 20 7946 0912',
      tour_package: 'Swiss Alps Luxury Trek & Helicopter Scenic Tour',
      travel_date: '2026-12-01',
      number_of_travelers: 2,
      pickup_location: 'Zurich Central Train Station',
      additional_requirements: 'Interested in private photography guide during the Matterhorn portion.',
      original_email_subject: 'Urgent: Booking Swiss Alps Private Helicopter Trek',
      original_email_body: `Hello Touring Manager,\n\nMy partner and I want to reserve the Swiss Alps Luxury Trek starting around December 1st, 2026. We will be staying near Zurich Station so pickup there would be ideal.\n\nCould we also request a private drone/photography guide for the Matterhorn day?\n\nContact me on +44 20 7946 0912.\n\nThanks,\nMarcus Vance`,
      original_email_sender: 'Marcus Vance <marcus.vance@techcorp.io>',
      original_email_reference: 'https://mail.google.com/mail/u/0/#inbox/msg_sample_002',
      extraction_confidence: 0.92,
      uncertain_fields: JSON.stringify([]),
      extraction_notes: 'Parsed custom photography request successfully.',
      processing_status: 'Processed',
      application_status: 'Contacted',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
      updated_at: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString()
    },
    {
      application_id: 'TOUR-000003',
      email_message_id: 'msg_sample_003',
      email_thread_id: 'thread_003',
      email_received_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      customer_name: 'Elena Rostova',
      customer_email: 'elena.rostova@gmail.com',
      customer_phone: '+33 6 12 34 56 78',
      tour_package: 'Kyoto Autumn Cultural & Temple Walking Tour',
      travel_date: '2026-10-20',
      number_of_travelers: 6,
      pickup_location: 'Kyoto Station Hotel',
      additional_requirements: 'Private English speaking guide, matcha tea ceremony reservation included.',
      original_email_subject: 'Group tour inquiry for Kyoto (6 travelers)',
      original_email_body: `Bonjour! We have a group of 6 friends traveling to Japan in October. We would love to join your Kyoto Autumn Cultural tour around October 20th.\nWe will be staying at Kyoto Station Hotel. Please confirm if pickup is available there.\nAlso, is tea ceremony included?\n\nElena Rostova\nelena.rostova@gmail.com`,
      original_email_sender: 'Elena Rostova <elena.rostova@gmail.com>',
      original_email_reference: 'https://mail.google.com/mail/u/0/#inbox/msg_sample_003',
      extraction_confidence: 0.96,
      uncertain_fields: JSON.stringify([]),
      extraction_notes: 'Group booking of 6 travelers confirmed.',
      processing_status: 'Processed',
      application_status: 'Confirmed',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      updated_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString()
    },
    {
      application_id: 'TOUR-000004',
      email_message_id: 'msg_sample_004',
      email_thread_id: 'thread_004',
      email_received_at: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
      customer_name: 'David & Emily Miller',
      customer_email: 'dave.miller@outdoors.org',
      customer_phone: '',
      tour_package: 'Bali Sunset Catamaran & Snorkeling Adventure',
      travel_date: 'Sometime next month',
      number_of_travelers: undefined,
      pickup_location: 'Seminyak area resort',
      additional_requirements: 'Asking for exact price quote per person.',
      original_email_subject: 'Inquiry about sunset catamaran in Bali',
      original_email_body: `Hi there, we saw your Bali Sunset Catamaran tour online. We are visiting Bali sometime next month. What are your rates per person? Can you pick us up from Seminyak? Thanks! - Dave Miller`,
      original_email_sender: 'Dave Miller <dave.miller@outdoors.org>',
      original_email_reference: 'https://mail.google.com/mail/u/0/#inbox/msg_sample_004',
      extraction_confidence: 0.62,
      uncertain_fields: JSON.stringify(['travel_date', 'number_of_travelers', 'customer_phone']),
      extraction_notes: 'Uncertain travel_date (relative term "sometime next month"), missing traveler count and phone number.',
      processing_status: 'Processed',
      application_status: 'Needs Review',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
      updated_at: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString()
    }
  ];

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

  sampleApplications.forEach((app) => {
    stmt.run(
      app.application_id,
      app.email_message_id,
      app.email_thread_id,
      app.email_received_at,
      app.customer_name,
      app.customer_email,
      app.customer_phone || '',
      app.tour_package || '',
      app.travel_date || '',
      app.number_of_travelers || null,
      app.pickup_location || '',
      app.additional_requirements || '',
      app.original_email_subject,
      app.original_email_body,
      app.original_email_sender,
      app.original_email_reference || '',
      app.extraction_confidence,
      app.uncertain_fields,
      app.extraction_notes,
      app.processing_status,
      app.application_status,
      app.created_at,
      app.updated_at
    );
  });
}
