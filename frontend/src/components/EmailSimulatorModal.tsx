import React, { useState } from 'react';
import { X, Sparkles, Send, CheckCircle2, AlertOctagon } from 'lucide-react';
import { simulateEmailIngestion } from '../api';
import { Application } from '../types';

interface EmailSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (app?: Application) => void;
}

export const EmailSimulatorModal: React.FC<EmailSimulatorModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  if (!isOpen) return null;

  const sampleTemplates = [
    {
      label: '1. Safari Family Booking',
      name: 'Oliver Hudson',
      email: 'oliver.hudson@expeditions.co.uk',
      subject: 'Booking Inquiry for 5 People Serengeti Wildlife Safari',
      body: `Hello Wanderlust Expeditions team,\n\nWe would like to book the Serengeti Wildlife Safari & Ngorongoro Crater for 5 travelers.\nOur travel date is planned for December 10, 2026.\nPlease pick us up from Mount Meru Hotel in Arusha.\n\nMy mother requires a wheelchair accessible vehicle if possible.\n\nContact me at +44 7700 900123.\n\nBest regards,\nOliver Hudson`
    },
    {
      label: '2. Ambiguous Dates & Pax (Needs Review)',
      name: 'Chloe Bennett',
      email: 'chloe.bennett@designstudio.io',
      subject: 'Questions about Bali sunset cruise next month',
      body: `Hi there!\nI am interested in your Bali Sunset Catamaran tour for sometime next month. We might be 2 or 3 people depending on flights.\nWhat is the price per person? Can you pick us up from Seminyak?\n\n- Chloe`
    },
    {
      label: '3. Urgent Swiss Alps Trek',
      name: 'Dominic Sterling',
      email: 'd.sterling@financecapital.ch',
      subject: 'URGENT: Private Helicopter Swiss Alps Tour Dec 15',
      body: `Greetings Touring Manager,\n\nI need to confirm 2 seats on your Swiss Alps Helicopter & Trek for December 15th, 2026.\nWe will be landing at Zurich Airport at 8:00 AM so airport pickup is mandatory.\n\nPhone: +41 44 123 4567.\n\nThanks,\nDominic Sterling`
    },
    {
      label: '4. Non-Tour Spam / Vendor Pitch',
      name: 'SEO Marketing Pro',
      email: 'sales@toprankservices.net',
      subject: 'Boost your touring website ranking on Google page 1!',
      body: `Dear Business Owner,\n\nWe offer top tier SEO optimization and backlink packages for tour operator websites for $199/month. Let us know if you want a free audit.\n\nUnsubscribe here.`
    }
  ];

  const [senderName, setSenderName] = useState(sampleTemplates[0].name);
  const [senderEmail, setSenderEmail] = useState(sampleTemplates[0].email);
  const [subject, setSubject] = useState(sampleTemplates[0].subject);
  const [body, setBody] = useState(sampleTemplates[0].body);

  const [isProcessing, setIsProcessing] = useState(false);
  const [resultMessage, setResultMessage] = useState<{ type: 'success' | 'error' | 'ignored'; text: string; appId?: string } | null>(null);

  const handleSelectTemplate = (template: typeof sampleTemplates[0]) => {
    setSenderName(template.name);
    setSenderEmail(template.email);
    setSubject(template.subject);
    setBody(template.body);
    setResultMessage(null);
  };

  const handleSimulateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setResultMessage(null);

    try {
      const res = await simulateEmailIngestion({
        sender_name: senderName,
        sender_email: senderEmail,
        subject,
        body
      });

      if (res.status === 'created') {
        setResultMessage({
          type: 'success',
          text: `Email ingested & application created: ${res.applicationId}`,
          appId: res.applicationId
        });
        onSuccess(res.application);
      } else if (res.status === 'duplicate') {
        setResultMessage({
          type: 'error',
          text: `Duplicate Protection Triggered! Message ID already exists. Application ${res.applicationId} was preserved.`
        });
      } else if (res.status === 'ignored') {
        setResultMessage({
          type: 'ignored',
          text: `Email ingested, but determined by AI to be non-tour enquiry or spam. Application was NOT created.`
        });
        onSuccess();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setResultMessage({
        type: 'error',
        text: `Ingestion failed: ${msg}`
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white w-full max-w-3xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-900">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-slate-900 text-white shadow-sm">
              <Sparkles className="w-5 h-5 text-slate-200" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Live Email Ingestion Simulator</h2>
              <p className="text-xs text-slate-500">Test real-time AI natural language extraction & duplicate protection</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          
          {/* Presets */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Select Sample Customer Email Preset:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {sampleTemplates.map((t, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectTemplate(t)}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition"
                >
                  <span className="text-xs font-semibold text-slate-900 block">{t.label}</span>
                  <span className="text-[11px] text-slate-500 truncate block">{t.subject}</span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSimulateSubmit} className="space-y-3 pt-2">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Sender Full Name</label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Sender Email Address</label>
                <input
                  type="email"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-900"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Email Subject Line</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-900"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Email Content / Body Text</label>
              <textarea
                rows={6}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-slate-900"
                required
              />
            </div>

            {/* Results Alert Banner */}
            {resultMessage && (
              <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between ${
                resultMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : resultMessage.type === 'ignored'
                  ? 'bg-slate-100 border-slate-200 text-slate-700'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                <div className="flex items-center space-x-2">
                  {resultMessage.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0" />
                  )}
                  <span className="font-semibold">{resultMessage.text}</span>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
              >
                Close
              </button>

              <button
                type="submit"
                disabled={isProcessing}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-[#5E56E7] hover:bg-[#4F46E5] text-white text-xs font-bold shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                <Send className={`w-4 h-4 ${isProcessing ? 'animate-pulse' : ''}`} />
                <span>{isProcessing ? 'AI Processing Email...' : 'Ingest & Process Email'}</span>
              </button>
            </div>

          </form>

        </div>
      </div>
    </div>
  );
};
