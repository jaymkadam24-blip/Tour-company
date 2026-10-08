import React from 'react';
import { Inbox, AlertTriangle, CheckCircle2, PhoneCall, Users } from 'lucide-react';
import { ApplicationStats, Application } from '../types';

interface StatsCardsProps {
  stats: ApplicationStats | null;
  applications: Application[];
  onSelectFilter: (status: string) => void;
  activeFilter: string;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  stats,
  applications,
  onSelectFilter,
  activeFilter
}) => {
  const total = stats?.total || applications.length || 0;
  const newCount = stats?.new_count || 0;
  const needsReview = stats?.needs_review_count || 0;
  const confirmed = stats?.confirmed_count || 0;
  const contacted = stats?.contacted_count || 0;

  const totalTravelers = applications.reduce((sum, app) => sum + (app.number_of_travelers || 0), 0);

  const cards = [
    {
      id: 'All',
      title: 'Total Applications',
      value: total,
      subtext: `${newCount} new today`,
      icon: Inbox,
      color: 'text-[#5E56E7]',
      bg: 'bg-[#F5F4FF] border-[#DDD9FE]'
    },
    {
      id: 'Needs Review',
      title: 'Needs Review',
      value: needsReview,
      subtext: 'Requires human correction',
      icon: AlertTriangle,
      color: 'text-amber-600',
      bg: 'bg-amber-50 border-amber-200'
    },
    {
      id: 'Contacted',
      title: 'Contacted / In Progress',
      value: contacted,
      subtext: 'Awaiting customer response',
      icon: PhoneCall,
      color: 'text-blue-600',
      bg: 'bg-blue-50 border-blue-200'
    },
    {
      id: 'Confirmed',
      title: 'Confirmed Bookings',
      value: confirmed,
      subtext: 'Ready for tour execution',
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 border-emerald-200'
    },
    {
      id: 'travelers',
      title: 'Total Travelers',
      value: totalTravelers,
      subtext: 'Extracted passenger count',
      icon: Users,
      color: 'text-[#5E56E7]',
      bg: 'bg-[#F5F4FF] border-[#DDD9FE]'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {cards.map((card) => {
        const Icon = card.icon;
        const isSelected = activeFilter === card.id;

        return (
          <button
            key={card.id}
            onClick={() => card.id !== 'travelers' && onSelectFilter(card.id)}
            className={`bg-white p-4 rounded-2xl border border-slate-200 shadow-xs transition text-left cursor-pointer hover:border-[#5E56E7]/50 ${
              isSelected ? 'ring-2 ring-[#5E56E7] border-[#5E56E7] bg-[#F5F4FF]/40 shadow-sm' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-600">{card.title}</span>
              <div className={`p-2 rounded-xl ${card.bg} border`}>
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight mb-1">
              {card.value}
            </div>
            <div className="text-[11px] text-slate-500 font-medium truncate">
              {card.subtext}
            </div>
          </button>
        );
      })}
    </div>
  );
};
