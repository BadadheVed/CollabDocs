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

    const { id, title } = response.data;
    return { id, title };
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
