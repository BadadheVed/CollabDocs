"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Clock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api, RecentDoc } from "@/lib/api";
import { getSessionsFromCookie } from "@/lib/sessions";

const SESSIONS_PER_PAGE = 3;

export default function RecentDocs() {
  const router = useRouter();
  const [docs, setDocs] = useState<RecentDoc[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const sessions = getSessionsFromCookie();
      if (sessions.length === 0) {
        setLoading(false);
        return;
      }
      try {
        const recent = await api.getRecentDocs(sessions.map((s) => s.token));
        setDocs(recent);
      } catch {
        // Non-critical — silently fail
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading || docs.length === 0) return null;

  const totalPages = Math.ceil(docs.length / SESSIONS_PER_PAGE);
  const paginated = docs.slice(page * SESSIONS_PER_PAGE, (page + 1) * SESSIONS_PER_PAGE);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="w-full mt-6 mb-8"
    >
      <div className="flex items-center justify-center gap-2 mb-4">
        <Clock className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Recent Documents</h2>
      </div>

      <div className="grid gap-3 md:grid-cols-3 text-left max-w-4xl mx-auto">
        {paginated.map((doc) => (
          <Card
            key={doc.documentId}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push(`/docs/${doc.documentId}`)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium truncate">{doc.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ID: {doc.docId}
                  </p>
                  {doc.participants.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {doc.participants.slice(0, 3).join(", ")}
                      {doc.participants.length > 3 && " +more"}
                    </p>
                  )}
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4 max-w-4xl mx-auto">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="flex items-center text-sm text-muted-foreground px-2">
            {page + 1} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={(page + 1) * SESSIONS_PER_PAGE >= docs.length}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </motion.div>
  );
}
