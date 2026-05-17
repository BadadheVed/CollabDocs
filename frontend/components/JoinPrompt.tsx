"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, Loader2, Users } from "lucide-react";

interface JoinPromptProps {
  title: string;
  userCount: number;
  defaultName?: string;
  onJoin: (name: string) => Promise<void>;
}

export default function JoinPrompt({
  title,
  userCount,
  defaultName = "",
  onJoin,
}: JoinPromptProps) {
  const [name, setName] = useState(defaultName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async () => {
    if (loading) return;

    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onJoin(name.trim());
    } catch {
      setError("Failed to join. Please try again.");
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-3xl font-bold tracking-tight">Join Document</h1>
          <p className="text-muted-foreground mt-1">Joining: {title}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Almost there!</CardTitle>
            <CardDescription>
              Enter your name to join the session
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-muted/50 p-3 space-y-1">
              <p className="text-sm font-medium flex items-center gap-2 text-green-600">
                <Check className="h-4 w-4" />
                Credentials verified
              </p>
              <p className="text-sm text-muted-foreground">
                Document:{" "}
                <span className="font-medium text-foreground">{title}</span>
              </p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {userCount} active {userCount === 1 ? "user" : "users"}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Your name</label>
              <Input
                placeholder="Enter your name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleJoin();
                  }
                }}
                maxLength={50}
                autoFocus
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              onClick={handleJoin}
              disabled={!name.trim() || loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Joining...
                </>
              ) : (
                "Join Document"
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
