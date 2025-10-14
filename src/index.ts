import "./utils/dotenv.js";

import express from "express";
import { serveHTTP } from "./addon/server.js";
import { router } from "./router.js";
import { serveHTTPS } from "./utils/https.js";
import { initBestTrackers } from "./utils/trackers.js";
import { providerHealth } from "./utils/provider-health.js";

const PORT = Number(process.env.PORT) || 58827;
const HTTPS_PORT = Number(process.env.HTTPS_PORT) || 58828;

const main = async () => {
  console.log("🏴‍☠️ YARR! - Yet Another Rapid Retriever");
  console.log("Initializing...");
  
  // Initialize best trackers from ngosang's list
  console.log("Downloading best trackers...");
  await initBestTrackers().catch((error) => {
    console.warn("Failed to download best trackers, using defaults:", error.message);
  });

  // Start provider health monitoring
  console.log("Starting provider health monitor...");
  providerHealth.startMonitoring();
  
  const app = await serveHTTP(PORT);
  
  // Apply rate limiting
  const { apiLimiter } = await import("./utils/rate-limiter.js");
  app.use("/api", apiLimiter);
  
  app.use(express.json()).use("/api", router);
  
  console.log("✅ YARR! is ready!");
  console.log(``);
  console.log(`🌐 Access at: http://localhost:${PORT}`);
};

main().catch((error) => {
  console.error("Fatal error during startup:", error);
  process.exit(1);
});
