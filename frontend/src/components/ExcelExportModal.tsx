import React, { useState } from 'react';
import { X, FileSpreadsheet, Download, CheckCircle2 } from 'lucide-react';
import { downloadExcelExport } from '../api';

interface ExcelExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeStatusFilter?: string;
  activeSearchQuery?: string;
}

export const ExcelExportModal: React.FC<ExcelExportModalProps> = ({
  isOpen,
  onClose,
  activeStatusFilter = 'All',
  activeSearchQuery = '',
}) => {
  if (!isOpen) return null;

  const [exportStatus, setExportStatus] = useState(activeStatusFilter);
  const [search, setSearch] = useState(activeSearchQuery);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const statuses = ['All', 'New', 'Needs Review', 'Contacted', 'Confirmed', 'Completed', 'Cancelled'];

  const handleTriggerDownload = () => {
    setIsExporting(true);
    try {
      downloadExcelExport({
        status: exportStatus,
        search,
        startDate,
        endDate
      });
    } finally {
      setTimeout(() => setIsExporting(false), 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col text-slate-900">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Export Applications to Excel</h2>
              <p className="text-xs text-slate-500">Generate formatted .xlsx workbook with custom styling</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          
          {/* Status Filter */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Filter by Application Status:
            </label>
            <select
              value={exportStatus}
              onChange={(e) => setExportStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-900"
            >
              {statuses.map(st => (
                <option key={st} value={st}>{st === 'All' ? 'All Applications (No status filter)' : st}</option>
              ))}
            </select>
          </div>

          {/* Search Keywords */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Search Keywords (Optional):
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="e.g. Serengeti, Sarah, TOUR-000001"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-900"
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-900"
              />
            </div>
          </div>

          {/* Excel Format Preview Info */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Spreadsheet Features Included:
            </div>
            <ul className="list-disc list-inside text-slate-600 text-[11px] space-y-1 pl-1">
              <li>Sheet 1: Applications Data with status badges and confidence highlight</li>
              <li>Sheet 2: Executive Summary Report with traveler metrics & breakdown</li>
              <li>Human readable App IDs, email subjects, and special requirements</li>
            </ul>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleTriggerDownload}
              disabled={isExporting}
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition disabled:opacity-50"
            >
              <Download className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />
              <span>{isExporting ? 'Generating Excel File...' : 'Download .XLSX Workbook'}</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
