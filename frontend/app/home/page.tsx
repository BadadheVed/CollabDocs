"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FileText,
  Users,
  Zap,
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { DocumentCreatedModal } from "@/components/DocumentCreatedModal";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function Home() {
  const [title, setTitle] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createdDoc, setCreatedDoc] = useState<{
    id: string;
    docId: number;
    pin: number;
    joinLink: string;
    title: string;
  } | null>(null);

  // Join document states
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinStep, setJoinStep] = useState<"credentials" | "name">(
    "credentials"
  );
  const [docId, setDocId] = useState("");
  const [pin, setPin] = useState("");
  const [name, setName] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [documentInfo, setDocumentInfo] = useState<{
    id: string;
    title: string;
  } | null>(null);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);

  const router = useRouter();

  // Detect mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setShowJoinForm(true);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a document title");
      return;
    }

    if (!creatorName.trim()) {
      toast.error("Please enter your name");
      return;
    }

    setIsCreating(true);
    try {
      const docTitle = title; // Store title before clearing
      const response = await api.createDocument(title);
      setCreatedDoc({
        id: response.id,
        docId: response.docId,
        pin: response.pin,
        joinLink: response.joinLink,
        title: docTitle,
      });
      setTitle("");
      setCreatorName("");
      toast.success("Document created successfully!");
    } catch (error) {
      toast.error("Failed to create document");
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleValidateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!docId || docId.length !== 9) {
      toast.error("Document ID must be 9 digits");
      return;
    }

    if (!pin || pin.length !== 4) {
      toast.error("PIN must be 4 digits");
      return;
    }

    setIsValidating(true);
    try {
      const response = await api.validateCredentials(
        parseInt(docId),
        parseInt(pin)
      );
      setDocumentInfo({
        id: response.id,
        title: response.title,
      });
      setJoinStep("name");
      toast.success("Credentials validated!");
    } catch (error) {
      toast.error("Invalid credentials");
      console.error(error);
    } finally {
      setIsValidating(false);
    }
  };

  const handleJoinDocument = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    if (documentInfo) {
      router.push(
        `/docs/${
          documentInfo.id
        }?docId=${docId}&pin=${pin}&name=${encodeURIComponent(name)}`
      );
    }
  };

  const resetJoinForm = () => {
    if (!isMobile) {
      setShowJoinForm(false);
    }
    setJoinStep("credentials");
    setDocId("");
    setPin("");
    setName("");
    setShowPin(false);
    setDocumentInfo(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 md:py-20">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mx-auto max-w-4xl text-center mb-16"
        >
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-4 text-4xl md:text-6xl font-bold tracking-tight"
          >
            CollabDocs
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-4 text-lg md:text-xl text-muted-foreground"
          >
            Real-time collaborative document editing, simplified
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-12 text-sm md:text-base text-muted-foreground/80"
          >
            Edit PDF, Word, and more with real-time collaboration — completely
            free
          </motion.p>

          {/* Create & Join Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="grid gap-6 md:gap-8 md:grid-cols-2 mb-16"
          >
            {/* Create Document Card */}
            <Card className="text-left">
              <CardHeader>
                <CardTitle>Create New Document</CardTitle>
                <CardDescription>
                  Start a new collaborative document
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateDocument} className="space-y-4">
                  <Input
                    placeholder="Enter your name..."
                    value={creatorName}
                    onChange={(e) => setCreatorName(e.target.value)}
                    disabled={isCreating}
                  />
                  <Input
                    placeholder="Enter document title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={isCreating}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isCreating}
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Document"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Join Document Card */}
            <Card className="text-left">
              <CardHeader>
                <CardTitle>Join Existing Document</CardTitle>
                <CardDescription>
                  Enter document ID and PIN to collaborate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AnimatePresence mode="wait">
                  {!showJoinForm && !isMobile ? (
                    <motion.div
                      key="join-button"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <Button
                        onClick={() => setShowJoinForm(true)}
                        className="w-full"
                        variant="outline"
                      >
                        Join Document
                      </Button>
                    </motion.div>
                  ) : joinStep === "credentials" ? (
                    <motion.form
                      key="credentials-form"
                      initial={
                        isMobile ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }
                      }
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      onSubmit={handleValidateCredentials}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Document ID
                        </label>
                        <Input
                          placeholder="9-digit ID"
                          value={docId}
                          onChange={(e) => {
                            const value = e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 9);
                            setDocId(value);
                          }}
                          maxLength={9}
                          disabled={isValidating}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">PIN</label>
                        <div className="relative">
                          <Input
                            type={showPin ? "text" : "password"}
                            placeholder="4-digit PIN"
                            value={pin}
                            onChange={(e) => {
                              const value = e.target.value
                                .replace(/\D/g, "")
                                .slice(0, 4);
                              setPin(value);
                            }}
                            maxLength={4}
                            disabled={isValidating}
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowPin(!showPin)}
                          >
                            {showPin ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 w-full">
                        <Button
                          type="submit"
                          className="w-full"
                          disabled={
                            isValidating ||
                            docId.length !== 9 ||
                            pin.length !== 4
                          }
                        >
                          {isValidating ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Validating...
                            </>
                          ) : (
                            "Continue"
                          )}
                        </Button>
                        {!isMobile && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={resetJoinForm}
                            className="w-full"
                          >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Cancel
                          </Button>
                        )}
                      </div>
                    </motion.form>
                  ) : (
                    <motion.form
                      key="name-form"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      onSubmit={handleJoinDocument}
                      className="space-y-4"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900 mb-4"
                      >
                        <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </motion.div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Your Name</label>
                        <Input
                          placeholder="Enter your name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          autoFocus
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setJoinStep("credentials")}
                          className="w-full"
                        >
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Back
                        </Button>
                        <Button
                          type="submit"
                          className="w-full"
                          disabled={!name.trim()}
                        >
                          Join Document
                        </Button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>

          {/* Features Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid gap-8 md:grid-cols-3"
          >
            <div className="space-y-4">
              <FileText className="mx-auto h-12 w-12" />
              <h3 className="text-lg font-medium">Rich Text Editor</h3>
              <p className="text-sm text-muted-foreground">
                Full-featured editing with formatting, tables, and media
              </p>
            </div>
            <div className="space-y-4">
              <Users className="mx-auto h-12 w-12" />
              <h3 className="text-lg font-medium">Real-time Collaboration</h3>
              <p className="text-sm text-muted-foreground">
                See changes instantly as your team edits together
              </p>
            </div>
            <div className="space-y-4">
              <Zap className="mx-auto h-12 w-12" />
              <h3 className="text-lg font-medium">Fast & Secure</h3>
              <p className="text-sm text-muted-foreground">
                PIN-protected documents with instant sync
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {createdDoc && (
        <DocumentCreatedModal
          open={!!createdDoc}
          onOpenChange={(open: boolean) => !open && setCreatedDoc(null)}
          docId={createdDoc.docId}
          pin={createdDoc.pin}
          title={title}
          uuid={createdDoc.id}
        />
      )}
    </div>
  );
}
