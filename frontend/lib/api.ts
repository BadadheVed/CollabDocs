import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

export interface CreateDocResponse {
  message: string;
  id: string;
  docId: number;
  pin: number;
  joinLink: string;
  token: string;
}

export interface JoinDocResponse {
  message: string;
  id: string;
  title: string;
  token: string;
  docId?: number;
}

export interface RecentDoc {
  documentId: string;
  title: string;
  docId: number;
  participants: string[];
}

export const api = {
  createDocument: async (
    title: string,
    name?: string,
  ): Promise<CreateDocResponse> => {
    const response = await axios.post(`${API_BASE_URL}/docs/create`, {
      title,
      name,
    });
    return response.data;
  },

  validateCredentials: async (
    docId: number,
    pin: number,
    name?: string,
  ): Promise<JoinDocResponse> => {
    const response = await axios.post(`${API_BASE_URL}/docs/join`, {
      docId,
      pin,
      name,
    });
    return response.data;
  },

  getRecentDocs: async (tokens: string[]): Promise<RecentDoc[]> => {
    if (tokens.length === 0) return [];
    const response = await axios.post(`${API_BASE_URL}/docs/recents`, {
      tokens,
    });
    return response.data.docs;
  },
};
