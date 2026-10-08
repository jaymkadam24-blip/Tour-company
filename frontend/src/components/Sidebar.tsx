import React from 'react';
import { 
  LayoutDashboard, 
  Inbox, 
  AlertTriangle, 
  Sparkles, 
  FileSpreadsheet, 
  Settings,
  PlusCircle
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  needsReviewCount: number;
  onOpenNewAppModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  needsReviewCount,
  onOpenNewAppModal
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'applications', label: 'All Applications', icon: Inbox },
    { id: 'needs-review', label: 'Needs Review', icon: AlertTriangle, badge: needsReviewCount > 0 ? needsReviewCount : null },
    { id: 'simulator', label: 'Email Simulator', icon: Sparkles },
    { id: 'excel', label: 'Excel Exports', icon: FileSpreadsheet },
    { id: 'settings', label: 'AI & System Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#F4F5F7] border-r border-slate-200 flex flex-col justify-between p-4 shrink-0 hidden md:flex">
      <div className="space-y-6">
        {/* Quick Action Button */}
        <button
          onClick={onOpenNewAppModal}
          className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-[#5E56E7] hover:bg-[#4F46E5] text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 text-purple-200" />
          <span>New Application / Paste Email</span>
        </button>

        {/* Main Menu */}
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">Main Menu</p>
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    isActive
                      ? 'bg-white text-[#5E56E7] font-bold shadow-xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#5E56E7]' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== null && item.badge !== undefined && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F5F4FF] text-[#5E56E7] border border-[#DDD9FE]">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* System Status info box */}
      <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 text-xs shadow-xs">
        <div className="flex items-center space-x-2 mb-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
          <span className="font-bold text-slate-800 text-[11px]">AI Ingestion Engine Active</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Emails automatically analyzed, validated, and saved with duplicate prevention.
        </p>
      </div>
    </aside>
  );
};
