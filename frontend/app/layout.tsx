"use client";
import React from "react";
import Script from "next/script";
import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Script
          src="https://cdn.tailwindcss.com"
          strategy="beforeInteractive"
        />
        <Script
          src="https://cdn.jsdelivr.net/npm/@tailwindcss/typography@0.5.10/dist/typography.min.js"
          strategy="beforeInteractive"
        />
        <Script id="tailwind-config" strategy="beforeInteractive">{`
          tailwind.config = {
            darkMode: 'class',
            theme: { extend: {} },
            plugins: [typography],
          }
        `}</Script>
      </head>
      <body className="bg-white text-gray-900 min-h-screen antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
