"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import axios from "@/axios/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Check, Loader2, Users } from "lucide-react";
import Link from "next/link";

export default function JoinPage() {
  const router = useRouter();
  const [docId, setDocId] = useState("");
  const [pin, setPin] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validated, setValidated] = useState(false);
  const [documentData, setDocumentData] = useState<{
    id: string;
    title: string;
    userCount?: number;
  } | null>(null);

  const validateCredentials = async () => {
    if (!docId.trim() || !pin.trim()) {
      setError("Please fill in all fields");
      return;
    }
    if (docId.length !== 9) {
      setError("Document ID must be 9 digits");
      return;
    }
    if (pin.length !== 4) {
      setError("Pin must be 4 digits");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.post("/docs/join", {
        docId: parseInt(docId),
        pin: parseInt(pin),
      });

      const { id, title } = response.data;

      let userCount = 0;
      try {
        const wsApiUrl =
          process.env.NEXT_PUBLIC_WS_API_URL || "http://localhost:1235";
        const userCountResponse = await fetch(`${wsApiUrl}/room/${id}`);
        if (userCountResponse.ok) {
          const data = await userCountResponse.json();
          userCount = data.userCount;
        }
      } catch {
        // non-critical
      }

      setDocumentData({ id, title, userCount });
      setValidated(true);
      setError("");
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Failed to join document. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  const joinDocument = () => {
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }
    if (!documentData) return;
    router.push(
      `/docs/${documentData.id}?docId=${docId}&pin=${pin}&name=${encodeURIComponent(name)}`
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Join Document</h1>
          <p className="text-muted-foreground mt-1">
            {!validated
              ? "Enter the document ID and PIN to continue"
              : `Joining: ${documentData?.title}`}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {!validated ? "Enter Credentials" : "Almost there!"}
            </CardTitle>
            <CardDescription>
              {!validated
                ? "You'll need the 9-digit document ID and 4-digit PIN"
                : "Enter your name to join the session"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!validated ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Document ID (9 digits)
                  </label>
                  <Input
                    placeholder="123456789"
                    value={docId}
                    onChange={(e) =>
                      setDocId(e.target.value.replace(/\D/g, "").slice(0, 9))
                    }
                    maxLength={9}
                    onKeyDown={(e) => e.key === "Enter" && validateCredentials()}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Pin (4 digits)</label>
                  <Input
                    placeholder="1234"
                    value={pin}
                    onChange={(e) =>
                      setPin(e.target.value.replace(/\D/g, "").slice(0, 4))
                    }
                    maxLength={4}
                    type="password"
                    onKeyDown={(e) => e.key === "Enter" && validateCredentials()}
                  />
                </div>

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

                <Button
                  onClick={validateCredentials}
                  disabled={loading || !docId.trim() || !pin.trim()}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    "Continue"
                  )}
                </Button>
              </>
            ) : (
              <>
                <div className="rounded-lg border bg-muted/50 p-3 space-y-1">
                  <p className="text-sm font-medium flex items-center gap-2 text-green-600">
                    <Check className="h-4 w-4" />
                    Credentials verified
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Document:{" "}
                    <span className="font-medium text-foreground">
                      {documentData?.title}
                    </span>
                  </p>
                  {documentData?.userCount !== undefined && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {documentData.userCount} active{" "}
                      {documentData.userCount === 1 ? "user" : "users"}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Your name</label>
                  <Input
                    placeholder="Enter your name..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && joinDocument()}
                    maxLength={50}
                    autoFocus
                  />
                </div>

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setValidated(false);
                      setName("");
                      setError("");
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={joinDocument}
                    disabled={!name.trim()}
                    className="flex-1"
                  >
                    Join Document
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
