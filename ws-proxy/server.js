const http = require("http");
const httpProxy = require("http-proxy");

const WS_TARGET = process.env.WS_TARGET || "ws://localhost:1234";
const PORT = process.env.PORT || 3001;

const proxy = httpProxy.createProxyServer({
  target: WS_TARGET,
  ws: true,
  changeOrigin: true,
});

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("WebSocket Proxy Server Running\n");
});

server.on("upgrade", (req, socket, head) => {
  console.log("WebSocket upgrade request received, proxying to:", WS_TARGET);
  proxy.ws(req, socket, head);
});

proxy.on("error", (err, req, socket) => {
  console.error("Proxy error:", err);
  if (socket && socket.writable) {
    socket.end();
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`WebSocket proxy server listening on port ${PORT}`);
  console.log(`Proxying WebSocket connections to: ${WS_TARGET}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, closing server...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
