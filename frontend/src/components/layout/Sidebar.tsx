import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Inbox,
  Search,
  PlusCircle,
  BrainCircuit,
  Settings,
  Sparkles,
} from 'lucide-react';

export type NavTab = 'dashboard' | 'knowledge' | 'inbox' | 'search' | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  pendingInboxCount: number;
  onOpenPublishModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  pendingInboxCount,
  onOpenPublishModal,
}) => {
  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'knowledge' as NavTab, label: 'Knowledge Base', icon: BookOpen },
    {
      id: 'inbox' as NavTab,
      label: 'Knowledge Inbox',
      icon: Inbox,
      badge: pendingInboxCount > 0 ? pendingInboxCount : null,
    },
    { id: 'search' as NavTab, label: 'Search', icon: Search },
    { id: 'settings' as NavTab, label: 'System & MCP', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 h-screen sticky top-0">
      <div>
        {/* Logo / Brand Header */}
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-white text-base leading-tight tracking-tight">
              AI Work Memory
            </h1>
            <span className="text-[11px] font-medium text-slate-400 flex items-center mt-0.5">
              <Sparkles className="w-3 h-3 text-indigo-400 mr-1" />
              v0.1.0 Enterprise
            </span>
          </div>
        </div>

        {/* Quick Publish Action */}
        <div className="p-4">
          <button
            onClick={onOpenPublishModal}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all duration-150 active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4" />
            Add Knowledge Item
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-400 font-semibold border border-indigo-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== null && item.badge !== undefined && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
          <div className="font-medium text-slate-300 mb-1 flex items-center justify-between">
            <span>MCP Protocol</span>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">
              v2.0.0
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            Streamable HTTP active over <code className="text-indigo-300">/mcp</code>
          </p>
        </div>
      </div>
    </aside>
  );
};
