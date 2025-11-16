import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

export interface CreateDocResponse {
  message: string;
  id: string; // UUID
  docId: number;
  pin: number;
  joinLink: string;
}

export interface JoinDocResponse {
  message: string;
  id: string; // UUID
  title: string;
}

export const api = {
  createDocument: async (title: string): Promise<CreateDocResponse> => {
    const response = await axios.post(`${API_BASE_URL}/docs/create`, { title });
    return response.data;
  },

  validateCredentials: async (
    docId: number,
    pin: number
  ): Promise<JoinDocResponse> => {
    const response = await axios.post(`${API_BASE_URL}/docs/join`, {
      docId,
      pin,
    });
    return response.data;
  },
};
