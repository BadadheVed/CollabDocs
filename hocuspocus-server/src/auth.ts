import { axiosInstance } from "./axios/axios";

export const validateJoinAccess = async (docId: number, pin: number) => {
  try {
    const response = await axiosInstance.post("/docs/join", {
      docId,
      pin,
    });

    if (response.status !== 200) {
      console.error(`❌ Join validation failed (status: ${response.status})`);
      return null;
    }

    const { id, title, token } = response.data;
    return { id, title, token };
  } catch (error: any) {
    console.error(
      "❌ Backend join validation failed:",
      error.response?.data || error.response?.status || error.message
    );
    console.error(
      "Full error:",
      JSON.stringify(error.toJSON?.() || error, null, 2)
    );
    return null;
  }
};

export const validateToken = async (token: string) => {
  try {
    const response = await axiosInstance.post("/docs/verify-token", {
      token,
    });

    if (response.status !== 200) {
      console.error(`❌ Token validation failed (status: ${response.status})`);
      return null;
    }

    const { id, title, docId } = response.data;
    return { id, title, docId };
  } catch (error: any) {
    console.error(
      "❌ Token validation failed:",
      error.response?.data || error.response?.status || error.message
    );
    return null;
  }
};
