"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import CollaborativeEditor from "@/components/CollaborativeEditor";
import JoinPrompt from "@/components/JoinPrompt";
import type { User } from "@/types/editor.types";
import axios from "axios";
import {
  getSessionToken,
  trackSessionFromJoin,
} from "@/lib/sessions";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

type PageState = "loading" | "join-prompt" | "ready" | "error";

export default function DocPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const idParam = params?.id as string | undefined;

  const [pageState, setPageState] = useState<PageState>("loading");
  const [joinDocInfo, setJoinDocInfo] = useState<{
    title: string;
    userCount: number;
  } | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeDocument = async () => {
      try {
        // 1. Check for stored HttpOnly session token via backend API
        const storedToken = idParam ? await getSessionToken(idParam) : null;

        if (storedToken) {
          // getSessionToken already verified Redis access — no extra verify needed
          setUser({
            id: generateUUID(),
            username: "User",
            email: "",
            token: storedToken,
          });
          setPageState("ready");
          return;
        }

        // 2. No valid stored session — check URL params
        const docId = searchParams.get("docId");
        const pin = searchParams.get("pin");

        if (!docId || !pin) {
          router.replace("/join");
          return;
        }

        // Do not preflight the mutating join endpoint here.
        // The actual /docs/join request should only happen after the user confirms.
        // Until then, show the join prompt with non-mutating placeholder metadata.
        setJoinDocInfo({ title: "Document", userCount: 0 });
        setPageState("join-prompt");
      } catch (err: any) {
        console.error("Error initializing document:", err);
        setError(err.response?.data?.message || "Failed to access document");
        setPageState("error");
        setTimeout(() => router.replace("/join"), 2000);
      }
    };

    if (idParam) {
      initializeDocument();
    }
  }, [router, searchParams, idParam]);

  const handleJoinConfirm = async (name: string) => {
    const docId = searchParams.get("docId");
    const pin = searchParams.get("pin");

    const response = await axios.post(
      `${BACKEND_URL}/docs/join`,
      {
        docId: Number(docId),
        pin: Number(pin),
        name,
      },
      { withCredentials: true }
    );

    if (response.data.token && response.data.id === idParam) {
      // trackSessionFromJoin is a no-op — backend already set the HttpOnly cookie.
      trackSessionFromJoin({
        documentId: idParam!,
        token: response.data.token,
        title: response.data.title,
        docId: Number(docId),
      });

      setUser({
        id: generateUUID(),
        username: name,
        email: "",
        token: response.data.token,
      });

      // Remove credentials from URL so they don't sit in browser history
      router.replace(`/docs/${idParam}`);
      setPageState("ready");
    } else {
      throw new Error("Invalid document access");
    }
  };

  if (!idParam) return null;

  if (pageState === "loading") {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center text-gray-600">
        <span className="animate-spin h-10 w-10 border-4 border-gray-300 border-t-transparent rounded-full mb-4" />
        <p>Loading document...</p>
      </div>
    );
  }

  if (pageState === "join-prompt" && joinDocInfo) {
    return (
      <JoinPrompt
        title={joinDocInfo.title}
        userCount={joinDocInfo.userCount}
        defaultName={searchParams.get("name") ?? ""}
        onJoin={handleJoinConfirm}
      />
    );
  }

  if (pageState === "error") {
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
