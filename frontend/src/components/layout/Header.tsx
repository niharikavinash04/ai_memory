import React from 'react';
import { Search, Server, Cpu, RefreshCw } from 'lucide-react';
import type { NavTab } from './Sidebar';

interface HeaderProps {
  activeTab: NavTab;
  onNavigateToSearch: () => void;
  isBackendHealthy: boolean | null;
  onRefreshHealth: () => void;
}

const tabTitles: Record<NavTab, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Dashboard Overview',
    subtitle: 'System metrics, pending review items, and quick ingestion',
  },
  knowledge: {
    title: 'Knowledge Base',
    subtitle: 'Browse and inspect all stored knowledge artifacts',
  },
  inbox: {
    title: 'Knowledge Inbox',
    subtitle: 'Review, candidate items pending human approval',
  },
  search: {
    title: 'Knowledge Search',
    subtitle: 'High-speed keyword search over approved AI outputs',
  },
  settings: {
    title: 'System & Remote MCP',
    subtitle: 'Connection parameters, health checks, and API specifications',
  },
};

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onNavigateToSearch,
  isBackendHealthy,
  onRefreshHealth,
}) => {
  const currentInfo = tabTitles[activeTab];

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Title & Subtitle */}
      <div>
        <h2 className="text-sm font-semibold text-white tracking-tight">{currentInfo.title}</h2>
        <p className="text-[11px] text-slate-400">{currentInfo.subtitle}</p>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Quick Search Shortcut */}
        {activeTab !== 'search' && (
          <button
            onClick={onNavigateToSearch}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors"
          >
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <span>Search knowledge...</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-mono">
              /
            </kbd>
          </button>
        )}

        {/* Live Status Indicators */}
        <div className="flex items-center gap-2">
          {/* Backend API Pill */}
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              isBackendHealthy === true
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : isBackendHealthy === false
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>
              Backend:{' '}
              {isBackendHealthy === true ? 'Online' : isBackendHealthy === false ? 'Offline' : 'Checking...'}
            </span>
          </div>

          {/* Remote MCP Pill */}
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              isBackendHealthy === true
                ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>MCP Endpoint: /mcp</span>
          </div>

          {/* Refresh Health Button */}
          <button
            onClick={onRefreshHealth}
            title="Re-check Backend & MCP Health"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
