"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as Tabs from "@radix-ui/react-tabs";

interface LinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (url: string) => void;
  initialUrl?: string;
}

export function LinkDialog({
  open,
  onOpenChange,
  onSubmit,
  initialUrl = "",
}: LinkDialogProps) {
  const [url, setUrl] = useState(initialUrl);

  const handleSubmit = () => {
    onSubmit(url);
    setUrl("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle>Insert Link</DialogTitle>
          <DialogDescription>
            Enter the URL you want to link to
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Insert Link</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ImageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (url: string) => void;
}

export function ImageDialog({
  open,
  onOpenChange,
  onSubmit,
}: ImageDialogProps) {
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState("url");

  const handleUrlSubmit = () => {
    onSubmit(url);
    setUrl("");
    onOpenChange(false);
  };

  const handleFileSubmit = async () => {
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      onSubmit(reader.result as string);
      setFile(null);
      onOpenChange(false);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type.startsWith("image/")) {
      setFile(selectedFile);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-inherit">
        <DialogHeader>
          <DialogTitle>Insert Image</DialogTitle>
          <DialogDescription>
            Add an image from URL or upload from your device
          </DialogDescription>
        </DialogHeader>

        <Tabs.Root
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <Tabs.List className="grid w-full grid-cols-2 gap-1 rounded-md bg-gray-100 p-1">
            <Tabs.Trigger
              value="url"
              className="rounded-md px-3 py-2 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm text-gray-600 hover:text-gray-900"
            >
              URL
            </Tabs.Trigger>
            <Tabs.Trigger
              value="upload"
              className="rounded-md px-3 py-2 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm text-gray-600 hover:text-gray-900"
            >
              Upload
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="url" className="mt-4">
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="image-url">Image URL</Label>
                <Input
                  id="image-url"
                  placeholder="https://example.com/image.jpg"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleUrlSubmit();
                  }}
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleUrlSubmit} disabled={!url.trim()}>
                Insert Image
              </Button>
            </DialogFooter>
          </Tabs.Content>

          <Tabs.Content value="upload" className="mt-4">
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="image-file">Choose Image</Label>
                <Input
                  id="image-file"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                {file && (
                  <p className="text-sm text-gray-600">
                    Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                  </p>
                )}
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleFileSubmit} disabled={!file}>
                Upload Image
              </Button>
            </DialogFooter>
          </Tabs.Content>
        </Tabs.Root>
      </DialogContent>
    </Dialog>
  );
}

interface YouTubeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (url: string) => void;
}

export function YouTubeDialog({
  open,
  onOpenChange,
  onSubmit,
}: YouTubeDialogProps) {
  const [url, setUrl] = useState("");

  const handleSubmit = () => {
    onSubmit(url);
    setUrl("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-inherit">
        <DialogHeader>
          <DialogTitle>Embed YouTube Video</DialogTitle>
          <DialogDescription>
            Enter the YouTube video URL to embed
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="youtube-url">YouTube URL</Label>
            <Input
              id="youtube-url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
            />
            <p className="text-xs text-gray-500">
              Paste a YouTube video URL or share link
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!url.trim()}>
            Embed Video
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
