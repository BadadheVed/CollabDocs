"use client";
import { useState, useEffect, useRef } from "react";
import { RefreshCw } from "lucide-react";

type Status = "checking" | "up" | "down";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";
const WS_API_URL = process.env.NEXT_PUBLIC_WS_API_URL || "http://localhost:1235";
const MAX_ATTEMPTS = 10;
const POLL_INTERVAL = 5_000;

export default function ServiceStatus() {
  const [backend, setBackend] = useState<Status>("checking");
  const [ws, setWs] = useState<Status>("checking");
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [polling, setPolling] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const attemptsRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const stop = () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setPolling(false);
  };

  const doCheck = async () => {
    attemptsRef.current += 1;
    const n = attemptsRef.current;
    setAttempts(n);

    const [backendOk, wsOk] = await Promise.all([
      fetch(`${BACKEND_URL}/health`)
        .then((r) => r.ok)
        .catch(() => false),
      fetch(`${WS_API_URL}/health`)
        .then((r) => r.ok)
        .catch(() => false),
    ]);

    setBackend(backendOk ? "up" : "down");
    setWs(wsOk ? "up" : "down");

    if ((backendOk && wsOk) || n >= MAX_ATTEMPTS) stop();
  };

  const start = () => {
    stop();
    attemptsRef.current = 0;
    setAttempts(0);
    setBackend("checking");
    setWs("checking");
    setPolling(true);
    doCheck();
    intervalRef.current = setInterval(doCheck, POLL_INTERVAL);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { start(); return stop; }, []);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPinned(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const both = backend === "up" && ws === "up";
  const none = backend === "down" && ws === "down";
  const isChecking = backend === "checking" || ws === "checking";
  const dotColor = both
    ? "bg-green-500"
    : none
    ? "bg-red-500"
    : isChecking
    ? "bg-gray-300"
    : "bg-yellow-400";

  const open = hovered || pinned;

  return (
    <div
      ref={containerRef}
      className="fixed top-4 right-4 z-50"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        onClick={() => setPinned((p) => !p)}
        className={`w-2 h-2 rounded-full cursor-pointer ${dotColor}${
          both || isChecking ? " animate-pulse" : ""
        }`}
      />
      {open && (
        <div className="absolute top-4 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-48">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-600">Services</span>
            <button
              onClick={start}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={12} />
            </button>
          </div>
          <Row label="Backend" status={backend} />
          <Row label="WebSocket" status={ws} />
          <p className="text-xs text-gray-400 mt-2">
            {polling ? `Checking… ${attempts}/${MAX_ATTEMPTS}` : "Idle"}
          </p>
        </div>
      )}
    </div>
  );
}

function Row({ label, status }: { label: string; status: Status }) {
  const dot =
    status === "up"
      ? "bg-green-500"
      : status === "down"
      ? "bg-red-500"
      : "bg-gray-300 animate-pulse";
  const text =
    status === "up"
      ? "text-green-600"
      : status === "down"
      ? "text-red-500"
      : "text-gray-400";
  const word = status === "up" ? "Online" : status === "down" ? "Offline" : "…";
  return (
    <div className="flex items-center gap-2 py-0.5">
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
      <span className="text-xs text-gray-600">{label}</span>
      <span className={`ml-auto text-xs ${text}`}>{word}</span>
    </div>
  );
}
