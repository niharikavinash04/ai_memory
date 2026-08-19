import React, { useState } from 'react';
import {
  Inbox,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  FileText,
  User,
  Calendar,
  Folder,
} from 'lucide-react';
import type { KnowledgeItem } from '../api/types';
import { Badge } from '../components/common/Badge';

interface InboxPageProps {
  items: KnowledgeItem[];
  loading: boolean;
  error: string | null;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  onSelectItem: (item: KnowledgeItem) => void;
}

export const InboxPage: React.FC<InboxPageProps> = ({
  items,
  loading,
  error,
  onApprove,
  onReject,
  onSelectItem,
}) => {
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const handleApprove = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setActionLoadingId(id);
    try {
      await onApprove(id);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setActionLoadingId(id);
    try {
      await onReject(id);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center">
            <Inbox className="w-5 h-5 mr-2 text-amber-400" />
            Knowledge Inbox ({items.length})
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Review candidate knowledge items submitted via MCP or manual publishing
          </p>
        </div>
      </div>

      {/* Content Queue */}
      {loading ? (
        <div className="flex items-center justify-center p-16 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 text-xs">
          <Loader2 className="w-5 h-5 mr-2 animate-spin text-amber-400" />
          Loading candidate inbox items...
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      ) : items.length === 0 ? (
        <div className="p-16 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-slate-400 text-xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">Inbox Clean!</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            There are currently no pending candidate items awaiting review.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const formattedDate = new Date(item.created_at).toLocaleString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={item.id}
                onClick={() => onSelectItem(item)}
                className="group relative rounded-xl bg-slate-900/90 border border-slate-800 p-5 shadow-sm transition-all duration-200 hover:border-amber-500/40 hover:bg-slate-900 cursor-pointer space-y-4"
              >
                {/* Item Top Info */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      <Folder className="w-3 h-3 mr-1" />
                      {item.project_id}
                    </span>
                    <Badge type="classification" value={item.classification} />
                    <Badge type="provider" value={item.provider} />
                  </div>
                  <Badge type="status" value={item.status} />
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                  {item.title}
                </h3>

                {/* Content Grid (Prompt vs Output preview) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-1">
                    <span className="font-semibold text-slate-400 flex items-center">
                      <FileText className="w-3.5 h-3.5 mr-1 text-indigo-400" />
                      Prompt Context
                    </span>
                    <p className="font-mono text-[11px] text-slate-300 line-clamp-3">
                      {item.context}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-1">
                    <span className="font-semibold text-slate-400 flex items-center">
                      <FileText className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                      Candidate Output Snippet
                    </span>
                    <p className="font-mono text-[11px] text-slate-300 line-clamp-3">
                      {item.final_output}
                    </p>
                  </div>
                </div>

                {/* Footer Controls & Review Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/60 text-xs">
                  <div className="flex items-center gap-4 text-slate-500">
                    <span className="flex items-center">
                      <User className="w-3.5 h-3.5 mr-1 text-slate-500" />
                      {item.author_email}
                    </span>
                    <span className="flex items-center">
                      <Calendar className="w-3.5 h-3.5 mr-1 text-slate-500" />
                      Submitted {formattedDate}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleApprove(e, item.id)}
                      disabled={actionLoadingId === item.id}
                      className="inline-flex items-center px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm transition-colors disabled:opacity-50"
                    >
                      {actionLoadingId === item.id ? (
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                      )}
                      Approve
                    </button>
                    <button
                      onClick={(e) => handleReject(e, item.id)}
                      disabled={actionLoadingId === item.id}
                      className="inline-flex items-center px-3.5 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-semibold text-xs transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1.5" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
