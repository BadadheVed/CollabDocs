const http = require("http");
const httpProxy = require("http-proxy");

const WS_TARGET = process.env.WS_API_URL || "ws://collabdocs-ws:1234";
const PORT = process.env.WS_PROXY_PORT || 3001;

const proxy = httpProxy.createProxyServer({
  target: WS_TARGET,
  ws: true,
  changeOrigin: true,
});

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("WebSocket Proxy Server\n");
});

server.on("upgrade", (req, socket, head) => {
  console.log("WebSocket upgrade request received");
  proxy.ws(req, socket, head, { target: WS_TARGET });
});

proxy.on("error", (err, req, res) => {
  console.error("Proxy error:", err);
  if (res && res.writeHead) {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Proxy error");
  }
});

server.listen(PORT, () => {
  console.log(`WebSocket proxy server running on port ${PORT}`);
  console.log(`Proxying to: ${WS_TARGET}`);
});
