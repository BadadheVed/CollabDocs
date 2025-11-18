import cron from "node-cron";
import axios from "axios";
import WebSocket from "ws";

const CRON_HTTP_URL =
  process.env.CRON_HTTP_URL || "http://localhost:8080/cron/cleanup";
const CRON_WS_URL = process.env.CRON_WS_URL || "ws://localhost:1234";
const WS_TIMEOUT_MS = 5000;

function runWssCheck(): Promise<boolean> {
  return new Promise((resolve) => {
    console.log(`\n--- Starting WSS Connection Test for: ${CRON_WS_URL} ---`);
    let ws: WebSocket;

    try {
      ws = new WebSocket(CRON_WS_URL);
    } catch (error) {
      console.error("WSS Check FAILED: Could not initialize WebSocket:", error);
      return resolve(false);
    }

    const timeoutId = setTimeout(() => {
      if (ws.readyState === WebSocket.CONNECTING) {
        ws.close();
        console.error("WSS Check FAILED: Connection timed out.");
        resolve(false);
      }
    }, WS_TIMEOUT_MS);

    ws.on("open", () => {
      clearTimeout(timeoutId);
      console.log(
        "WSS Check: Connection established successfully. Disconnecting..."
      );

      ws.close();
      resolve(true);
    });

    ws.on("error", (err: any) => {
      clearTimeout(timeoutId);
      console.error("WSS Check FAILED: Connection error:", err.message);
      resolve(false);
    });

    ws.on("close", (code, reason) => {
      if (code !== 1000 && ws.readyState !== WebSocket.CLOSING) {
        console.warn(
          `WSS Check: Connection closed unexpectedly. Code: ${code}`
        );
      }
    });
  });
}

export const cronJob = cron.schedule("*/10 * * * *", async () => {
  console.log(
    `\n--- Running 10-Minute Monitoring Job (${new Date().toLocaleTimeString()}) ---`
  );
  let httpSuccess = false;
  let wsSuccess = false;

  try {
    await axios.get(CRON_HTTP_URL, { timeout: WS_TIMEOUT_MS });
    console.log("Self-ping completed successfully.");
    httpSuccess = true;
  } catch (error: any) {
    console.error("Self-ping failed:", error.message);
  }

  wsSuccess = await runWssCheck();

  if (httpSuccess && wsSuccess) {
    console.log("\n✅ All monitoring checks passed.");
  } else {
    console.log("\n❌ One or more monitoring checks failed.");
  }
});
