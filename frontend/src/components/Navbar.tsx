import React, { useState } from 'react';
import { RefreshCw, FileSpreadsheet, LogOut, User as UserIcon, Sparkles } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  onSyncInbox: () => Promise<void>;
  onOpenSimulator: () => void;
  onOpenExportModal: () => void;
  gmailConnected: boolean;
  gmailEmail?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onLogout,
  onSyncInbox,
  onOpenSimulator,
  onOpenExportModal,
  gmailConnected,
  gmailEmail
}) => {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncClick = async () => {
    setIsSyncing(true);
    try {
      await onSyncInbox();
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shadow-xs">
      {/* Brand & System Status */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-[#5E56E7] flex items-center justify-center font-black text-white text-xs shadow-xs">
            <span className="tracking-tighter">SMV</span>
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-900 flex items-center gap-2">
              Stamp<span className="text-[#5E56E7] font-black">MyVisa</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#F5F4FF] text-[#5E56E7] border border-[#DDD9FE]">
                Tour Operations
              </span>
            </h1>
            <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-medium">
              <span className={`w-2 h-2 rounded-full ${gmailConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
              <span>{gmailConnected ? `Connected: ${gmailEmail || 'Gmail'}` : 'Gmail Simulator Mode'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex items-center space-x-3">
        <button
          onClick={handleSyncClick}
          disabled={isSyncing}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 transition shadow-xs disabled:opacity-50 cursor-pointer"
          title="Poll Gmail Inbox for new incoming emails"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Syncing...' : 'Check Email'}</span>
        </button>

        <button
          onClick={onOpenSimulator}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#5E56E7] hover:bg-[#4F46E5] text-white text-xs font-bold shadow-xs transition cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-200" />
          <span>Test Email Simulator</span>
        </button>

        <button
          onClick={onOpenExportModal}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold border border-slate-200 transition shadow-xs cursor-pointer"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-[#5E56E7]" />
          <span>Export Excel</span>
        </button>

        <div className="h-6 w-px bg-slate-200 mx-1"></div>

        {/* User Profile */}
        {user ? (
          <div className="flex items-center space-x-3 pl-2">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 font-bold text-xs">
                {user.name.charAt(0)}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-slate-900 leading-none">{user.name}</p>
                <p className="text-[10px] text-slate-500 leading-tight">{user.role}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <UserIcon className="w-4 h-4" />
            <span>Admin Logged Out</span>
          </div>
        )}
      </div>
    </header>
  );
};
