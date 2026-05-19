import axios from "@/axios/axios";

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

export const api = {
  createDocument: async (
    title: string,
    name?: string,
  ): Promise<CreateDocResponse> => {
    const response = await axios.post("/docs/create", {
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
    const response = await axios.post("/docs/join", {
      docId,
      pin,
      name,
    });
    return response.data;
  },
};
