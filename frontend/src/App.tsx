import React, { useState, useEffect, useCallback } from 'react';
import { Application, ApplicationStats, ApplicationStatus, User } from './types';
import { 
  fetchApplications, 
  updateApplication, 
  deleteApplication, 
  reExtractApplication, 
  triggerEmailSync, 
  fetchEmailSyncStatus, 
  createApplication,
  verifyAuth
} from './api';

import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { StatsCards } from './components/StatsCards';
import { ApplicationTable } from './components/ApplicationTable';
import { ApplicationDetailModal } from './components/ApplicationDetailModal';
import { EmailSimulatorModal } from './components/EmailSimulatorModal';
import { ExcelExportModal } from './components/ExcelExportModal';
import { SettingsView } from './components/SettingsView';
import { LoginModal } from './components/LoginModal';

import { PlusCircle, X, Send } from 'lucide-react';

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<ApplicationStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isNewAppModalOpen, setIsNewAppModalOpen] = useState(false);

  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailEmail, setGmailEmail] = useState('');

  // Manual Email Paste state
  const [manualSubject, setManualSubject] = useState('');
  const [manualBody, setManualBody] = useState('');
  const [manualSenderEmail, setManualSenderEmail] = useState('');
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  // Check auth on load
  useEffect(() => {
    verifyAuth().then((userData) => {
      setUser(userData);
      setIsAuthChecking(false);
    });
  }, []);

  // Fetch applications list
  const loadApplications = useCallback(async () => {
    setIsLoading(true);
    try {
      const statusParam = activeTab === 'needs-review' ? 'Needs Review' : selectedStatus;
      const res = await fetchApplications({
        status: statusParam,
        search: searchQuery,
        startDate,
        endDate
      });
      setApplications(res.applications);
      setStats(res.stats);
    } catch (err) {
      console.error('Error fetching applications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedStatus, searchQuery, startDate, endDate, activeTab]);

  useEffect(() => {
    if (user) {
      loadApplications();
    }
  }, [user, loadApplications]);

  // Fetch email status
  useEffect(() => {
    if (user) {
      fetchEmailSyncStatus().then((status) => {
        setGmailConnected(status.gmail_connected);
        setGmailEmail(status.gmail_email);
      }).catch(console.error);
    }
  }, [user]);

  const handleSyncInbox = async () => {
    try {
      const result = await triggerEmailSync();
      await loadApplications();
      alert(`Email Sync Complete!\n• ${result.processedCount} new application(s) created\n• ${result.duplicatesCount} duplicate email(s) skipped`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Sync failed: ${msg}`);
    }
  };

  const handleUpdateStatus = async (id: number | string, newStatus: ApplicationStatus) => {
    try {
      const updated = await updateApplication(id, { application_status: newStatus });
      setApplications(prev => prev.map(a => a.id === updated.id ? updated : a));
      if (selectedApp && selectedApp.id === updated.id) {
        setSelectedApp(updated);
      }
      loadApplications();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Failed to update status: ${msg}`);
    }
  };

  const handleDeleteApp = async (id: number | string) => {
    if (!window.confirm('Are you sure you want to delete this touring application?')) return;
    try {
      await deleteApplication(id);
      setApplications(prev => prev.filter(a => a.id !== id && a.application_id !== id));
      if (selectedApp && (selectedApp.id === id || selectedApp.application_id === id)) {
        setSelectedApp(null);
      }
      loadApplications();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Failed to delete application: ${msg}`);
    }
  };

  const handleSaveAppDetail = async (updates: Partial<Application>) => {
    if (!selectedApp) return;
    const updated = await updateApplication(selectedApp.id, updates);
    setSelectedApp(updated);
    setApplications(prev => prev.map(a => a.id === updated.id ? updated : a));
    loadApplications();
  };

  const handleReExtractAppDetail = async (id: number | string) => {
    const updated = await reExtractApplication(id);
    setSelectedApp(updated);
    setApplications(prev => prev.map(a => a.id === updated.id ? updated : a));
    loadApplications();
  };

  const handleManualCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingManual(true);
    try {
      const newApp = await createApplication({
        original_email_subject: manualSubject || 'Manual Booking Inquiry',
        raw_email_text: manualBody,
        customer_email: manualSenderEmail || 'customer@example.com'
      });
      setIsNewAppModalOpen(false);
      setManualSubject('');
      setManualBody('');
      setManualSenderEmail('');
      loadApplications();
      setSelectedApp(newApp);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Failed to parse manual email: ${msg}`);
    } finally {
      setIsSubmittingManual(false);
    }
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-600">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs">Initializing Touring Application Management System...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginModal onLoginSuccess={(u) => setUser(u)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        user={user}
        onLogout={() => {
          localStorage.removeItem('tour_admin_token');
          setUser(null);
        }}
        onSyncInbox={handleSyncInbox}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
        onOpenExportModal={() => setIsExportOpen(true)}
        gmailConnected={gmailConnected}
        gmailEmail={gmailEmail}
      />

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            if (tab === 'simulator') setIsSimulatorOpen(true);
            if (tab === 'excel') setIsExportOpen(true);
          }}
          needsReviewCount={stats?.needs_review_count || 0}
          onOpenNewAppModal={() => setIsNewAppModalOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          
          {activeTab === 'settings' ? (
            <SettingsView />
          ) : (
            <>
              {/* Stats Bar */}
              <StatsCards
                stats={stats}
                applications={applications}
                onSelectFilter={(status) => {
                  setSelectedStatus(status);
                  setActiveTab('dashboard');
                }}
                activeFilter={selectedStatus}
              />

              {/* Applications Table */}
              <ApplicationTable
                applications={applications}
                selectedStatus={activeTab === 'needs-review' ? 'Needs Review' : selectedStatus}
                onSelectStatus={(status) => {
                  if (activeTab === 'needs-review' && status !== 'Needs Review') {
                    setActiveTab('applications');
                  }
                  setSelectedStatus(status);
                }}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                startDate={startDate}
                onStartDateChange={setStartDate}
                endDate={endDate}
                onEndDateChange={setEndDate}
                onSelectApp={(app) => setSelectedApp(app)}
                onUpdateStatus={handleUpdateStatus}
                onDeleteApp={handleDeleteApp}
                onOpenSimulator={() => setIsSimulatorOpen(true)}
                isLoading={isLoading}
              />
            </>
          )}

        </main>
      </div>

      {/* Application Detail & Email Inspector Modal */}
      {selectedApp && (
        <ApplicationDetailModal
          app={selectedApp}
          onClose={() => setSelectedApp(null)}
          onSave={handleSaveAppDetail}
          onReExtract={handleReExtractAppDetail}
        />
      )}

      {/* Email Simulator Modal */}
      <EmailSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onSuccess={(newApp) => {
          loadApplications();
          if (newApp) setSelectedApp(newApp);
        }}
      />

      {/* Excel Export Modal */}
      <ExcelExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        activeStatusFilter={selectedStatus}
        activeSearchQuery={searchQuery}
      />

      {/* Manual Email Paste Modal */}
      {isNewAppModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 p-6 shadow-2xl space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-slate-900" />
                Paste Raw Customer Email for AI Extraction
              </h2>
              <button onClick={() => setIsNewAppModalOpen(false)} className="text-slate-400 hover:text-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Customer Email Address</label>
                <input
                  type="email"
                  value={manualSenderEmail}
                  onChange={(e) => setManualSenderEmail(e.target.value)}
                  placeholder="customer@example.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Email Subject Line</label>
                <input
                  type="text"
                  value={manualSubject}
                  onChange={(e) => setManualSubject(e.target.value)}
                  placeholder="Booking Inquiry for Serengeti Safari..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Raw Email Body Text</label>
                <textarea
                  rows={6}
                  value={manualBody}
                  onChange={(e) => setManualBody(e.target.value)}
                  placeholder="Paste the raw body text of any customer enquiry here..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-slate-900"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsNewAppModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingManual}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#5E56E7] hover:bg-[#4F46E5] text-white font-bold text-xs shadow-xs transition cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmittingManual ? 'Extracting with AI...' : 'Parse & Create Application'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
