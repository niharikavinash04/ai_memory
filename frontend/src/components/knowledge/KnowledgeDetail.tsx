import React, { useState } from 'react';
import {
  FileText,
  Folder,
  Hash,
  Bot,
  Copy,
  Check,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import type { KnowledgeItem } from '../../api/types';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';

interface KnowledgeDetailProps {
  isOpen: boolean;
  onClose: () => void;
  item: KnowledgeItem | null;
  onApprove?: (id: string) => Promise<void>;
  onReject?: (id: string) => Promise<void>;
}

export const KnowledgeDetail: React.FC<KnowledgeDetailProps> = ({
  isOpen,
  onClose,
  item,
  onApprove,
  onReject,
}) => {
  const [copied, setCopied] = useState(false);
  const [unsupportedNotice, setUnsupportedNotice] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  if (!item) return null;

  const handleCopyHash = () => {
    navigator.clipboard.writeText(item.content_hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUnsupportedAction = (actionName: string, endpointName: string) => {
    setUnsupportedNotice(
      `The backend API does not currently support '${actionName}'. Endpoint '${endpointName}' needs to be implemented.`
    );
  };

  const handleApproveClick = async () => {
    if (!onApprove) return;
    setActionLoading(true);
    try {
      await onApprove(item.id);
      onClose();
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectClick = async () => {
    if (!onReject) return;
    setActionLoading(true);
    try {
      await onReject(item.id);
      onClose();
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item.title}
      subtitle={`Item ID: ${item.id}`}
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {/* Unsupported Notice Alert */}
        {unsupportedNotice && (
          <div className="flex items-start justify-between p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{unsupportedNotice}</span>
            </div>
            <button
              onClick={() => setUnsupportedNotice(null)}
              className="text-amber-400 hover:text-amber-200 ml-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Metadata Header Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
          <div>
            <span className="text-slate-500 block">Status</span>
            <div className="mt-1">
              <Badge type="status" value={item.status} />
            </div>
          </div>
          <div>
            <span className="text-slate-500 block">Project</span>
            <div className="mt-1 font-medium text-slate-200 flex items-center">
              <Folder className="w-3.5 h-3.5 mr-1 text-indigo-400" />
              {item.project_id}
            </div>
          </div>
          <div>
            <span className="text-slate-500 block">Classification</span>
            <div className="mt-1">
              <Badge type="classification" value={item.classification} />
            </div>
          </div>
          <div>
            <span className="text-slate-500 block">Provider</span>
            <div className="mt-1">
              <Badge type="provider" value={item.provider} />
            </div>
          </div>
        </div>

        {/* Prompt Context Section */}
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center">
            <FileText className="w-4 h-4 mr-1.5 text-indigo-400" />
            Prompt Context / Requirement
          </h4>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
            {item.context}
          </div>
        </div>

        {/* Output Section */}
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center">
            <Bot className="w-4 h-4 mr-1.5 text-emerald-400" />
            Generated Output / Solution
          </h4>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
            {item.final_output}
          </div>
        </div>

        {/* Technical Provenance & SHA-256 Hash */}
        <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center">
              <Hash className="w-3.5 h-3.5 mr-1 text-slate-500" />
              Content Hash (SHA-256):
            </span>
            <button
              onClick={handleCopyHash}
              className="inline-flex items-center text-indigo-400 hover:text-indigo-300 font-medium"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1" />
                  Copy Hash
                </>
              )}
            </button>
          </div>
          <code className="block font-mono text-[11px] text-slate-400 break-all bg-slate-900 p-2 rounded border border-slate-800">
            {item.content_hash}
          </code>
          <div className="flex flex-wrap items-center justify-between gap-2 text-slate-500 pt-1 text-[11px]">
            <span>Author: {item.author_email}</span>
            <span>Created: {new Date(item.created_at).toLocaleString()}</span>
            {item.approved_at && (
              <span className="text-emerald-400">
                Approved: {new Date(item.approved_at).toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          {/* Inbox Review Actions if PENDING */}
          {item.status === 'PENDING' && onApprove && onReject ? (
            <div className="flex items-center gap-3">
              <button
                onClick={handleApproveClick}
                disabled={actionLoading}
                className="inline-flex items-center px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Approve Knowledge Item
              </button>
              <button
                onClick={handleRejectClick}
                disabled={actionLoading}
                className="inline-flex items-center px-4 py-2 text-xs font-semibold rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 transition-colors disabled:opacity-50"
              >
                <XCircle className="w-4 h-4 mr-1.5" />
                Reject Item
              </button>
            </div>
          ) : (
            <div className="text-xs text-slate-500 italic">
              Status: {item.status}
            </div>
          )}

          {/* Edit / Delete Placeholder Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleUnsupportedAction('Edit Knowledge', 'PUT /api/v1/knowledge/{id}')}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            >
              <Edit className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
              Edit
            </button>
            <button
              onClick={() => handleUnsupportedAction('Delete Knowledge', 'DELETE /api/v1/knowledge/{id}')}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-rose-950/40 text-rose-300 border border-slate-700 hover:border-rose-800/60 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5 text-rose-400" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
