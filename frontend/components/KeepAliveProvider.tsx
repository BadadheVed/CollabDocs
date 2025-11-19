"use client";

import { useEffect } from "react";
import { startKeepAlive, stopKeepAlive } from "@/lib/keepAlive";

export default function KeepAliveProvider() {
  useEffect(() => {
    // Start keep-alive pings when component mounts
    startKeepAlive();

    // Cleanup on unmount
    return () => {
      stopKeepAlive();
    };
  }, []);

  return null; // This component doesn't render anything
}
