"use client";
import { useEffect, useMemo, useState, useRef } from "react";
import { useEditor, EditorContent, BubbleMenu } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import axios from "axios";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { Color } from "@tiptap/extension-color";
import TextStyle from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import { Image as TiptapImage } from "@tiptap/extension-image";
import { Youtube } from "@tiptap/extension-youtube";
import { Table } from "@tiptap/extension-table";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableRow } from "@tiptap/extension-table-row";
import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";
import type { EditorProps } from "@/types/editor.types";
import { generateUserColor } from "@/lib/colors";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup } from "@/components/ui/toggle-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code2,
  Link2,
  Image as ImageIcon,
  Table as TableIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Youtube as YoutubeIcon,
  Palette,
  Highlighter,
  FileUp,
  FileDown,
  Info,
  Upload,
} from "lucide-react";
import {
  extractTextFromPDF,
  exportEditorToPDF,
  validatePDFFile,
  extractTextFromWord,
  exportEditorToWord,
  validateWordFile,
} from "@/lib/pdfUtils";
import { toast } from "sonner";
import {
  LinkDialog,
  ImageDialog,
  YouTubeDialog,
} from "@/components/EditorDialogs";

const MenuBar = ({ editor }: { editor: any }) => {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [youtubeDialogOpen, setYoutubeDialogOpen] = useState(false);

  if (!editor) {
    return null;
  }

  const handleLinkSubmit = (url: string) => {
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const handleImageSubmit = (url: string) => {
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const handleYoutubeSubmit = (url: string) => {
    if (url) {
      editor.commands.setYoutubeVideo({
        src: url,
        width: 640,
        height: 480,
      });
    }
  };

  const addTable = () => {
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  };

  const setColor = (color: string) => {
    editor.chain().focus().setColor(color).run();
  };

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-gray-200 bg-white">
      <ToggleGroup type="multiple" className="flex flex-wrap gap-1">
        <Toggle
          size="sm"
          pressed={editor.isActive("bold")}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
          className="data-[state=on]:bg-gray-200"
        >
          <Bold className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("italic")}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          className="data-[state=on]:bg-gray-200"
        >
          <Italic className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("underline")}
          onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
          className="data-[state=on]:bg-gray-200"
        >
          <UnderlineIcon className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("strike")}
          onPressedChange={() => editor.chain().focus().toggleStrike().run()}
          className="data-[state=on]:bg-gray-200"
        >
          <Strikethrough className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("code")}
          onPressedChange={() => editor.chain().focus().toggleCode().run()}
          className="data-[state=on]:bg-gray-200"
        >
          <Code2 className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("highlight")}
          onPressedChange={() => editor.chain().focus().toggleHighlight().run()}
          className="data-[state=on]:bg-gray-200"
        >
          <Highlighter className="h-4 w-4" />
        </Toggle>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <ToggleGroup type="single" className="flex">
          <Toggle
            size="sm"
            pressed={editor.isActive("heading", { level: 1 })}
            onPressedChange={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            className="data-[state=on]:bg-gray-200"
          >
            <Heading1 className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive("heading", { level: 2 })}
            onPressedChange={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            className="data-[state=on]:bg-gray-200"
          >
            <Heading2 className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive("heading", { level: 3 })}
            onPressedChange={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            className="data-[state=on]:bg-gray-200"
          >
            <Heading3 className="h-4 w-4" />
          </Toggle>
        </ToggleGroup>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <ToggleGroup type="single" className="flex">
          <Toggle
            size="sm"
            pressed={editor.isActive("bulletList")}
            onPressedChange={() =>
              editor.chain().focus().toggleBulletList().run()
            }
            className="data-[state=on]:bg-gray-200"
          >
            <List className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive("orderedList")}
            onPressedChange={() =>
              editor.chain().focus().toggleOrderedList().run()
            }
            className="data-[state=on]:bg-gray-200"
          >
            <ListOrdered className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive("blockquote")}
            onPressedChange={() =>
              editor.chain().focus().toggleBlockquote().run()
            }
            className="data-[state=on]:bg-gray-200"
          >
            <Quote className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive("codeBlock")}
            onPressedChange={() =>
              editor.chain().focus().toggleCodeBlock().run()
            }
            className="data-[state=on]:bg-gray-200"
          >
            <Code className="h-4 w-4" />
          </Toggle>
        </ToggleGroup>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <ToggleGroup type="single" className="flex">
          <Toggle
            size="sm"
            pressed={editor.isActive({ textAlign: "left" })}
            onPressedChange={() =>
              editor.chain().focus().setTextAlign("left").run()
            }
            className="data-[state=on]:bg-gray-200"
          >
            <AlignLeft className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive({ textAlign: "center" })}
            onPressedChange={() =>
              editor.chain().focus().setTextAlign("center").run()
            }
            className="data-[state=on]:bg-gray-200"
          >
            <AlignCenter className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive({ textAlign: "right" })}
            onPressedChange={() =>
              editor.chain().focus().setTextAlign("right").run()
            }
            className="data-[state=on]:bg-gray-200"
          >
            <AlignRight className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive({ textAlign: "justify" })}
            onPressedChange={() =>
              editor.chain().focus().setTextAlign("justify").run()
            }
            className="data-[state=on]:bg-gray-200"
          >
            <AlignJustify className="h-4 w-4" />
          </Toggle>
        </ToggleGroup>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8">
              <Palette className="h-4 w-4 mr-1" />
              Color
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2 grid grid-cols-5 gap-1">
            {[
              "#000000",
              "#ef4444",
              "#f97316",
              "#eab308",
              "#22c55e",
              "#3b82f6",
              "#8b5cf6",
              "#ec4899",
            ].map((color) => (
              <button
                key={color}
                className="w-6 h-6 rounded-full border border-gray-700"
                style={{ backgroundColor: color }}
                onClick={() => setColor(color)}
                title={color}
              />
            ))}
          </PopoverContent>
        </Popover>

        <Button
          variant="ghost"
          size="sm"
          className="h-8"
          onClick={() => setLinkDialogOpen(true)}
        >
          <Link2 className="h-4 w-4 mr-1" />
          Link
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-8"
          onClick={() => setImageDialogOpen(true)}
        >
          <ImageIcon className="h-4 w-4 mr-1" />
          Image
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-8"
          onClick={() => setYoutubeDialogOpen(true)}
        >
          <YoutubeIcon className="h-4 w-4 mr-1" />
          YouTube
        </Button>

        <Button variant="ghost" size="sm" className="h-8" onClick={addTable}>
          <TableIcon className="h-4 w-4 mr-1" />
          Table
        </Button>
      </ToggleGroup>

      {/* Dialogs */}
      <LinkDialog
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        onSubmit={handleLinkSubmit}
        initialUrl={editor.getAttributes("link").href}
      />
      <ImageDialog
        open={imageDialogOpen}
        onOpenChange={setImageDialogOpen}
        onSubmit={handleImageSubmit}
      />
      <YouTubeDialog
        open={youtubeDialogOpen}
        onOpenChange={setYoutubeDialogOpen}
        onSubmit={handleYoutubeSubmit}
      />
    </div>
  );
};

const BubbleMenuBar = ({ editor }: { editor: any }) => {
  const [bubbleLinkDialogOpen, setBubbleLinkDialogOpen] = useState(false);

  if (!editor) return null;

  const handleBubbleLinkSubmit = (url: string) => {
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <>
      <BubbleMenu
        editor={editor}
        tippyOptions={{ duration: 100 }}
        className="bg-white border border-gray-300 rounded-md shadow-lg p-1 flex gap-1"
      >
        <Toggle
          size="sm"
          pressed={editor.isActive("bold")}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
          className="data-[state=on]:bg-gray-200"
        >
          <Bold className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("italic")}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          className="data-[state=on]:bg-gray-200"
        >
          <Italic className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("underline")}
          onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
          className="data-[state=on]:bg-gray-200"
        >
          <UnderlineIcon className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("strike")}
          onPressedChange={() => editor.chain().focus().toggleStrike().run()}
          className="data-[state=on]:bg-gray-200"
        >
          <Strikethrough className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("link")}
          onPressedChange={() => setBubbleLinkDialogOpen(true)}
          className="data-[state=on]:bg-gray-200"
        >
          <Link2 className="h-4 w-4" />
        </Toggle>
      </BubbleMenu>

      <LinkDialog
        open={bubbleLinkDialogOpen}
        onOpenChange={setBubbleLinkDialogOpen}
        onSubmit={handleBubbleLinkSubmit}
        initialUrl={editor.getAttributes("link").href}
      />
    </>
  );
};

export default function CollaborativeEditor({ documentId, user }: EditorProps) {
  const [status, setStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("connecting");
  const [userCount, setUserCount] = useState(1);
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);
  const [isProviderReady, setIsProviderReady] = useState(false);
  const [documentTitle, setDocumentTitle] =
    useState<string>("Untitled Document");
  const [isImportingPDF, setIsImportingPDF] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isImportingWord, setIsImportingWord] = useState(false);
  const [isExportingWord, setIsExportingWord] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wordInputRef = useRef<HTMLInputElement>(null);
  const [showPdfBetaDialog, setShowPdfBetaDialog] = useState(false);
  const [pendingPdfFile, setPendingPdfFile] = useState<File | null>(null);
  const [isDraggingPdf, setIsDraggingPdf] = useState(false);

  const ydoc = useMemo(() => new Y.Doc(), []);

  // Fetch document title from backend
  useEffect(() => {
    const fetchDocumentTitle = async () => {
      if (!user?.token) return;

      const tokenParts = user.token.split(":");
      if (tokenParts.length !== 3) return;

      const [docId, pin] = tokenParts;
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

      try {
        const response = await axios.post(`${API_BASE_URL}/docs/join`, {
          docId: parseInt(docId),
          pin: parseInt(pin),
        });
        console.log("got the resposnse as the ", response.data.title);
        if (response.data.title) {
          setDocumentTitle(response.data.title);
        }
      } catch (error) {
        console.error("Failed to fetch document title:", error);
      }
    };

    fetchDocumentTitle();
  }, [user?.token]);

  useEffect(() => {
    if (!user?.token) {
      console.error("No user token available");
      return;
    }

    // Parse credentials from token (format: "docId:pin:name")
    const tokenParts = user.token.split(":");
    if (tokenParts.length !== 3) {
      console.error("Invalid token format");
      return;
    }

    const [docId, pin, name] = tokenParts;
    let wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:1234";

    // Add query parameters to WebSocket URL
    wsUrl = `${wsUrl}?docId=${docId}&pin=${pin}&name=${encodeURIComponent(
      name
    )}`;

    console.log("🔌 Initializing WebSocket connection to:", wsUrl);
    console.log("📋 Credentials:", { docId, pin, name });

    try {
      const newProvider = new HocuspocusProvider({
        url: wsUrl,
        name: documentId, // This is the UUID for the WebSocket room
        document: ydoc,
        onConnect: () => {
          console.log("✅ Connected to Hocuspocus server");
          setIsProviderReady(true);
        },
        onAuthenticationFailed: ({ reason }) => {
          console.error("🔒 Authentication failed:", reason);
          setStatus("disconnected");
        },
        onStatus: ({ status: providerStatus }) => {
          console.log("📡 Provider status:", providerStatus);
          if (providerStatus === "connected") {
            setStatus("connected");
            setIsProviderReady(true);
          } else if (providerStatus === "connecting") {
            setStatus("connecting");
          } else {
            setStatus("disconnected");
          }
        },
      });

      const onSynced = () => {
        console.log("✅ Document synced");
        setStatus("connected");
      };

      const onAwarenessUpdate = ({ states }: { states: any[] }) => {
        setUserCount(states.length);
      };

      newProvider.on("synced", onSynced);
      newProvider.on("awarenessUpdate", onAwarenessUpdate);
      setProvider(newProvider);
      return () => {
        newProvider.off("synced", onSynced);
        newProvider.off("awarenessUpdate", onAwarenessUpdate);
        newProvider.destroy();
        setProvider(null);
        setIsProviderReady(false);
      };
    } catch (error) {
      console.error("❌ Failed to initialize WebSocket provider:", error);
      setStatus("disconnected");
    }
  }, [documentId, ydoc, user?.token]);

  const editor = useEditor(
    {
      extensions:
        provider && isProviderReady
          ? [
              StarterKit.configure({
                history: false,
                codeBlock: {
                  HTMLAttributes: {
                    class:
                      "bg-gray-100 rounded p-4 my-2 font-mono text-sm border border-gray-200",
                  },
                },
                bulletList: {
                  HTMLAttributes: {
                    class: "list-disc pl-5 my-2",
                  },
                },
                orderedList: {
                  HTMLAttributes: {
                    class: "list-decimal pl-5 my-2",
                  },
                },
                blockquote: {
                  HTMLAttributes: {
                    class:
                      "border-l-4 border-gray-300 pl-4 py-1 my-2 text-gray-600",
                  },
                },
              }),
              TextAlign.configure({
                types: ["heading", "paragraph", "image"],
                alignments: ["left", "center", "right", "justify"],
                defaultAlignment: "left",
              }),
              Link.configure({
                openOnClick: true,
                HTMLAttributes: {
                  class: "text-blue-600 hover:text-blue-700 underline",
                },
              }),
              Underline,
              TextStyle,
              Color,
              Highlight.configure({
                multicolor: true,
              }),
              TiptapImage.configure({
                inline: true,
                allowBase64: true,
                HTMLAttributes: {
                  class: "rounded-md my-2 max-w-full h-auto",
                },
              }),
              Youtube.configure({
                inline: false,
                allowFullscreen: true,
                HTMLAttributes: {
                  class: "w-full aspect-video my-4",
                },
              }),
              Table.configure({
                resizable: true,
                HTMLAttributes: {
                  class: "border-collapse w-full my-4",
                },
              }),
              TableRow,
              TableHeader,
              TableCell,
              Collaboration.configure({
                document: ydoc,
              }),
              CollaborationCursor.configure({
                provider: provider,
                user: {
                  name: user?.username || "Anonymous",
                  color: generateUserColor(user?.id || "anonymous"),
                },
              }),
            ]
          : [
              StarterKit.configure({ history: false }),
              Collaboration.configure({
                document: ydoc,
              }),
            ],
      editorProps: {
        attributes: {
          class:
            "prose prose-gray max-w-none min-h-[60vh] focus:outline-none p-4",
        },
      },
    },
    [provider, isProviderReady]
  );
  useEffect(() => {
    return () => {
      editor?.destroy();
      provider?.destroy();
      ydoc?.destroy();
    };
  }, []);

  // PDF Import Handler
  const handleImportPDF = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Show beta warning dialog
    setPendingPdfFile(file);
    setShowPdfBetaDialog(true);
  };

  // Process PDF after confirmation
  const processPdfImport = async (file: File) => {
    try {
      setIsImportingPDF(true);
      toast.info("Importing PDF...");

      // Validate PDF file
      validatePDFFile(file);

      // Extract text from PDF
      const htmlContent = await extractTextFromPDF(file);

      // Insert content into editor
      if (editor) {
        editor.commands.setContent(htmlContent);
        toast.success(
          "PDF imported successfully! (Text only - full support coming soon)"
        );
      }
    } catch (error: any) {
      console.error("PDF import error:", error);
      toast.error(error.message || "Failed to import PDF");
    } finally {
      setIsImportingPDF(false);
      setPendingPdfFile(null);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Handle PDF beta dialog confirm
  const handlePdfBetaConfirm = () => {
    setShowPdfBetaDialog(false);
    if (pendingPdfFile) {
      processPdfImport(pendingPdfFile);
    }
  };

  // Handle PDF beta dialog cancel
  const handlePdfBetaCancel = () => {
    setShowPdfBetaDialog(false);
    setPendingPdfFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Drag and drop handlers for PDF
  const handlePdfDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingPdf(true);
  };

  const handlePdfDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingPdf(false);
  };

  const handlePdfDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingPdf(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === "application/pdf") {
        setPendingPdfFile(file);
        setShowPdfBetaDialog(true);
      } else {
        toast.error("Please drop a PDF file");
      }
    }
  };

  // PDF Export Handler
  const handleExportPDF = async () => {
    if (!editor) return;

    try {
      setIsExportingPDF(true);
      toast.info("Generating PDF document...");

      // Get HTML content from editor
      const html = editor.getHTML();

      // Generate filename from document title
      const filename = `${documentTitle
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase()}.pdf`;

      // Export to PDF
      await exportEditorToPDF(html, filename);

      toast.success("PDF exported successfully!");
    } catch (error: any) {
      console.error("PDF export error:", error);
      toast.error(error.message || "Failed to export PDF");
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Word Import Handler
  const handleImportWord = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImportingWord(true);
      toast.info("Importing Word document...");

      // Validate Word file
      validateWordFile(file);

      // Extract text and HTML from Word
      const htmlContent = await extractTextFromWord(file);

      // Insert content into editor
      if (editor) {
        editor.commands.setContent(htmlContent);
        toast.success("Word document imported successfully!");
      }
    } catch (error: any) {
      console.error("Word import error:", error);
      toast.error(error.message || "Failed to import Word document");
    } finally {
      setIsImportingWord(false);
      // Reset file input
      if (wordInputRef.current) {
        wordInputRef.current.value = "";
      }
    }
  };

  // Word Export Handler
  const handleExportWord = async () => {
    if (!editor) return;

    try {
      setIsExportingWord(true);
      toast.info("Generating Word document...");

      // Get HTML content from editor
      const html = editor.getHTML();

      // Generate filename from document title
      const filename = `${documentTitle
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase()}.docx`;

      // Export to Word
      await exportEditorToWord(html, filename);

      toast.success("Word document exported successfully!");
    } catch (error: any) {
      console.error("Word export error:", error);
      toast.error(error.message || "Failed to export Word document");
    } finally {
      setIsExportingWord(false);
    }
  };

  // Trigger Word file input click
  const triggerWordInput = () => {
    wordInputRef.current?.click();
  };

  const statusColor = {
    connecting: "bg-yellow-400",
    connected: "bg-green-400",
    disconnected: "bg-red-500",
  }[status];
  if (!provider || !isProviderReady || !editor) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">
            {!provider
              ? "Initializing..."
              : "Connecting to collaboration server..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 bg-white min-h-screen p-4">
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90 border border-gray-200 rounded-md px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-gray-900 truncate max-w-md">
            {documentTitle}
          </h1>
          <div className="flex items-center gap-3">
            <div className="relative group flex items-center">
              <span
                className={`h-3 w-3 rounded-full ${statusColor} ${
                  status === "connecting" ? "animate-pulse" : ""
                } cursor-pointer transition-all duration-200`}
              />
              <span
                className="
                  ml-2 mr-2 max-w-0 overflow-hidden
                  whitespace-nowrap
                  text-gray-900 text-xs font-medium
                  
                  group-hover:max-w-xs
                  transition-all duration-300 ease-out
                "
              >
                {status === "connected"
                  ? "✓ You are Connected to WebSocket server"
                  : status === "connecting"
                  ? "⏳ Connecting to WebSocket..."
                  : "✗ Disconnected from WebSocket"}
              </span>
              <span className="text-sm text-gray-600">
                <span className="text-gray-900 font-medium">{userCount}</span>{" "}
                {userCount === 1 ? "user" : "users"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* PDF Import Button with Beta Info */}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleImportPDF}
            className="hidden"
          />
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={triggerFileInput}
              disabled={isImportingPDF || !editor}
              className="gap-2"
            >
              <FileUp className="h-4 w-4" />
              {isImportingPDF ? "Importing..." : "Import PDF"}
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help">
                    <Info className="h-4 w-4 text-blue-500" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    Beta Version - Text-only PDF support
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* PDF Export Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            disabled={isExportingPDF || !editor}
            className="gap-2"
          >
            <FileDown className="h-4 w-4" />
            {isExportingPDF ? "Exporting..." : "Export PDF"}
          </Button>

          {/* Word Import Button */}
          <input
            ref={wordInputRef}
            type="file"
            accept=".docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
            onChange={handleImportWord}
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={triggerWordInput}
            disabled={isImportingWord || !editor}
            className="gap-2"
          >
            <FileUp className="h-4 w-4" />
            {isImportingWord ? "Importing..." : "Import Word"}
          </Button>

          {/* Word Export Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportWord}
            disabled={isExportingWord || !editor}
            className="gap-2"
          >
            <FileDown className="h-4 w-4" />
            {isExportingWord ? "Exporting..." : "Export Word"}
          </Button>

          {/* Connection Status Badge */}
          {/* <span className="text-xs text-gray-600 px-2 py-1 bg-gray-100 rounded border border-gray-200">
            {status === "connected"
              ? "🟢 Connected"
              : status === "connecting"
              ? "🟡 Connecting..."
              : "🔴 Disconnected"}
          </span> */}
        </div>
      </header>

      <div className="sticky top-[4.5rem] z-[5] bg-white border border-gray-200 rounded-md shadow-sm">
        {editor && <MenuBar editor={editor} />}
      </div>

      <div className="border border-gray-200 rounded-md bg-white overflow-hidden shadow-sm">
        {editor && <BubbleMenuBar editor={editor} />}
        <div
          onDragOver={handlePdfDragOver}
          onDragLeave={handlePdfDragLeave}
          onDrop={handlePdfDrop}
          className={`relative ${isDraggingPdf ? "bg-blue-50" : ""}`}
        >
          {isDraggingPdf && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-blue-50 bg-opacity-90 border-2 border-dashed border-blue-400 rounded-md">
              <div className="text-center">
                <Upload className="h-12 w-12 text-blue-500 mx-auto mb-2" />
                <p className="text-lg font-semibold text-blue-700">
                  Drop PDF file here
                </p>
                <p className="text-sm text-blue-600">
                  Beta: Text-only PDF support
                </p>
              </div>
            </div>
          )}
          <EditorContent
            editor={editor}
            className="min-h-[60vh] p-4 focus:outline-none overflow-y-auto"
          />
        </div>
      </div>

      {/* PDF Beta Warning Dialog */}
      <Dialog open={showPdfBetaDialog} onOpenChange={setShowPdfBetaDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-500" />
              PDF Import - Beta Version
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-2">
              <p className="text-sm text-gray-700">
                We are currently in <strong>Beta</strong> for PDF import
                functionality.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-sm text-yellow-800 font-medium mb-1">
                  ⚠️ Current Limitations:
                </p>
                <ul className="text-xs text-yellow-700 list-disc list-inside space-y-1">
                  <li>Only text content will be imported</li>
                  <li>
                    Complex structures (tables, images, graphs) are not
                    supported
                  </li>
                  <li>Formatting may not be preserved perfectly</li>
                </ul>
              </div>
              <p className="text-sm text-gray-600">
                Full PDF support with advanced features is coming soon!
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={handlePdfBetaCancel}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePdfBetaConfirm}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
            >
              Continue to Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        .collaboration-cursor__caret {
          border-left: 2px solid;
          border-color: var(--cursor-color);
          margin-left: -1px;
          margin-right: -1px;
          pointer-events: none;
          position: relative;
          word-break: normal;
        }

        .collaboration-cursor__label {
          border-radius: 4px;
          color: #fff;
          font-size: 12px;
          font-weight: 600;
          left: -1px;
          line-height: normal;
          padding: 2px 6px;
          position: absolute;
          top: -1.8em;
          user-select: none;
          white-space: nowrap;
          background-color: var(--cursor-color);
        }

        /* Editor prose styles for light mode */
        .prose-gray {
          color: #1f2937;
          padding: 1rem;
        }

        .prose-gray h1 {
          font-size: 2.25rem;
          font-weight: 700;
          margin: 1.5rem 0 1rem;
          line-height: 1.2;
          color: #111827;
        }

        .prose-gray h2 {
          font-size: 1.875rem;
          font-weight: 600;
          margin: 1.25rem 0 1rem;
          line-height: 1.3;
          color: #111827;
        }

        .prose-gray h3 {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 1rem 0;
          line-height: 1.4;
          color: #111827;
        }

        .prose-gray p {
          margin: 1rem 0;
          line-height: 1.7;
          color: #374151;
        }

        .prose-gray img {
          border-radius: 0.5rem;
          margin: 1.5rem 0;
        }

        .prose-gray table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5rem 0;
        }

        .prose-gray th,
        .prose-gray td {
          border: 1px solid #d1d5db;
          padding: 0.5rem 1rem;
          text-align: left;
        }

        .prose-gray th {
          background-color: #f3f4f6;
          font-weight: 600;
        }

        .prose-gray tr:nth-child(even) {
          background-color: #f9fafb;
        }

        .ProseMirror:focus {
          outline: none;
        }

        .prose-gray strong {
          color: #111827;
        }
      `}</style>
    </div>
  );
}
