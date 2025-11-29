import { apiGet } from "./client";

export type LeadContext = {
  leadId: string;
  customerName?: string;
  vehicle?: {
    year?: string;
    make?: string;
    model?: string;
  };
  services?: string[];
  status?: string;
};

export async function fetchLeadContext(leadId: string) {
  return apiGet<LeadContext>(`/api/chat/${encodeURIComponent(leadId)}/context`);
}

export type ChatHistoryItem = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
};

export async function fetchChatHistory(
  leadId: string
): Promise<ChatHistoryItem[]> {
  return apiGet<ChatHistoryItem[]>(
    `/api/chat/${encodeURIComponent(leadId)}/history`
  );
}
