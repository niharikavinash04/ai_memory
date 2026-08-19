import React, { useState, useEffect, useCallback } from 'react';
import { api } from './api/client';
import type {
  KnowledgeItem,
  SearchResultItem,
  SystemHealthResponse,
  PublishOutput,
} from './api/types';

import { Sidebar } from './components/layout/Sidebar';
import type { NavTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardPage } from './pages/DashboardPage';
import { KnowledgePage } from './pages/KnowledgePage';
import { InboxPage } from './pages/InboxPage';
import { SearchPage } from './pages/SearchPage';
import { SettingsPage } from './pages/SettingsPage';

import { KnowledgeDetail } from './components/knowledge/KnowledgeDetail';
import { AddKnowledgeModal } from './components/knowledge/AddKnowledgeModal';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  // Core Application Data
  const [approvedItems, setApprovedItems] = useState<SearchResultItem[]>([]);
  const [pendingItems, setPendingItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // System & Health State
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean | null>(null);
  const [healthInfo, setHealthInfo] = useState<SystemHealthResponse | null>(null);
  const [rootInfo, setRootInfo] = useState<SystemHealthResponse | null>(null);

  // Modals and Selection State
  const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<KnowledgeItem | SearchResultItem | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Health Check
  const checkHealth = useCallback(async () => {
    try {
      const h = await api.getHealth();
      const r = await api.getRoot();
      setHealthInfo(h);
      setRootInfo(r);
      setIsBackendHealthy(true);
    } catch {
      setIsBackendHealthy(false);
    }
  }, []);

  // Fetch Inbox and Initial Approved Knowledge
  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await checkHealth();
      const inboxData = await api.getPendingInbox();
      setPendingItems(inboxData);

      // Search with common keyword or wildcard query to load initial base
      try {
        const approvedData = await api.searchKnowledge('a');
        setApprovedItems(approvedData);
      } catch {
        setApprovedItems([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to AI Work Memory backend');
    } finally {
      setLoading(false);
    }
  }, [checkHealth]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Handle Approve
  const handleApprove = async (id: string) => {
    try {
      await api.approveInboxItem(id);
      showToast('Knowledge item approved and added to Knowledge Base!');
      await refreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to approve item', 'error');
    }
  };

  // Handle Reject
  const handleReject = async (id: string) => {
    try {
      await api.rejectInboxItem(id);
      showToast('Candidate item rejected', 'success');
      await refreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to reject item', 'error');
    }
  };

  // Handle Publish Success
  const handlePublishSuccess = (result: PublishOutput) => {
    showToast(result.message || 'Knowledge item published to Inbox!');
    refreshData();
  };

  // Handle Custom Search Query
  const handleSearchQuery = async (query: string, projectId?: string) => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const data = await api.searchKnowledge(query, projectId);
      setApprovedItems(data);
    } catch (err: any) {
      showToast(err.message || 'Search failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs shadow-2xl animate-in slide-in-from-bottom-5 duration-200">
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Persistent Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        pendingInboxCount={pendingItems.length}
        onOpenPublishModal={() => setIsPublishModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Header */}
        <Header
          activeTab={activeTab}
          onNavigateToSearch={() => setActiveTab('search')}
          isBackendHealthy={isBackendHealthy}
          onRefreshHealth={checkHealth}
        />

        {/* Page View Container */}
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardPage
              approvedItems={approvedItems}
              pendingItems={pendingItems}
              loading={loading}
              error={error}
              isBackendHealthy={isBackendHealthy}
              onOpenPublishModal={() => setIsPublishModalOpen(true)}
              onNavigateToTab={setActiveTab}
              onSelectItem={(item) => setSelectedItem(item)}
            />
          )}

          {activeTab === 'knowledge' && (
            <KnowledgePage
              items={approvedItems}
              loading={loading}
              error={error}
              onOpenPublishModal={() => setIsPublishModalOpen(true)}
              onSelectItem={(item) => setSelectedItem(item)}
              onSearchQuery={handleSearchQuery}
            />
          )}

          {activeTab === 'inbox' && (
            <InboxPage
              items={pendingItems}
              loading={loading}
              error={error}
              onApprove={handleApprove}
              onReject={handleReject}
              onSelectItem={(item) => setSelectedItem(item)}
            />
          )}

          {activeTab === 'search' && (
            <SearchPage onSelectItem={(item) => setSelectedItem(item)} />
          )}

          {activeTab === 'settings' && (
            <SettingsPage
              health={healthInfo}
              rootInfo={rootInfo}
              isBackendHealthy={isBackendHealthy}
              onRefreshHealth={checkHealth}
            />
          )}
        </main>
      </div>

      {/* Modal: Publish Knowledge Form */}
      <AddKnowledgeModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        onSuccess={handlePublishSuccess}
      />

      {/* Modal: Knowledge Item Detail View */}
      <KnowledgeDetail
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        item={
          selectedItem
            ? 'snippet' in selectedItem
              ? ({
                  id: selectedItem.item_id,
                  title: selectedItem.title,
                  context: 'Loaded from Search Index Result',
                  final_output: (selectedItem as SearchResultItem).snippet,
                  project_id: selectedItem.project_id,
                  classification: selectedItem.classification,
                  status: selectedItem.status,
                  provider: selectedItem.provider,
                  author_email: selectedItem.author_email,
                  content_hash: 'N/A (Search Index Result)',
                  created_at: selectedItem.created_at,
                  updated_at: selectedItem.created_at,
                  approved_at: selectedItem.approved_at,
                } as KnowledgeItem)
              : (selectedItem as KnowledgeItem)
            : null
        }
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
};

export default App;
