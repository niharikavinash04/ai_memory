import type {
  KnowledgeItem,
  PublishInput,
  PublishOutput,
  SearchResultItem,
  SystemHealthResponse,
} from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

class ApiClientError extends Error {
  status: number;
  data?: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.data = data;
  }
}

async function fetchJson<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...options.headers,
  };

  try {
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { detail: response.statusText };
      }
      const errorMessage = typeof errorData.detail === 'string' 
        ? errorData.detail 
        : `API error ${response.status}: ${response.statusText}`;
      throw new ApiClientError(errorMessage, response.status, errorData);
    }
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }
    throw new ApiClientError((error as Error).message || 'Network error connecting to backend', 0);
  }
}

export const api = {
  // System Health
  async getHealth(): Promise<SystemHealthResponse> {
    return fetchJson<SystemHealthResponse>('/health');
  },

  async getRoot(): Promise<SystemHealthResponse> {
    return fetchJson<SystemHealthResponse>('/');
  },

  // Knowledge Ingestion
  async publishKnowledge(data: PublishInput): Promise<PublishOutput> {
    return fetchJson<PublishOutput>('/api/v1/knowledge/publish', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Knowledge Search (strictly APPROVED items)
  async searchKnowledge(query: string, projectId?: string, limit: number = 20): Promise<SearchResultItem[]> {
    const params = new URLSearchParams({ q: query, limit: limit.toString() });
    if (projectId && projectId.trim()) {
      params.append('project_id', projectId.trim());
    }
    return fetchJson<SearchResultItem[]>(`/api/v1/knowledge/search?${params.toString()}`);
  },

  // Dedicated Supabase Memory Query Endpoint (/api/v1/memory/query)
  async queryMemory(query: string, projectId?: string, limit: number = 20): Promise<SearchResultItem[]> {
    return fetchJson<SearchResultItem[]>('/api/v1/memory/query', {
      method: 'POST',
      body: JSON.stringify({
        query,
        project_id: projectId && projectId.trim() ? projectId.trim() : undefined,
        limit,
      }),
    });
  },

  // Inbox & Review Flow
  async getPendingInbox(): Promise<KnowledgeItem[]> {
    return fetchJson<KnowledgeItem[]>('/api/v1/inbox');
  },

  async getInboxDetail(itemId: string): Promise<KnowledgeItem> {
    return fetchJson<KnowledgeItem>(`/api/v1/inbox/${encodeURIComponent(itemId)}`);
  },

  async approveInboxItem(itemId: string): Promise<KnowledgeItem> {
    return fetchJson<KnowledgeItem>(`/api/v1/inbox/${encodeURIComponent(itemId)}/approve`, {
      method: 'POST',
    });
  },

  async rejectInboxItem(itemId: string): Promise<KnowledgeItem> {
    return fetchJson<KnowledgeItem>(`/api/v1/inbox/${encodeURIComponent(itemId)}/reject`, {
      method: 'POST',
    });
  },
};
