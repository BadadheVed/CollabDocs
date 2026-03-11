import client from "prom-client";
export const register = new client.Registry();
export const activeWsConnections = new client.Gauge({
  name: "Active_WebSockets",
  help: "Number of active WebSocket connections",
  registers: [register],
});
