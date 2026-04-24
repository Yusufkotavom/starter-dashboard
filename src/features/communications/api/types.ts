export interface CommunicationClientRef {
  id: number;
  name: string;
  company: string | null;
}

export interface CommunicationConversation {
  id: number;
  phone: string;
  displayName: string | null;
  clientId: number | null;
  clientName: string | null;
  clientCompany: string | null;
  status: string;
  unreadCount: number;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CommunicationFilters {
  page?: number;
  limit?: number;
  search?: string;
  unreadOnly?: boolean;
}

export interface CommunicationsResponse {
  items: CommunicationConversation[];
  total_items: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface CommunicationMessage {
  id: number;
  conversationId: number;
  clientId: number | null;
  channel: string;
  direction: string;
  status: string;
  provider: string | null;
  externalMessageId: string | null;
  body: string;
  attachmentUrl: string | null;
  attachmentName: string | null;
  documentUrl: string | null;
  metadata: unknown;
  sentAt: string | null;
  createdAt: string;
}

export interface CommunicationDetail {
  conversation: CommunicationConversation;
  messages: CommunicationMessage[];
}

export interface AttachClientPayload {
  clientId: number;
}

export interface SendCommunicationMessagePayload {
  body: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  documentUrl?: string | null;
}
