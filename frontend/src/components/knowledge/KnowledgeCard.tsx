import React from 'react';
import { Calendar, User, Folder, ArrowRight } from 'lucide-react';
import type { KnowledgeItem, SearchResultItem } from '../../api/types';
import { Badge } from '../common/Badge';

interface KnowledgeCardProps {
  item: KnowledgeItem | SearchResultItem;
  onClick: () => void;
}

export const KnowledgeCard: React.FC<KnowledgeCardProps> = ({ item, onClick }) => {
  const isSearchItem = 'snippet' in item;
  const snippetText = isSearchItem
    ? (item as SearchResultItem).snippet
    : (item as KnowledgeItem).final_output.slice(0, 180) + ((item as KnowledgeItem).final_output.length > 180 ? '...' : '');

  const formattedDate = new Date(item.created_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      onClick={onClick}
      className="group relative flex flex-col justify-between rounded-xl bg-slate-900/90 border border-slate-800 p-5 shadow-sm transition-all duration-200 hover:border-indigo-500/40 hover:bg-slate-900 cursor-pointer"
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Folder className="w-3 h-3 mr-1" />
              {item.project_id}
            </span>
            <Badge type="classification" value={item.classification} />
          </div>
          <Badge type="status" value={item.status} />
        </div>

        {/* Title */}
        <h4 className="text-base font-semibold text-white group-hover:text-indigo-300 transition-colors line-clamp-2">
          {item.title}
        </h4>

        {/* Snippet / Content Preview */}
        <p className="mt-2 text-xs text-slate-400 line-clamp-3 leading-relaxed font-mono bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
          {snippetText}
        </p>
      </div>

      {/* Footer Info */}
      <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center text-slate-400">
            <User className="w-3.5 h-3.5 mr-1 text-slate-500" />
            {item.author_email.split('@')[0]}
          </span>
          <span className="inline-flex items-center text-slate-400">
            <Calendar className="w-3.5 h-3.5 mr-1 text-slate-500" />
            {formattedDate}
          </span>
        </div>
        <span className="inline-flex items-center text-indigo-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          View Detail
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </span>
      </div>
    </div>
  );
};
