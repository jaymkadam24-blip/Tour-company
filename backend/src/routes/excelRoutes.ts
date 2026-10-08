import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { Application } from '../types';
import { ExcelService } from '../services/excelService';

const router = Router();

// GET /api/export/excel - Download Excel file
router.get('/excel', async (req: Request, res: Response) => {
  try {
    const { status, search, startDate, endDate } = req.query;

    let query = 'SELECT * FROM applications WHERE 1=1';
    const params: string[] = [];

    if (status && status !== 'All') {
      query += ' AND application_status = ?';
      params.push(status as string);
    }

    if (search) {
      query += ' AND (application_id LIKE ? OR customer_name LIKE ? OR customer_email LIKE ? OR tour_package LIKE ? OR original_email_subject LIKE ?)';
      const pattern = `%${search}%`;
      params.push(pattern, pattern, pattern, pattern, pattern);
    }

    if (startDate) {
      query += ' AND email_received_at >= ?';
      params.push(startDate as string);
    }

    if (endDate) {
      query += ' AND email_received_at <= ?';
      params.push(endDate as string);
    }

    query += ' ORDER BY created_at DESC';

    const applications = db.prepare(query).all(...params) as Application[];

    const excelBuffer = await ExcelService.generateApplicationsSpreadsheet(applications);

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `Touring_Applications_Export_${timestamp}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(excelBuffer);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

export default router;
