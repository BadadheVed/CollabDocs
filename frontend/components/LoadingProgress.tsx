"use client";

import { useEffect, useState } from "react";

interface LoadingProgressProps {
  message?: string;
  progress?: number;
}

export function LoadingProgress({
  message = "Processing...",
  progress,
}: LoadingProgressProps) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex flex-col items-center space-y-4">
          {/* Animated spinner */}
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-blue-500 rounded-full animate-spin border-t-transparent absolute top-0 left-0"></div>
          </div>

          {/* Message */}
          <div className="text-center">
            <p className="text-gray-900 font-medium text-lg">
              {message}
              <span className="inline-block w-8 text-left">{dots}</span>
            </p>
            {progress !== undefined && (
              <p className="text-gray-600 text-sm mt-2">{progress}% complete</p>
            )}
          </div>

          {/* Progress bar */}
          {progress !== undefined ? (
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          ) : (
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div className="bg-blue-500 h-2 rounded-full animate-pulse w-full" />
            </div>
          )}

          <p className="text-gray-500 text-sm">
            Please wait while we process your document
          </p>
        </div>
      </div>
    </div>
  );
}
