/**
 * Document Utilities - Client-side only
 *
 * This module provides utilities for importing and exporting PDF and Word files.
 * All functions use dynamic imports to avoid SSR issues in Next.js.
 *
 * @module documentUtils
 */

/**
 * Extract editable text content from PDF with formatting preserved
 * Converts PDF to fully editable HTML while preserving structure and special characters
 * @param file PDF file to extract text from
 * @returns Promise<string> HTML string with formatted, editable text
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  // Only run on client side
  if (typeof window === "undefined") {
    throw new Error("PDF extraction can only run in the browser");
  }

  try {
    // Dynamic import to avoid SSR issues
    const pdfjsLib = await import("pdfjs-dist");

    // Configure PDF.js worker - version 3.x uses .js extension
    const workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

    console.log("PDF.js version:", pdfjsLib.version);
    console.log("Loading PDF file:", file.name, "Size:", file.size);

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
    });

    const pdf = await loadingTask.promise;
    console.log("PDF loaded successfully. Pages:", pdf.numPages);

    let fullHtml = "";

    // Extract text from each page with enhanced formatting
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      console.log(`Processing page ${pageNum}/${pdf.numPages}`);
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const viewport = page.getViewport({ scale: 1.0 });

      interface TextItem {
        str: string;
        transform: number[];
        width: number;
        height: number;
        fontName?: string;
        hasEOL?: boolean;
      }

      // Group items by vertical position (Y coordinate) with tolerance
      const lineGroups: Map<number, TextItem[]> = new Map();
      const tolerance = 3; // Pixels tolerance for grouping into same line

      textContent.items.forEach((item: any) => {
        const textItem = item as TextItem;
        if (!textItem.str) return;

        const y = Math.round(textItem.transform[5]);

        // Find existing line within tolerance
        let foundLine = false;
        for (const [existingY, items] of lineGroups.entries()) {
          if (Math.abs(existingY - y) <= tolerance) {
            items.push(textItem);
            foundLine = true;
            break;
          }
        }

        if (!foundLine) {
          lineGroups.set(y, [textItem]);
        }
      });

      // Sort lines from top to bottom (descending Y)
      const sortedLines = Array.from(lineGroups.entries()).sort(
        ([y1], [y2]) => y2 - y1
      );

      let previousY = -1;
      let previousFontSize = 12;

      sortedLines.forEach(([y, items]) => {
        // Sort items left to right within the line
        items.sort((a, b) => a.transform[4] - b.transform[4]);

        let lineHtml = "";
        let maxFontSize = 0;
        let isBold = false;

        items.forEach((item, idx) => {
          const text = item.str;
          const fontSize = Math.round(item.transform[0]);
          const x = item.transform[4];

          maxFontSize = Math.max(maxFontSize, fontSize);

          // Check for bold based on font name
          if (
            item.fontName &&
            (item.fontName.includes("Bold") || item.fontName.includes("BOLD"))
          ) {
            isBold = true;
          }

          // Add spacing between words
          if (idx > 0) {
            const prevItem = items[idx - 1];
            const prevX = prevItem.transform[4] + prevItem.width;
            const gap = x - prevX;
            const avgCharWidth = prevItem.width / prevItem.str.length;

            // Add space if gap is significant
            if (gap > avgCharWidth * 0.5) {
              lineHtml += " ";
            }
          }

          lineHtml += text;
        });

        if (!lineHtml.trim()) return;

        // Detect paragraph breaks based on vertical spacing
        const verticalGap = previousY !== -1 ? previousY - y : 0;
        const shouldBreakParagraph = verticalGap > maxFontSize * 1.8;

        if (shouldBreakParagraph && fullHtml) {
          fullHtml += "<br/><br/>\n";
        } else if (previousY !== -1 && verticalGap > maxFontSize * 0.5) {
          fullHtml += "<br/>\n";
        }

        // Apply formatting based on font size and style
        const trimmedLine = lineHtml.trim();

        if (maxFontSize > 18) {
          fullHtml += `<h1 style="font-size: ${maxFontSize}px; margin: 0.5em 0; line-height: 1.2;">${trimmedLine}</h1>\n`;
        } else if (maxFontSize > 15) {
          fullHtml += `<h2 style="font-size: ${maxFontSize}px; margin: 0.4em 0; line-height: 1.3;">${trimmedLine}</h2>\n`;
        } else if (maxFontSize > 13) {
          fullHtml += `<h3 style="font-size: ${maxFontSize}px; margin: 0.3em 0; line-height: 1.4;">${trimmedLine}</h3>\n`;
        } else if (isBold) {
          fullHtml += `<p style="margin: 0.2em 0;"><strong>${trimmedLine}</strong></p>\n`;
        } else {
          fullHtml += `<p style="margin: 0.2em 0;">${trimmedLine}</p>\n`;
        }

        previousY = y;
        previousFontSize = maxFontSize;
      });

      // Add page separator if not the last page
      if (pageNum < pdf.numPages) {
        fullHtml += `<hr style="margin: 2em 0; border: none; border-top: 1px solid #e5e7eb;" />\n`;
        fullHtml += `<p style="text-align: center; color: #9ca3af; font-size: 0.875rem; margin: 1em 0;">— Page ${pageNum} —</p>\n`;
        fullHtml += `<hr style="margin: 2em 0; border: none; border-top: 1px solid #e5e7eb;" />\n`;
      }
    }

    console.log("Text extraction complete. Length:", fullHtml.length);
    return fullHtml || "<p>No content could be extracted from this PDF.</p>";
  } catch (error: any) {
    console.error("Error extracting content from PDF:", error);
    console.error("Error details:", {
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
    });
    throw new Error(
      `Failed to extract content from PDF: ${error?.message || "Unknown error"}`
    );
  }
}

/**
 * Export editor HTML content to PDF
 * @param html HTML content from editor
 * @param filename Name for the downloaded PDF file
 */
export async function exportEditorToPDF(
  html: string,
  filename: string = "document.pdf"
): Promise<void> {
  // Only run on client side
  if (typeof window === "undefined") {
    throw new Error("PDF export can only run in the browser");
  }

  try {
    // Dynamic import to avoid SSR issues
    const html2pdf = (await import("html2pdf.js")).default;

    // Create a temporary container for the HTML content
    const container = document.createElement("div");
    container.innerHTML = html;

    // Apply styles for better PDF rendering
    container.style.fontFamily = "Arial, sans-serif";
    container.style.fontSize = "12pt";
    container.style.lineHeight = "1.6";
    container.style.color = "#000";
    container.style.padding = "20px";
    container.style.maxWidth = "210mm"; // A4 width
    container.style.margin = "0 auto";
    container.style.backgroundColor = "#fff";

    // Configure html2pdf options
    const options = {
      margin: [15, 15, 15, 15] as [number, number, number, number], // top, right, bottom, left in mm
      filename: filename,
      image: { type: "jpeg" as const, quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        logging: false,
      },
      jsPDF: {
        unit: "mm" as const,
        format: "a4" as const,
        orientation: "portrait" as const,
      },
      pagebreak: {
        mode: ["avoid-all", "css", "legacy"] as const,
        before: ".page-break-before",
        after: ".page-break-after",
      },
    };

    // Generate and download PDF
    await html2pdf().set(options).from(container).save();
  } catch (error) {
    console.error("Error exporting to PDF:", error);
    throw new Error("Failed to export PDF. Please try again.");
  }
}

/**
 * Handle PDF file import - validates and processes the file
 * @param file File to validate
 * @returns boolean indicating if file is valid
 */
export function validatePDFFile(file: File): boolean {
  // Check file type
  if (file.type !== "application/pdf") {
    throw new Error("Please select a valid PDF file.");
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error("PDF file is too large. Maximum size is 10MB.");
  }

  return true;
}

/**
 * Extract editable text content from Word document with formatting preserved
 * @param file Word document file (.docx) to extract text from
 * @returns Promise<string> HTML string with formatted, editable text
 */
export async function extractTextFromWord(file: File): Promise<string> {
  // Only run on client side
  if (typeof window === "undefined") {
    throw new Error("Word extraction can only run in the browser");
  }

  try {
    // Dynamic import to avoid SSR issues
    const mammoth = await import("mammoth");

    console.log("Loading Word file:", file.name, "Size:", file.size);

    const arrayBuffer = await file.arrayBuffer();

    // Convert Word document to HTML
    const result = await mammoth.convertToHtml(
      { arrayBuffer },
      {
        styleMap: [
          "p[style-name='Heading 1'] => h1:fresh",
          "p[style-name='Heading 2'] => h2:fresh",
          "p[style-name='Heading 3'] => h3:fresh",
          "p[style-name='Heading 4'] => h4:fresh",
          "p[style-name='Title'] => h1:fresh",
          "p[style-name='Subtitle'] => h2:fresh",
          "r[style-name='Strong'] => strong:fresh",
          "r[style-name='Emphasis'] => em:fresh",
        ],
        convertImage: mammoth.images.imgElement((image) => {
          return image.read("base64").then((imageBuffer) => {
            return {
              src: `data:${image.contentType};base64,${imageBuffer}`,
            };
          });
        }),
      }
    );

    console.log("Word extraction complete. Messages:", result.messages);

    if (result.messages.length > 0) {
      result.messages.forEach((msg) => {
        if (msg.type === "warning") {
          console.warn("Mammoth warning:", msg.message);
        }
      });
    }

    return (
      result.value ||
      "<p>No content could be extracted from this Word document.</p>"
    );
  } catch (error: any) {
    console.error("Error extracting content from Word:", error);
    throw new Error(
      `Failed to extract content from Word document: ${
        error?.message || "Unknown error"
      }`
    );
  }
}

/**
 * Export editor HTML content to Word document (.docx)
 * @param html HTML content from editor
 * @param filename Name for the downloaded Word file
 */
export async function exportEditorToWord(
  html: string,
  filename: string = "document.docx"
): Promise<void> {
  // Only run on client side
  if (typeof window === "undefined") {
    throw new Error("Word export can only run in the browser");
  }

  try {
    // Dynamic imports to avoid SSR issues
    const {
      Document,
      Packer,
      Paragraph,
      TextRun,
      HeadingLevel,
      AlignmentType,
    } = await import("docx");

    // Import file-saver correctly
    const FileSaver = await import("file-saver");
    const saveAs = FileSaver.default?.saveAs || FileSaver.saveAs;

    console.log("Converting HTML to Word format...");

    // Parse HTML and convert to docx structure
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;

    const children: any[] = [];

    // Process each element in the HTML
    Array.from(tempDiv.children).forEach((element) => {
      const tagName = element.tagName.toLowerCase();
      const text = element.textContent || "";

      if (!text.trim()) return;

      // Handle different HTML elements
      if (tagName === "h1") {
        children.push(
          new Paragraph({
            text: text,
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 240, after: 120 },
          })
        );
      } else if (tagName === "h2") {
        children.push(
          new Paragraph({
            text: text,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          })
        );
      } else if (tagName === "h3") {
        children.push(
          new Paragraph({
            text: text,
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 160, after: 80 },
          })
        );
      } else if (tagName === "p") {
        // Check if paragraph contains strong/bold text
        const hasStrong = element.querySelector("strong");

        if (hasStrong) {
          const runs: any[] = [];
          element.childNodes.forEach((node) => {
            if (node.nodeName === "STRONG") {
              runs.push(
                new TextRun({ text: node.textContent || "", bold: true })
              );
            } else if (node.nodeType === Node.TEXT_NODE) {
              runs.push(new TextRun({ text: node.textContent || "" }));
            }
          });

          children.push(
            new Paragraph({
              children: runs,
              spacing: { before: 100, after: 100 },
            })
          );
        } else {
          children.push(
            new Paragraph({
              text: text,
              spacing: { before: 100, after: 100 },
            })
          );
        }
      } else if (tagName === "hr") {
        // Add page break or separator
        children.push(
          new Paragraph({
            text: "___________________________________________",
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 200 },
          })
        );
      } else if (tagName === "ul" || tagName === "ol") {
        // Handle lists
        const listItems = element.querySelectorAll("li");
        listItems.forEach((li) => {
          children.push(
            new Paragraph({
              text: `• ${li.textContent}`,
              spacing: { before: 50, after: 50 },
            })
          );
        });
      } else {
        // Default: treat as paragraph
        if (text.trim()) {
          children.push(
            new Paragraph({
              text: text,
              spacing: { before: 100, after: 100 },
            })
          );
        }
      }
    });

    // Create Word document
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: children,
        },
      ],
    });

    // Generate and download
    const blob = await Packer.toBlob(doc);
    saveAs(blob, filename);

    console.log("Word document exported successfully");
  } catch (error: any) {
    console.error("Error exporting to Word:", error);
    throw new Error(
      `Failed to export Word document: ${error?.message || "Unknown error"}`
    );
  }
}

/**
 * Validate Word document file
 * @param file File to validate
 * @returns boolean indicating if file is valid
 */
export function validateWordFile(file: File): boolean {
  // Check file type
  const validTypes = [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
  ];

  if (
    !validTypes.includes(file.type) &&
    !file.name.endsWith(".docx") &&
    !file.name.endsWith(".doc")
  ) {
    throw new Error("Please select a valid Word document (.docx or .doc).");
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error("Word file is too large. Maximum size is 10MB.");
  }

  return true;
}
