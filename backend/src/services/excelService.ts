import ExcelJS from 'exceljs';
import { Application } from '../types';

export class ExcelService {
  public static async generateApplicationsSpreadsheet(applications: Application[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Wanderlust Expeditions System';
    workbook.created = new Date();

    // Sheet 1: Applications Data
    const sheet = workbook.addWorksheet('Applications', {
      views: [{ state: 'frozen', ySplit: 1 }]
    });

    // Define headers
    sheet.columns = [
      { header: 'App ID', key: 'application_id', width: 14 },
      { header: 'Status', key: 'application_status', width: 15 },
      { header: 'Confidence', key: 'extraction_confidence', width: 12 },
      { header: 'Customer Name', key: 'customer_name', width: 22 },
      { header: 'Customer Email', key: 'customer_email', width: 26 },
      { header: 'Customer Phone', key: 'customer_phone', width: 18 },
      { header: 'Tour Package', key: 'tour_package', width: 35 },
      { header: 'Travel Date', key: 'travel_date', width: 16 },
      { header: 'Travelers', key: 'number_of_travelers', width: 12 },
      { header: 'Pickup Location', key: 'pickup_location', width: 25 },
      { header: 'Special Requirements', key: 'additional_requirements', width: 40 },
      { header: 'Received Date', key: 'email_received_at', width: 20 },
      { header: 'Original Subject', key: 'original_email_subject', width: 35 },
      { header: 'AI Extraction Notes', key: 'extraction_notes', width: 30 }
    ];

    // Style Header Row
    const headerRow = sheet.getRow(1);
    headerRow.height = 28;
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '1E293B' } // Dark Slate
      };
      cell.font = {
        name: 'Calibri',
        size: 11,
        bold: true,
        color: { argb: 'FFFFFF' }
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        bottom: { style: 'medium', color: { argb: '334155' } }
      };
    });

    // Fill Rows
    applications.forEach((app) => {
      const row = sheet.addRow({
        application_id: app.application_id,
        application_status: app.application_status,
        extraction_confidence: `${Math.round(app.extraction_confidence * 100)}%`,
        customer_name: app.customer_name,
        customer_email: app.customer_email,
        customer_phone: app.customer_phone || '-',
        tour_package: app.tour_package || 'Unspecified',
        travel_date: app.travel_date || 'Unspecified',
        number_of_travelers: app.number_of_travelers || 0,
        pickup_location: app.pickup_location || '-',
        additional_requirements: app.additional_requirements || '-',
        email_received_at: app.email_received_at ? new Date(app.email_received_at).toLocaleDateString('en-US', {
          year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        }) : '-',
        original_email_subject: app.original_email_subject,
        extraction_notes: app.extraction_notes || ''
      });

      row.height = 24;

      // Status custom fill background colors
      const statusCell = row.getCell('application_status');
      statusCell.alignment = { vertical: 'middle', horizontal: 'center' };
      statusCell.font = { bold: true };

      switch (app.application_status) {
        case 'New':
          statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DBEAFE' } }; // Light blue
          statusCell.font = { color: { argb: '1E40AF' }, bold: true };
          break;
        case 'Contacted':
          statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF3C7' } }; // Amber
          statusCell.font = { color: { argb: '92400E' }, bold: true };
          break;
        case 'Confirmed':
          statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D1FAE5' } }; // Emerald
          statusCell.font = { color: { argb: '065F46' }, bold: true };
          break;
        case 'Completed':
          statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0E7FF' } }; // Indigo
          statusCell.font = { color: { argb: '3730A3' }, bold: true };
          break;
        case 'Cancelled':
          statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEE2E2' } }; // Rose
          statusCell.font = { color: { argb: '991B1B' }, bold: true };
          break;
        case 'Needs Review':
          statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEDD5' } }; // Orange
          statusCell.font = { color: { argb: 'C2410C' }, bold: true };
          break;
      }

      // Confidence styling
      const confidenceCell = row.getCell('extraction_confidence');
      confidenceCell.alignment = { vertical: 'middle', horizontal: 'center' };
      if (app.extraction_confidence < 0.75) {
        confidenceCell.font = { color: { argb: 'DC2626' }, bold: true };
      } else {
        confidenceCell.font = { color: { argb: '16A34A' } };
      }

      // Default alignment for all cells in row
      row.eachCell((cell, colNumber) => {
        if (colNumber !== 2 && colNumber !== 3) {
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        }
      });
    });

    // Sheet 2: Executive Summary / Stats
    const summarySheet = workbook.addWorksheet('Summary Report');
    summarySheet.columns = [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Value', key: 'value', width: 20 }
    ];

    const totalCount = applications.length;
    const statusCounts: Record<string, number> = {
      'New': 0, 'Contacted': 0, 'Confirmed': 0, 'Completed': 0, 'Cancelled': 0, 'Needs Review': 0
    };
    let totalTravelers = 0;

    applications.forEach(a => {
      statusCounts[a.application_status] = (statusCounts[a.application_status] || 0) + 1;
      if (a.number_of_travelers) totalTravelers += a.number_of_travelers;
    });

    summarySheet.addRow({ metric: 'Total Applications Exported', value: totalCount });
    summarySheet.addRow({ metric: 'Total Travelers Represented', value: totalTravelers });
    summarySheet.addRow({ metric: 'Applications - New', value: statusCounts['New'] });
    summarySheet.addRow({ metric: 'Applications - Contacted', value: statusCounts['Contacted'] });
    summarySheet.addRow({ metric: 'Applications - Confirmed', value: statusCounts['Confirmed'] });
    summarySheet.addRow({ metric: 'Applications - Completed', value: statusCounts['Completed'] });
    summarySheet.addRow({ metric: 'Applications - Cancelled', value: statusCounts['Cancelled'] });
    summarySheet.addRow({ metric: 'Applications - Needs Review', value: statusCounts['Needs Review'] });
    summarySheet.addRow({ metric: 'Report Generated At', value: new Date().toLocaleString() });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
