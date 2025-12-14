"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import CollaborativeEditor from "@/components/CollaborativeEditor";
import type { User } from "@/types/editor.types";
import axios from "axios";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

// Polyfill for crypto.randomUUID in case it's not available
function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback UUID v4 generation
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function DocPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const idParam = params?.id as string | undefined;
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeDocument = async () => {
      try {
        // Check if token exists in localStorage
        const storedToken = localStorage.getItem(`doc_token_${idParam}`);

        if (storedToken) {
          // Verify token with backend
          try {
            const response = await axios.post(
              `${BACKEND_URL}/docs/verify-token`,
              {
                token: storedToken,
              }
            );

            if (response.data.id === idParam) {
              // Token is valid, create user with token
              const userCredentials: User = {
                id: generateUUID(),
                username: "User",
                email: "",
                token: storedToken,
              };

              setUser(userCredentials);
              setLoading(false);
              return;
            }
          } catch (tokenError) {
            console.log("Stored token invalid, requiring credentials");
            localStorage.removeItem(`doc_token_${idParam}`);
          }
        }

        // No valid token, require credentials from URL
        const docId = searchParams.get("docId");
        const pin = searchParams.get("pin");
        const name = searchParams.get("name");

        if (!docId || !pin || !name) {
          router.replace("/join");
          return;
        }

        // Validate credentials and get token from backend
        const response = await axios.post(`${BACKEND_URL}/docs/join`, {
          docId: Number(docId),
          pin: Number(pin),
        });

        if (response.data.token && response.data.id === idParam) {
          // Store token for future access
          localStorage.setItem(`doc_token_${idParam}`, response.data.token);

          const userCredentials: User = {
            id: generateUUID(),
            username: name,
            email: "",
            token: response.data.token,
          };

          setUser(userCredentials);
          setLoading(false);
        } else {
          setError("Invalid document access");
          setTimeout(() => router.replace("/join"), 2000);
        }
      } catch (err: any) {
        console.error("Error initializing document:", err);
        setError(err.response?.data?.message || "Failed to access document");
        setTimeout(() => router.replace("/join"), 2000);
      }
    };

    if (idParam) {
      initializeDocument();
    }
  }, [router, searchParams, idParam]);

  if (!idParam) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center text-gray-600">
        <span className="animate-spin h-10 w-10 border-4 border-gray-300 border-t-transparent rounded-full mb-4" />
        <p>Loading document...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center text-gray-600">
        <p className="text-red-500 mb-4">{error}</p>
        <p>Redirecting...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-white">
      <CollaborativeEditor documentId={idParam} user={user} />
    </div>
  );
}
