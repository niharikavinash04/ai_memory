import React, { useState } from 'react';
import { BookOpen, Search, Filter, PlusCircle, Loader2, AlertCircle } from 'lucide-react';
import type { KnowledgeItem, SearchResultItem } from '../api/types';
import { KnowledgeCard } from '../components/knowledge/KnowledgeCard';

interface KnowledgePageProps {
  items: (KnowledgeItem | SearchResultItem)[];
  loading: boolean;
  error: string | null;
  onOpenPublishModal: () => void;
  onSelectItem: (item: KnowledgeItem | SearchResultItem) => void;
  onSearchQuery: (query: string, projectId?: string) => void;
}

export const KnowledgePage: React.FC<KnowledgePageProps> = ({
  items,
  loading,
  error,
  onOpenPublishModal,
  onSelectItem,
  onSearchQuery,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedClassification, setSelectedClassification] = useState<string>('all');

  // Extract unique project IDs
  const projectIds = Array.from(new Set(items.map((i) => i.project_id)));

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchQuery(searchTerm, selectedProject === 'all' ? undefined : selectedProject);
  };

  const filteredItems = items.filter((item) => {
    if (selectedProject !== 'all' && item.project_id !== selectedProject) return false;
    if (selectedClassification !== 'all' && item.classification !== selectedClassification) return false;
    if (searchTerm.trim() && !('snippet' in item)) {
      const term = searchTerm.toLowerCase();
      return (
        item.title.toLowerCase().includes(term) ||
        (item as KnowledgeItem).context.toLowerCase().includes(term) ||
        (item as KnowledgeItem).final_output.toLowerCase().includes(term)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center">
            <BookOpen className="w-5 h-5 mr-2 text-indigo-400" />
            Knowledge Base
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Browse, filter, and inspect approved knowledge items across all projects
          </p>
        </div>
        <button
          onClick={onOpenPublishModal}
          className="inline-flex items-center px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition-all duration-150 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Publish Knowledge Item
        </button>
      </div>

      {/* Filter & Search Bar */}
      <form
        onSubmit={handleSearchSubmit}
        className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row gap-3 items-center"
      >
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter knowledge items by title, context, or code content..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Project:</span>
          </div>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Projects</option>
            {projectIds.map((pid) => (
              <option key={pid} value={pid}>
                {pid}
              </option>
            ))}
          </select>

          <select
            value={selectedClassification}
            onChange={(e) => setSelectedClassification(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Classifications</option>
            <option value="internal">internal</option>
            <option value="private">private</option>
            <option value="project-confidential">project-confidential</option>
            <option value="restricted">restricted</option>
          </select>
        </div>
      </form>

      {/* Grid of Knowledge Cards */}
      {loading ? (
        <div className="flex items-center justify-center p-16 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 text-xs">
          <Loader2 className="w-5 h-5 mr-2 animate-spin text-indigo-400" />
          Fetching knowledge base...
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-slate-400 text-xs space-y-3">
          <BookOpen className="w-10 h-10 mx-auto text-slate-600" />
          <p className="font-semibold text-slate-300">No matching knowledge items found.</p>
          <p className="text-[11px] text-slate-500 max-w-md mx-auto">
            Try adjusting your search query or filters, or publish a new knowledge item into the inbox.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const id = 'item_id' in item ? (item as SearchResultItem).item_id : (item as KnowledgeItem).id;
            return (
              <KnowledgeCard
                key={id}
                item={item}
                onClick={() => onSelectItem(item)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
