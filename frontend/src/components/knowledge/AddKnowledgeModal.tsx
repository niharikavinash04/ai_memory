import React, { useState } from 'react';
import { PlusCircle, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../../api/client';
import type { PublishInput, PublishOutput } from '../../api/types';
import { Modal } from '../common/Modal';

interface AddKnowledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (output: PublishOutput) => void;
}

export const AddKnowledgeModal: React.FC<AddKnowledgeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<PublishInput>({
    title: '',
    project_id: '',
    classification: 'internal',
    provider: 'manual',
    author_email: 'engineer@company.com',
    context: '',
    final_output: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.project_id.trim() || !formData.context.trim() || !formData.final_output.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await api.publishKnowledge(formData);
      onSuccess(result);
      setFormData({
        title: '',
        project_id: '',
        classification: 'internal',
        provider: 'manual',
        author_email: 'engineer@company.com',
        context: '',
        final_output: '',
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to publish knowledge item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Publish Knowledge Item"
      subtitle="Ingest AI work output into the knowledge inbox for review"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium text-slate-300 mb-1.5">
              Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Remote MCP Streamable HTTP Architecture"
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1.5">
              Project Identifier <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              name="project_id"
              value={formData.project_id}
              onChange={handleChange}
              placeholder="e.g. proj-mcp or ai-work-memory"
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block font-medium text-slate-300 mb-1.5">Classification</label>
            <select
              name="classification"
              value={formData.classification}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="internal">internal</option>
              <option value="private">private</option>
              <option value="project-confidential">project-confidential</option>
              <option value="restricted">restricted</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1.5">Source Provider</label>
            <select
              name="provider"
              value={formData.provider}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="manual">manual</option>
              <option value="claude">claude</option>
              <option value="codex">codex</option>
              <option value="imported">imported</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1.5">Author Email</label>
            <input
              type="email"
              name="author_email"
              value={formData.author_email}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block font-medium text-slate-300 mb-1.5">
            Prompt Context / Requirement <span className="text-rose-400">*</span>
          </label>
          <textarea
            name="context"
            rows={3}
            value={formData.context}
            onChange={handleChange}
            placeholder="Explain what prompt, task, or user requirement generated this work..."
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono text-xs"
            required
          />
        </div>

        <div>
          <label className="block font-medium text-slate-300 mb-1.5">
            Generated Output / Artifact Content <span className="text-rose-400">*</span>
          </label>
          <textarea
            name="final_output"
            rows={5}
            value={formData.final_output}
            onChange={handleChange}
            placeholder="Paste the final output text, solution code, or architectural summary..."
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono text-xs"
            required
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-sm transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4 mr-2" />
                Publish Knowledge Item
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
