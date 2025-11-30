"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import CollaborativeEditor from "@/components/CollaborativeEditor";
import type { User } from "@/types/editor.types";

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

  useEffect(() => {
    // Get credentials from URL params
    const docId = searchParams.get("docId");
    const pin = searchParams.get("pin");
    const name = searchParams.get("name");

    if (!docId || !pin || !name) {
      router.replace("/join");
      return;
    }

    // Create a user object with the provided credentials
    const userCredentials: User = {
      id: generateUUID(),
      username: name,
      email: "", // Not required for this flow
      token: `${docId}:${pin}:${name}`, // Encode credentials in token format
    };

    setUser(userCredentials);
    setLoading(false);
  }, [router, searchParams]);

  if (!idParam) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center text-gray-600">
        <span className="animate-spin h-10 w-10 border-4 border-gray-300 border-t-transparent rounded-full mb-4" />
        <p>Loading document...</p>
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
