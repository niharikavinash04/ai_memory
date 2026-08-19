import React from 'react';
import {
  BookOpen,
  Inbox,
  Cpu,
  PlusCircle,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import type { KnowledgeItem, SearchResultItem } from '../api/types';
import { StatCard } from '../components/common/StatCard';
import { KnowledgeCard } from '../components/knowledge/KnowledgeCard';

interface DashboardPageProps {
  approvedItems: SearchResultItem[];
  pendingItems: KnowledgeItem[];
  loading: boolean;
  error: string | null;
  isBackendHealthy: boolean | null;
  onOpenPublishModal: () => void;
  onNavigateToTab: (tab: 'knowledge' | 'inbox' | 'search' | 'settings') => void;
  onSelectItem: (item: KnowledgeItem | SearchResultItem) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  approvedItems,
  pendingItems,
  loading,
  error,
  isBackendHealthy,
  onOpenPublishModal,
  onNavigateToTab,
  onSelectItem,
}) => {
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900/40 via-slate-900 to-slate-900 border border-indigo-500/20 p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            AI Work Memory Platform
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
            Centralized AI Knowledge & Work History
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
            Capture, review, store, and retrieve work produced across Claude Code, OpenAI Codex, and manual AI sessions over standard Model Context Protocol (MCP).
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenPublishModal}
              className="inline-flex items-center px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all duration-150 active:scale-[0.98]"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Publish New Knowledge
            </button>
            <button
              onClick={() => onNavigateToTab('inbox')}
              className="inline-flex items-center px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors"
            >
              <Inbox className="w-4 h-4 mr-2 text-amber-400" />
              Review Inbox ({pendingItems.length})
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Approved Knowledge"
          value={approvedItems.length}
          icon={BookOpen}
          description="Available in keyword search"
          trend="Searchable"
          iconColor="text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
          onClick={() => onNavigateToTab('knowledge')}
        />
        <StatCard
          title="Inbox Pending Review"
          value={pendingItems.length}
          icon={Inbox}
          description="Awaiting human approval"
          badge={
            pendingItems.length > 0 ? (
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Action Required
              </span>
            ) : null
          }
          iconColor="text-amber-400 bg-amber-500/10 border-amber-500/20"
          onClick={() => onNavigateToTab('inbox')}
        />
        <StatCard
          title="Remote MCP Endpoint"
          value={isBackendHealthy ? 'Active' : 'Offline'}
          icon={Cpu}
          description="Endpoint: /mcp"
          badge={
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                isBackendHealthy
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
              }`}
            >
              Streamable HTTP
            </span>
          }
          iconColor="text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
          onClick={() => onNavigateToTab('settings')}
        />
        <StatCard
          title="Backend Service Health"
          value={isBackendHealthy === true ? 'Healthy' : isBackendHealthy === false ? 'Unreachable' : 'Checking'}
          icon={ShieldCheck}
          description="FastAPI v0.1.0 on port 8000"
          iconColor={
            isBackendHealthy === true
              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
              : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
          }
          onClick={() => onNavigateToTab('settings')}
        />
      </div>

      {/* Inbox Alert Widget if pending items exist */}
      {pendingItems.length > 0 && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300">
              <Inbox className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-200">
                {pendingItems.length} Knowledge Item{pendingItems.length > 1 ? 's' : ''} Pending Review
              </h4>
              <p className="text-[11px] text-amber-300/80">
                Items submitted via MCP or manual publishing must be approved before appearing in search.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateToTab('inbox')}
            className="inline-flex items-center px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition-colors shrink-0"
          >
            Review Now
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </button>
        </div>
      )}

      {/* Main Grid: Recent Approved Knowledge & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Approved Knowledge (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center">
              <BookOpen className="w-4 h-4 mr-2 text-indigo-400" />
              Recent Approved Knowledge
            </h3>
            <button
              onClick={() => onNavigateToTab('knowledge')}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center"
            >
              View All Base
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-12 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 text-xs">
              <Loader2 className="w-5 h-5 mr-2 animate-spin text-indigo-400" />
              Loading recent knowledge...
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          ) : approvedItems.length === 0 ? (
            <div className="p-8 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-slate-400 text-xs space-y-3">
              <BookOpen className="w-8 h-8 mx-auto text-slate-600" />
              <p className="font-medium text-slate-300">No approved knowledge items found in base.</p>
              <p className="text-[11px] text-slate-500">
                Publish a new item or review pending items in the Knowledge Inbox to approve them.
              </p>
              <button
                onClick={onOpenPublishModal}
                className="inline-flex items-center px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold text-xs"
              >
                <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                Publish Item
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {approvedItems.slice(0, 4).map((item) => (
                <KnowledgeCard
                  key={item.item_id}
                  item={item}
                  onClick={() => onSelectItem(item)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Sidebar Widget (1 col) */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center">
            <Sparkles className="w-4 h-4 mr-2 text-indigo-400" />
            Quick Navigation & MCP Details
          </h3>

          <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5 space-y-4 text-xs">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
              <span className="font-semibold text-slate-300 block">Streamable HTTP Transport</span>
              <p className="text-[11px] text-slate-400">
                Connect Claude.ai browser or local CLI agents to:
              </p>
              <code className="block font-mono text-[11px] text-indigo-300 bg-slate-900 p-1.5 rounded border border-slate-800">
                http://127.0.0.1:8000/mcp
              </code>
            </div>

            <div className="space-y-2">
              <span className="font-semibold text-slate-400 text-[11px] uppercase tracking-wider block">
                Available Tools
              </span>
              <ul className="space-y-1.5 text-slate-300 font-mono text-[11px]">
                <li className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
                  <span>hello_world</span>
                  <span className="text-emerald-400 text-[10px]">active</span>
                </li>
                <li className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
                  <span>publish_knowledge</span>
                  <span className="text-emerald-400 text-[10px]">active</span>
                </li>
                <li className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
                  <span>search_knowledge</span>
                  <span className="text-emerald-400 text-[10px]">active</span>
                </li>
                <li className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
                  <span>get_knowledge</span>
                  <span className="text-emerald-400 text-[10px]">active</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
