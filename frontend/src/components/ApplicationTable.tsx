import React from 'react';
import { Application, ApplicationStatus } from '../types';
import { 
  Search, 
  Calendar, 
  Eye, 
  Trash2, 
  MapPin, 
  Sparkles
} from 'lucide-react';

interface ApplicationTableProps {
  applications: Application[];
  selectedStatus: string;
  onSelectStatus: (status: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  startDate: string;
  onStartDateChange: (d: string) => void;
  endDate: string;
  onEndDateChange: (d: string) => void;
  onSelectApp: (app: Application) => void;
  onUpdateStatus: (id: number | string, status: ApplicationStatus) => void;
  onDeleteApp: (id: number | string) => void;
  onOpenSimulator: () => void;
  isLoading: boolean;
}

export const ApplicationTable: React.FC<ApplicationTableProps> = ({
  applications,
  selectedStatus,
  onSelectStatus,
  searchQuery,
  onSearchChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onSelectApp,
  onUpdateStatus,
  onDeleteApp,
  onOpenSimulator,
  isLoading
}) => {
  const statuses = ['All', 'New', 'Needs Review', 'Contacted', 'Confirmed', 'Completed', 'Cancelled'];



  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Controls Bar */}
      <div className="p-4 border-b border-slate-200 flex flex-col lg:flex-row gap-4 justify-between items-center bg-slate-50/60">
        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 scrollbar-none">
          {statuses.map((st) => (
            <button
              key={st}
              onClick={() => onSelectStatus(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedStatus === st
                  ? 'bg-[#5E56E7] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#5E56E7] hover:bg-[#F5F4FF]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Search & Date Filter Inputs */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ID, name, email, package..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#5E56E7] focus:ring-2 focus:ring-[#5E56E7]/20 transition"
            />
          </div>

          {/* Date range inputs */}
          <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="bg-transparent text-slate-800 focus:outline-none text-[11px]"
              title="From Received Date"
            />
            <span className="text-slate-400">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="bg-transparent text-slate-800 focus:outline-none text-[11px]"
              title="To Received Date"
            />
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider font-bold border-b border-slate-200">
            <tr>
              <th className="py-3.5 px-4 font-bold">App ID</th>
              <th className="py-3.5 px-4 font-bold">Status</th>
              <th className="py-3.5 px-4 font-bold">Customer</th>
              <th className="py-3.5 px-4 font-bold">Tour Package</th>
              <th className="py-3.5 px-4 font-bold">Travel Date</th>
              <th className="py-3.5 px-4 font-bold text-center">Pax</th>
              <th className="py-3.5 px-4 font-bold text-center">AI Confidence</th>
              <th className="py-3.5 px-4 font-bold">Received</th>
              <th className="py-3.5 px-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {isLoading ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs">Loading Applications...</span>
                  </div>
                </td>
              </tr>
            ) : applications.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-16 text-center">
                  <div className="max-w-md mx-auto flex flex-col items-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                      <Search className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800">No applications match your filter</h3>
                    <p className="text-xs text-slate-500">
                      Try resetting your status filter or search query, or use the Email Simulator to generate a new application.
                    </p>
                    <button
                      onClick={onOpenSimulator}
                      className="mt-2 flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Simulate Customer Booking Email</span>
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              applications.map((app) => (
                <tr
                  key={app.id}
                  className="hover:bg-slate-50/80 transition group cursor-pointer"
                  onClick={() => onSelectApp(app)}
                >
                  {/* App ID */}
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    {app.application_id}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                    <div className="relative inline-block">
                      <select
                        value={app.application_status}
                        onChange={(e) => onUpdateStatus(app.id, e.target.value as ApplicationStatus)}
                        className={`rounded-full px-3 py-1 font-bold text-xs focus:outline-none cursor-pointer border transition shadow-xs ${
                          app.application_status === 'Confirmed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : app.application_status === 'Contacted'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : app.application_status === 'Needs Review'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : app.application_status === 'Cancelled'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : app.application_status === 'Completed'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-[#F5F4FF] text-[#5E56E7] border-[#DDD9FE]'
                        }`}
                      >
                        <option value="New" className="bg-white text-slate-800">● New Intake</option>
                        <option value="Contacted" className="bg-white text-slate-800">● Contacted / Submitting</option>
                        <option value="Confirmed" className="bg-white text-slate-800">● Confirmed / Approved</option>
                        <option value="Completed" className="bg-white text-slate-800">● Completed</option>
                        <option value="Cancelled" className="bg-white text-slate-800">● Cancelled / Pending</option>
                        <option value="Needs Review" className="bg-white text-slate-800">● Needs Review</option>
                      </select>
                    </div>
                  </td>

                  {/* Customer Info */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900">{app.customer_name}</div>
                    <div className="text-[11px] text-slate-500 font-mono truncate max-w-[180px]">
                      {app.customer_email}
                    </div>
                  </td>

                  {/* Tour Package */}
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-800 max-w-[220px] truncate" title={app.tour_package}>
                      {app.tour_package || <span className="text-slate-400 italic">Unspecified</span>}
                    </div>
                    {app.pickup_location && (
                      <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 truncate max-w-[200px]">
                        <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                        <span>{app.pickup_location}</span>
                      </div>
                    )}
                  </td>

                  {/* Travel Date */}
                  <td className="py-3.5 px-4 font-medium text-slate-700 whitespace-nowrap">
                    {app.travel_date || <span className="text-slate-400 italic">TBD</span>}
                  </td>

                  {/* Travelers Count */}
                  <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                    {app.number_of_travelers || <span className="text-slate-400 font-normal">-</span>}
                  </td>

                  {/* AI Confidence */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center space-x-1.5">
                      <div className="w-12 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            app.extraction_confidence >= 0.85
                              ? 'bg-emerald-500'
                              : app.extraction_confidence >= 0.7
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${Math.round(app.extraction_confidence * 100)}%` }}
                        ></div>
                      </div>
                      <span className={`font-mono text-[11px] font-bold ${
                        app.extraction_confidence < 0.75 ? 'text-amber-600' : 'text-slate-700'
                      }`}>
                        {Math.round(app.extraction_confidence * 100)}%
                      </span>
                    </div>
                  </td>

                  {/* Received Date */}
                  <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                    {app.email_received_at ? new Date(app.email_received_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    }) : '-'}
                  </td>

                  {/* Action Buttons */}
                  <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => onSelectApp(app)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 border border-slate-200 transition"
                        title="Inspect Application & Original Email"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteApp(app.id)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 border border-slate-200 transition"
                        title="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
