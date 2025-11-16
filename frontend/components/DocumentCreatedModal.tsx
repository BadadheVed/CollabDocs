"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CopyButton } from "./CopyButton";
import { Button } from "./ui/button";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface DocumentCreatedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  docId: number;
  pin: number;
  title: string;
  uuid: string;
}

export function DocumentCreatedModal({
  open,
  onOpenChange,
  docId,
  pin,
  title,
  uuid,
}: DocumentCreatedModalProps) {
  const [showPin, setShowPin] = useState(false);
  const router = useRouter();

  const handleOpenDocument = () => {
    router.push(`/docs/${uuid}?docId=${docId}&pin=${pin}&name=Creator`);
  };

  const handleShare = () => {
    const credentials = `Document ID: ${docId}\nPIN: ${pin}`;
    navigator.clipboard.writeText(credentials);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl">Document Created!</DialogTitle>
          <DialogDescription>
            Share these credentials with collaborators
          </DialogDescription>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 py-4"
        >
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Document Title</p>
            <p className="text-lg font-medium">{title}</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Document ID</p>
            <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
              <p className="text-3xl font-bold tracking-tight">{docId}</p>
              <CopyButton text={docId.toString()} />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">PIN</p>
            <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
              <p className="text-3xl font-bold tracking-tight">
                {showPin ? pin : "••••"}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPin(!showPin)}
                >
                  {showPin ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <CopyButton text={pin.toString()} />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-4">
            <Button onClick={handleOpenDocument} className="w-full">
              Open Document
            </Button>
            <Button variant="outline" onClick={handleShare} className="w-full">
              Share Credentials
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
