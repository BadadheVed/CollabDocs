"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import CollaborativeEditor from "@/components/CollaborativeEditor";
import JoinPrompt from "@/components/JoinPrompt";
import type { User } from "@/types/editor.types";
import axios from "axios";
import {
  getTokenFromCookie,
  addSessionToCookie,
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
        const storedToken = idParam ? await getTokenFromCookie(idParam) : null;

        if (storedToken) {
          try {
            const response = await axios.post(
              `${BACKEND_URL}/docs/verify-token`,
              { token: storedToken },
            );

            if (response.data.id === idParam) {
              setUser({
                id: generateUUID(),
                username: "User",
                email: "",
                token: storedToken,
              });
              setPageState("ready");
              return;
            }
          } catch {
            // Stored token invalid — fall through to URL params
          }
        }

        // 2. No valid stored session — check URL params
        const docId = searchParams.get("docId");
        const pin = searchParams.get("pin");

        if (!docId || !pin) {
          router.replace("/join");
          return;
        }

        // Pre-fetch document info (title + user count) to show in the join prompt
        let title = "Document";
        let userCount = 0;

        try {
          const joinRes = await axios.post(`${BACKEND_URL}/docs/join`, {
            docId: Number(docId),
            pin: Number(pin),
          });
          title = joinRes.data.title ?? title;

          // Fetch active user count from WS API (non-critical)
          try {
            const wsApiUrl =
              process.env.NEXT_PUBLIC_WS_API_URL || "http://localhost:1235";
            const countRes = await fetch(`${wsApiUrl}/room/${joinRes.data.id}`);
            if (countRes.ok) {
              const data = await countRes.json();
              userCount = data.userCount ?? 0;
            }
          } catch {}
        } catch (err: any) {
          setError(
            err.response?.data?.message || "Invalid document credentials",
          );
          setPageState("error");
          setTimeout(() => router.replace("/join"), 2000);
          return;
        }

        setJoinDocInfo({ title, userCount });
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

    const response = await axios.post(`${BACKEND_URL}/docs/join`, {
      docId: Number(docId),
      pin: Number(pin),
      name,
    });

    if (response.data.token && response.data.id === idParam) {
      // addSessionToCookie is a no-op — backend already set the HttpOnly cookie.
      // We call it here only to satisfy any callers that expect it.
      addSessionToCookie({
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
