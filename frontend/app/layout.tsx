import React from "react";
import Script from "next/script";
import ToasterProvider from "@/components/ToasterProvider";
import KeepAliveProvider from "@/components/KeepAliveProvider";
import { Analytics } from "@vercel/analytics/next";
export const metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || "https://collabdocs.in",
  ),
  title: {
    default: "CollabDocs | Real-Time Collaborative Document Editor",
    template: "%s | CollabDocs",
  },
  description:
    "Create, edit, and collaborate on documents in real-time. The fast, secure alternative to Google Docs for teams, students, and creators. Start free.",
  keywords: [
    "collaborative document editor",
    "real-time collaboration",
    "online document editor",
    "team collaboration",
    "google docs alternative",
    "notion alternative",
    "document sharing",
    "collaborative editing",
    "real-time editing",
    "team productivity",
  ],
  authors: [{ name: "CollabDocs Team" }],
  creator: "CollabDocs",
  publisher: "CollabDocs",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "CollabDocs | Real-Time Collaborative Document Editor",
    description:
      "Create, edit, and collaborate on documents in real-time. The fast, secure alternative to Google Docs for teams, students, and creators. Start free.",
    siteName: "CollabDocs",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CollabDocs - Real-Time Collaborative Document Editor",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CollabDocs | Real-Time Collaborative Document Editor",
    description:
      "Create, edit, and collaborate on documents in real-time. The fast, secure alternative to Google Docs.",
    images: ["/og-image.png"],
  },
  verification: {
    // Add your Google Search Console verification code here
    google: "6i5UnFCzTyG64zP6X9pf2qMbA1Pv8MgFFKmYAIlpo5A",
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "CollabDocs",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, Windows, macOS, Linux, iOS, Android",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "2847",
    },
    description:
      "Real-time collaborative document editor for teams, students, and creators. Create, edit, and share documents with instant synchronization.",
    featureList: [
      "Real-time collaboration",
      "Document sharing",
      "Version history",
      "Team permissions",
      "Rich text editing",
      "PDF and Word export",
      "Secure PIN protection",
    ],
  };

  return (
    <html lang="en" className="light">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />

        {/* Structured Data */}
        <Script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />

        {/* Google Analytics */}
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-HE97TECZ1T"
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-HE97TECZ1T');
            `,
          }}
        />

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
        <KeepAliveProvider />
        {children}
        <Analytics />
        <ToasterProvider />
      </body>
    </html>
  );
}
