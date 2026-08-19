export type ClassificationType = 'private' | 'internal' | 'project-confidential' | 'restricted';
export type ProviderType = 'claude' | 'codex' | 'manual' | 'imported';
export type KnowledgeStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface PublishInput {
  title: string;
  context: string;
  final_output: string;
  project_id: string;
  classification?: ClassificationType | string;
  provider?: ProviderType | string;
  author_email?: string;
}

export interface PublishWarning {
  type: string;
  message: string;
}

export interface PublishOutput {
  item_id: string;
  status: KnowledgeStatus;
  content_hash: string;
  is_duplicate: boolean;
  warnings: PublishWarning[];
  message: string;
}

export interface KnowledgeItem {
  id: string;
  title: string;
  context: string;
  final_output: string;
  project_id: string;
  classification: string;
  status: KnowledgeStatus;
  provider: string;
  author_email: string;
  content_hash: string;
  warnings?: PublishWarning[] | null;
  created_at: string;
  updated_at: string;
  approved_at?: string | null;
}

export interface SearchResultItem {
  item_id: string;
  title: string;
  snippet: string;
  project_id: string;
  classification: string;
  provider: string;
  author_email: string;
  status: KnowledgeStatus;
  created_at: string;
  approved_at?: string | null;
}

export interface SystemHealthResponse {
  status: string;
  app?: string;
  environment?: string;
  mcp_endpoint?: string;
}
