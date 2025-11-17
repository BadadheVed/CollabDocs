/**
 * Example usage of PDF utilities
 * This file demonstrates how to use the PDF import/export functions
 */

import React from "react";
import {
  extractTextFromPDF,
  exportEditorToPDF,
  validatePDFFile,
} from "@/lib/pdfUtils";

// Example 1: Import PDF in a React component
export function PDFImportExample() {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Validate the file
      validatePDFFile(file);

      // Extract text
      const htmlContent = await extractTextFromPDF(file);

      // Use the content (e.g., set in state, insert into editor)
      console.log("Extracted HTML:", htmlContent);

      // If you have a Tiptap editor instance:
      // editor.commands.setContent(htmlContent);
    } catch (error: any) {
      console.error("Import failed:", error.message);
    }
  };

  return (
    <input type="file" accept="application/pdf" onChange={handleFileChange} />
  );
}

// Example 2: Export HTML to PDF
export function PDFExportExample() {
  const handleExport = async () => {
    // Get HTML content from your editor or component
    const htmlContent = `
      <h1>My Document</h1>
      <p>This is a sample document with some content.</p>
      <ul>
        <li>Item 1</li>
        <li>Item 2</li>
      </ul>
    `;

    try {
      await exportEditorToPDF(htmlContent, "my-document.pdf");
      console.log("PDF exported successfully!");
    } catch (error: any) {
      console.error("Export failed:", error.message);
    }
  };

  return <button onClick={handleExport}>Export to PDF</button>;
}

// Example 3: Complete flow with state management
export function CompletePDFExample() {
  const [content, setContent] = React.useState<string>("");
  const [isLoading, setIsLoading] = React.useState(false);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      validatePDFFile(file);
      const html = await extractTextFromPDF(file);
      setContent(html);
      alert("PDF imported successfully!");
    } catch (error: any) {
      alert(`Import failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    if (!content) {
      alert("No content to export");
      return;
    }

    setIsLoading(true);
    try {
      await exportEditorToPDF(content, "document.pdf");
      alert("PDF exported successfully!");
    } catch (error: any) {
      alert(`Export failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div>
        <input
          type="file"
          accept="application/pdf"
          onChange={handleImport}
          disabled={isLoading}
        />
      </div>

      <div dangerouslySetInnerHTML={{ __html: content }} />

      <button onClick={handleExport} disabled={isLoading || !content}>
        {isLoading ? "Processing..." : "Export PDF"}
      </button>
    </div>
  );
}
