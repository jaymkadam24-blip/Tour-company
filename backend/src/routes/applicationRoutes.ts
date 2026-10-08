import { Router, Request, Response } from 'express';
import { db, generateApplicationId } from '../db/database';
import { Application, ApplicationStatus } from '../types';
import { AIService } from '../services/aiService';

const router = Router();

// GET /api/applications - List with filter, search, sorting
router.get('/', (req: Request, res: Response) => {
  try {
    const { status, search, startDate, endDate, sort = 'created_at', order = 'DESC' } = req.query;

    let query = 'SELECT * FROM applications WHERE 1=1';
    const params: (string | number)[] = [];

    if (status && status !== 'All') {
      query += ' AND application_status = ?';
      params.push(status as string);
    }

    if (search) {
      query += ' AND (application_id LIKE ? OR customer_name LIKE ? OR customer_email LIKE ? OR tour_package LIKE ? OR original_email_subject LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }

    if (startDate) {
      query += ' AND email_received_at >= ?';
      params.push(startDate as string);
    }

    if (endDate) {
      query += ' AND email_received_at <= ?';
      params.push(endDate as string);
    }

    const allowedSortFields = ['created_at', 'email_received_at', 'customer_name', 'application_status', 'extraction_confidence', 'id'];
    const sortField = allowedSortFields.includes(sort as string) ? (sort as string) : 'created_at';
    const sortOrder = order === 'ASC' ? 'ASC' : 'DESC';

    query += ` ORDER BY ${sortField} ${sortOrder}`;

    const rows = db.prepare(query).all(...params) as Application[];

    // Parse uncertain_fields JSON
    const applications = rows.map(app => ({
      ...app,
      uncertain_fields: app.uncertain_fields ? JSON.parse(app.uncertain_fields) : []
    }));

    // Stats summary
    const statsStmt = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN application_status = 'New' THEN 1 ELSE 0 END) as new_count,
        SUM(CASE WHEN application_status = 'Contacted' THEN 1 ELSE 0 END) as contacted_count,
        SUM(CASE WHEN application_status = 'Confirmed' THEN 1 ELSE 0 END) as confirmed_count,
        SUM(CASE WHEN application_status = 'Completed' THEN 1 ELSE 0 END) as completed_count,
        SUM(CASE WHEN application_status = 'Cancelled' THEN 1 ELSE 0 END) as cancelled_count,
        SUM(CASE WHEN application_status = 'Needs Review' THEN 1 ELSE 0 END) as needs_review_count
      FROM applications
    `);
    const stats = statsStmt.get();

    res.json({
      success: true,
      data: applications,
      stats
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

// GET /api/applications/:id - Single Application
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const isNum = !isNaN(Number(id));
    
    const query = isNum 
      ? 'SELECT * FROM applications WHERE id = ?' 
      : 'SELECT * FROM applications WHERE application_id = ?';
    
    const app = db.prepare(query).get(id) as Application | undefined;

    if (!app) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    return res.json({
      success: true,
      data: {
        ...app,
        uncertain_fields: app.uncertain_fields ? JSON.parse(app.uncertain_fields) : []
      }
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ success: false, error: msg });
  }
});

// POST /api/applications - Create Application manually or from raw text
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      customer_name,
      customer_email,
      customer_phone,
      tour_package,
      travel_date,
      number_of_travelers,
      pickup_location,
      additional_requirements,
      original_email_subject,
      original_email_body,
      original_email_sender,
      application_status = 'New',
      raw_email_text
    } = req.body;

    let finalName = customer_name;
    let finalEmail = customer_email;
    let finalPhone = customer_phone;
    let finalPackage = tour_package;
    let finalDate = travel_date;
    let finalTravelers = number_of_travelers;
    let finalPickup = pickup_location;
    let finalRequirements = additional_requirements;
    let finalSubject = original_email_subject || 'Manual Tour Inquiry';
    let finalBody = original_email_body || raw_email_text || '';
    let finalSender = original_email_sender || `${customer_name || 'Customer'} <${customer_email || 'customer@example.com'}>`;
    let confidence = 1.0;
    let uncertainFields: string[] = [];
    let notes = 'Manually created application';

    // If raw_email_text is provided, run AI extraction first
    if (raw_email_text && !customer_name) {
      const extracted = await AIService.extractInformation(
        finalSubject,
        raw_email_text,
        customer_email || 'inquiry@customer.com'
      );

      finalName = extracted.customer_name;
      finalEmail = extracted.customer_email;
      finalPhone = extracted.customer_phone;
      finalPackage = extracted.tour_package;
      finalDate = extracted.travel_date;
      finalTravelers = extracted.number_of_travelers;
      finalPickup = extracted.pickup_location;
      finalRequirements = extracted.additional_requirements;
      confidence = extracted.extraction_confidence;
      uncertainFields = extracted.uncertain_fields;
      notes = extracted.extraction_notes;
    }

    const appId = generateApplicationId();
    const msgId = `manual_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO applications (
        application_id, email_message_id, email_thread_id, email_received_at,
        customer_name, customer_email, customer_phone, tour_package, travel_date,
        number_of_travelers, pickup_location, additional_requirements,
        original_email_subject, original_email_body, original_email_sender,
        original_email_reference, extraction_confidence, uncertain_fields,
        extraction_notes, processing_status, application_status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      appId,
      msgId,
      `thread_manual_${Date.now()}`,
      now,
      finalName || 'Unknown Customer',
      finalEmail || 'unknown@example.com',
      finalPhone || '',
      finalPackage || '',
      finalDate || '',
      finalTravelers || null,
      finalPickup || '',
      finalRequirements || '',
      finalSubject,
      finalBody,
      finalSender,
      'Manual Input',
      confidence,
      JSON.stringify(uncertainFields),
      notes,
      'Processed',
      application_status,
      now,
      now
    );

    const created = db.prepare('SELECT * FROM applications WHERE application_id = ?').get(appId) as Application;

    res.status(201).json({
      success: true,
      message: 'Application created successfully',
      data: {
        ...created,
        uncertain_fields: JSON.parse(created.uncertain_fields || '[]')
      }
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

// PUT /api/applications/:id - Update Application
router.put('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const isNum = !isNaN(Number(id));
    const targetQuery = isNum ? 'SELECT * FROM applications WHERE id = ?' : 'SELECT * FROM applications WHERE application_id = ?';
    const existing = db.prepare(targetQuery).get(id) as Application | undefined;

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    const {
      customer_name,
      customer_email,
      customer_phone,
      tour_package,
      travel_date,
      number_of_travelers,
      pickup_location,
      additional_requirements,
      application_status,
      extraction_notes,
      uncertain_fields
    } = req.body;

    const validStatuses: ApplicationStatus[] = ['New', 'Contacted', 'Confirmed', 'Completed', 'Cancelled', 'Needs Review'];
    if (application_status && !validStatuses.includes(application_status)) {
      return res.status(400).json({ success: false, error: `Invalid status. Allowed values: ${validStatuses.join(', ')}` });
    }

    const updatedName = customer_name ?? existing.customer_name;
    const updatedEmail = customer_email ?? existing.customer_email;
    const updatedPhone = customer_phone ?? existing.customer_phone;
    const updatedPackage = tour_package ?? existing.tour_package;
    const updatedDate = travel_date ?? existing.travel_date;
    const updatedTravelers = number_of_travelers !== undefined ? number_of_travelers : existing.number_of_travelers;
    const updatedPickup = pickup_location ?? existing.pickup_location;
    const updatedReqs = additional_requirements ?? existing.additional_requirements;
    const updatedStatus = application_status ?? existing.application_status;
    const updatedNotes = extraction_notes ?? existing.extraction_notes;
    const updatedUncertain = uncertain_fields ? (typeof uncertain_fields === 'string' ? uncertain_fields : JSON.stringify(uncertain_fields)) : existing.uncertain_fields;
    const now = new Date().toISOString();

    const updateStmt = db.prepare(`
      UPDATE applications SET
        customer_name = ?,
        customer_email = ?,
        customer_phone = ?,
        tour_package = ?,
        travel_date = ?,
        number_of_travelers = ?,
        pickup_location = ?,
        additional_requirements = ?,
        application_status = ?,
        extraction_notes = ?,
        uncertain_fields = ?,
        updated_at = ?
      WHERE id = ?
    `);

    updateStmt.run(
      updatedName,
      updatedEmail,
      updatedPhone,
      updatedPackage,
      updatedDate,
      updatedTravelers,
      updatedPickup,
      updatedReqs,
      updatedStatus,
      updatedNotes,
      updatedUncertain,
      now,
      existing.id
    );

    const updatedApp = db.prepare('SELECT * FROM applications WHERE id = ?').get(existing.id) as Application;

    return res.json({
      success: true,
      message: 'Application updated successfully',
      data: {
        ...updatedApp,
        uncertain_fields: JSON.parse(updatedApp.uncertain_fields || '[]')
      }
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ success: false, error: msg });
  }
});

// DELETE /api/applications/:id
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const isNum = !isNaN(Number(id));
    const targetQuery = isNum ? 'DELETE FROM applications WHERE id = ?' : 'DELETE FROM applications WHERE application_id = ?';
    const result = db.prepare(targetQuery).run(id);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    return res.json({ success: true, message: 'Application deleted successfully' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ success: false, error: msg });
  }
});

// POST /api/applications/:id/re-extract - Trigger AI re-extraction
router.post('/:id/re-extract', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const isNum = !isNaN(Number(id));
    const targetQuery = isNum ? 'SELECT * FROM applications WHERE id = ?' : 'SELECT * FROM applications WHERE application_id = ?';
    const app = db.prepare(targetQuery).get(id) as Application | undefined;

    if (!app) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    const extracted = await AIService.extractInformation(
      app.original_email_subject,
      app.original_email_body,
      app.customer_email,
      app.customer_name
    );

    const now = new Date().toISOString();

    db.prepare(`
      UPDATE applications SET
        customer_name = ?,
        customer_phone = ?,
        tour_package = ?,
        travel_date = ?,
        number_of_travelers = ?,
        pickup_location = ?,
        additional_requirements = ?,
        extraction_confidence = ?,
        uncertain_fields = ?,
        extraction_notes = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      extracted.customer_name || app.customer_name,
      extracted.customer_phone || app.customer_phone,
      extracted.tour_package || app.tour_package,
      extracted.travel_date || app.travel_date,
      extracted.number_of_travelers || app.number_of_travelers,
      extracted.pickup_location || app.pickup_location,
      extracted.additional_requirements || app.additional_requirements,
      extracted.extraction_confidence,
      JSON.stringify(extracted.uncertain_fields),
      `Re-extracted: ${extracted.extraction_notes}`,
      now,
      app.id
    );

    const updatedApp = db.prepare('SELECT * FROM applications WHERE id = ?').get(app.id) as Application;

    return res.json({
      success: true,
      message: 'Re-extraction completed',
      data: {
        ...updatedApp,
        uncertain_fields: JSON.parse(updatedApp.uncertain_fields || '[]')
      }
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ success: false, error: msg });
  }
});

export default router;
