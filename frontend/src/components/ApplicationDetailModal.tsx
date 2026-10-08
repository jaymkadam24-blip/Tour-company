import React, { useState, useEffect } from 'react';
import { Application, ApplicationStatus } from '../types';
import { 
  X, 
  Mail, 
  Sparkles, 
  ExternalLink, 
  Save, 
  RotateCw, 
  CheckCircle2, 
  User, 
  Phone, 
  Calendar, 
  Users, 
  MapPin, 
  FileText,
  ShieldCheck
} from 'lucide-react';

interface ApplicationDetailModalProps {
  app: Application | null;
  onClose: () => void;
  onSave: (updated: Partial<Application>) => Promise<void>;
  onReExtract: (id: number | string) => Promise<void>;
}

export const ApplicationDetailModal: React.FC<ApplicationDetailModalProps> = ({
  app,
  onClose,
  onSave,
  onReExtract
}) => {
  if (!app) return null;

  const [formData, setFormData] = useState({
    customer_name: app.customer_name || '',
    customer_email: app.customer_email || '',
    customer_phone: app.customer_phone || '',
    tour_package: app.tour_package || '',
    travel_date: app.travel_date || '',
    number_of_travelers: app.number_of_travelers ? String(app.number_of_travelers) : '',
    pickup_location: app.pickup_location || '',
    additional_requirements: app.additional_requirements || '',
    application_status: app.application_status,
    extraction_notes: app.extraction_notes || ''
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isReExtracting, setIsReExtracting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setFormData({
      customer_name: app.customer_name || '',
      customer_email: app.customer_email || '',
      customer_phone: app.customer_phone || '',
      tour_package: app.tour_package || '',
      travel_date: app.travel_date || '',
      number_of_travelers: app.number_of_travelers ? String(app.number_of_travelers) : '',
      pickup_location: app.pickup_location || '',
      additional_requirements: app.additional_requirements || '',
      application_status: app.application_status,
      extraction_notes: app.extraction_notes || ''
    });
  }, [app]);

  const handleChange = (field: string, val: string) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await onSave({
        ...formData,
        number_of_travelers: formData.number_of_travelers ? parseInt(formData.number_of_travelers, 10) : undefined
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReExtractClick = async () => {
    setIsReExtracting(true);
    try {
      await onReExtract(app.id);
    } finally {
      setIsReExtracting(false);
    }
  };

  const statuses: ApplicationStatus[] = ['New', 'Contacted', 'Confirmed', 'Completed', 'Cancelled', 'Needs Review'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white w-full max-w-6xl max-h-[92vh] rounded-3xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden text-slate-900">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="px-3 py-1 rounded-xl bg-[#5E56E7] font-mono font-bold text-white text-sm">
              {app.application_id}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                {app.customer_name}
                <span className="text-xs font-medium text-slate-500">({app.customer_email})</span>
              </h2>
              <div className="text-[11px] text-slate-500 flex items-center gap-2">
                <span>Received: {new Date(app.email_received_at).toLocaleString()}</span>
                <span>•</span>
                <span>Message ID: {app.email_message_id}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleReExtractClick}
              disabled={isReExtracting}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition"
              title="Re-run AI parser on original email"
            >
              <RotateCw className={`w-3.5 h-3.5 text-slate-700 ${isReExtracting ? 'animate-spin' : ''}`} />
              <span>{isReExtracting ? 'Re-parsing...' : 'Re-Run AI'}</span>
            </button>

            {app.original_email_reference && (
              <a
                href={app.original_email_reference}
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Email</span>
              </a>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body - 2 Columns */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          
          {/* LEFT COLUMN: Original Email Viewer */}
          <div className="lg:col-span-5 p-6 space-y-4 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-700" />
                Original Customer Email
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-600">
                Immutable Source
              </span>
            </div>

            {/* Email Header Card */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 text-xs shadow-xs">
              <div className="flex justify-between text-slate-700">
                <span className="text-slate-500 font-medium">Subject:</span>
                <span className="font-semibold text-slate-900 text-right max-w-[260px] truncate">
                  {app.original_email_subject}
                </span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span className="text-slate-500 font-medium">From:</span>
                <span className="font-mono text-slate-900 font-bold truncate max-w-[260px]">
                  {app.original_email_sender}
                </span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span className="text-slate-500 font-medium">Message ID:</span>
                <span className="font-mono text-[10px] text-slate-400 truncate max-w-[220px]">
                  {app.email_message_id}
                </span>
              </div>
            </div>

            {/* Email Raw Body Display */}
            <div>
              <p className="text-[11px] font-semibold text-slate-500 mb-2">Email Body Text:</p>
              <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed max-h-[360px] overflow-y-auto shadow-xs">
                {app.original_email_body}
              </div>
            </div>

            {/* AI Confidence & Uncertain Notice */}
            <div className={`p-4 rounded-2xl border text-xs ${
              app.extraction_confidence >= 0.75 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  AI Confidence Score: {Math.round(app.extraction_confidence * 100)}%
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-slate-200">
                  {app.extraction_confidence >= 0.75 ? 'HIGH CONFIDENCE' : 'NEEDS HUMAN REVIEW'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed mt-1">
                {app.extraction_notes || 'Extracted automatically from customer email body.'}
              </p>
              {app.uncertain_fields && app.uncertain_fields.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-amber-200 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold text-amber-800 uppercase">Flagged Fields:</span>
                  {app.uncertain_fields.map((uf) => (
                    <span key={uf} className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                      {uf}
                    </span>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* RIGHT COLUMN: Extracted Structured Fields Form */}
          <div className="lg:col-span-7 p-6 bg-white flex flex-col justify-between">
            <form onSubmit={handleSaveSubmit} className="space-y-4">
              
              {/* Status transition bar */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Application Status Transition:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {statuses.map((st) => {
                    const isSelected = formData.application_status === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleChange('application_status', st)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#5E56E7] text-white border-[#5E56E7] shadow-xs'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:text-[#5E56E7] hover:bg-[#F5F4FF]'
                        }`}
                      >
                        {st}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* Full Name */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    Customer Name
                  </label>
                  <input
                    type="text"
                    value={formData.customer_name}
                    onChange={(e) => handleChange('customer_name', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#5E56E7]"
                    required
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.customer_email}
                    onChange={(e) => handleChange('customer_email', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#5E56E7]"
                    required
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={formData.customer_phone}
                    onChange={(e) => handleChange('customer_phone', e.target.value)}
                    placeholder="e.g. +1 555-234-5678"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#5E56E7]"
                  />
                </div>

                {/* Tour Package */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-slate-500" />
                    Tour Package / Destination
                  </label>
                  <input
                    type="text"
                    value={formData.tour_package}
                    onChange={(e) => handleChange('tour_package', e.target.value)}
                    placeholder="e.g. Serengeti Safari 5 Days"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#5E56E7]"
                  />
                </div>

                {/* Travel Date */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    Travel Date
                  </label>
                  <input
                    type="text"
                    value={formData.travel_date}
                    onChange={(e) => handleChange('travel_date', e.target.value)}
                    placeholder="e.g. 2026-11-15 or November 2026"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#5E56E7]"
                  />
                </div>

                {/* Travelers Count */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    Number of Travelers
                  </label>
                  <input
                    type="number"
                    value={formData.number_of_travelers}
                    onChange={(e) => handleChange('number_of_travelers', e.target.value)}
                    placeholder="e.g. 4"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#5E56E7]"
                  />
                </div>
              </div>

              {/* Pickup Location */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  Pickup Location / Hotel
                </label>
                <input
                  type="text"
                  value={formData.pickup_location}
                  onChange={(e) => handleChange('pickup_location', e.target.value)}
                  placeholder="e.g. Kilimanjaro Airport or Hotel Name"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#5E56E7]"
                />
              </div>

              {/* Special Requirements */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  Additional / Special Requirements
                </label>
                <textarea
                  rows={3}
                  value={formData.additional_requirements}
                  onChange={(e) => handleChange('additional_requirements', e.target.value)}
                  placeholder="Dietary preferences, accessibility, guide requirements..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#5E56E7]"
                />
              </div>

              {/* Extraction Notes */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Admin / AI Notes:
                </label>
                <input
                  type="text"
                  value={formData.extraction_notes}
                  onChange={(e) => handleChange('extraction_notes', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none"
                />
              </div>

              {/* Modal Footer / Save Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <div>
                  {saveSuccess && (
                    <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5 animate-bounce">
                      <CheckCircle2 className="w-4 h-4" />
                      Application updated successfully!
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-[#5E56E7] hover:bg-[#4F46E5] text-white text-xs font-bold shadow-xs transition disabled:opacity-50 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? 'Saving Changes...' : 'Save Application'}</span>
                  </button>
                </div>
              </div>

            </form>
          </div>

        </div>
      </div>
    </div>
  );
};
