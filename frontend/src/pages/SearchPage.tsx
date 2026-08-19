import React, { useState } from 'react';
import { Search, BookOpen, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { api } from '../api/client';
import type { SearchResultItem } from '../api/types';
import { KnowledgeCard } from '../components/knowledge/KnowledgeCard';

interface SearchPageProps {
  onSelectItem: (item: SearchResultItem) => void;
}

export const SearchPage: React.FC<SearchPageProps> = ({ onSelectItem }) => {
  const [query, setQuery] = useState('');
  const [projectId, setProjectId] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const data = await api.searchKnowledge(query.trim(), projectId.trim() || undefined);
      setResults(data);
    } catch (err: any) {
      setError(err.message || 'Failed to search knowledge base');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 space-y-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center">
            <Search className="w-5 h-5 mr-2 text-indigo-400" />
            Knowledge Search Engine
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Search strictly over approved AI knowledge items using PostgreSQL keyword matching
          </p>
        </div>

        {/* Search Input Bar */}
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by keywords (e.g. MCP, FastMCP, Streamable HTTP, PostgreSQL)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-inner"
              required
            />
          </div>

          <input
            type="text"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            placeholder="Project ID (optional)"
            className="w-full sm:w-48 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />

          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition-all duration-150 disabled:opacity-50 shrink-0"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Search Base
              </>
            )}
          </button>
        </form>
      </div>

      {/* Results Header / Summary */}
      {hasSearched && !loading && (
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>
            Found <strong className="text-white">{results.length}</strong> approved result
            {results.length === 1 ? '' : 's'} for &quot;<span className="text-indigo-300">{query}</span>&quot;
          </span>
          {projectId && (
            <span className="bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20">
              Project: {projectId}
            </span>
          )}
        </div>
      )}

      {/* Results View */}
      {loading ? (
        <div className="flex items-center justify-center p-16 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 text-xs">
          <Loader2 className="w-5 h-5 mr-2 animate-spin text-indigo-400" />
          Executing PostgreSQL keyword query...
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      ) : !hasSearched ? (
        <div className="p-12 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-slate-400 text-xs space-y-3">
          <Sparkles className="w-8 h-8 mx-auto text-indigo-400/60" />
          <p className="font-semibold text-slate-300">Enter a query above to search knowledge.</p>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            Search strictly queries APPROVED items. Pending items must first be approved in the Knowledge Inbox.
          </p>
        </div>
      ) : results.length === 0 ? (
        <div className="p-12 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-slate-400 text-xs space-y-3">
          <BookOpen className="w-10 h-10 mx-auto text-slate-600" />
          <p className="font-semibold text-slate-300">No matching approved items found.</p>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            Check your spelling, try broader keywords, or verify whether candidate items are pending in the Inbox.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((item) => (
            <KnowledgeCard
              key={item.item_id}
              item={item}
              onClick={() => onSelectItem(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
