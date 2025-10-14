import { Application } from "express";
import express from "express";
import stremio from "stremio-addon-sdk";
import { streamHandler } from "./streams.js";
import { catalogHandler } from "./catalog.js";
import { manifest } from "./manifest.js";
import { Server } from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const serveHTTP = async (port: number) => {
  const builder = new stremio.addonBuilder(manifest);

  // @ts-ignore
  builder.defineStreamHandler(streamHandler);
  
  // @ts-ignore
  builder.defineCatalogHandler(catalogHandler);
  
  const addonInterface = builder.getInterface();

  // Create our own Express app
  const app = express();
  
  app.set('trust proxy', true);
  
  // CORS middleware for Stremio
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
    } else {
      next();
    }
  });
  
  // Load landing page
  const landingPagePath = path.join(__dirname, "landing.html");
  const landingPageHtml = fs.readFileSync(landingPagePath, "utf8");
  
  
  app.get("/", (req, res) => {
    res.setHeader("Content-Type", "text/html");
    res.send(landingPageHtml);
  });
  
  app.get("/configure", (req, res) => {
    res.setHeader("Content-Type", "text/html");
    res.send(landingPageHtml);
  });
  
  // Handle config-specific configure page
  app.get("/:config/configure", (req, res) => {
    try {
      const config = parseConfig(req.params.config);
      // Inject config into landing page for pre-population
      let html = landingPageHtml;
      html = html.replace('</body>', `<script>window.YARR_CONFIG = ${JSON.stringify(config)};</script></body>`);
      res.setHeader("Content-Type", "text/html");
      res.send(html);
    } catch (error) {
      console.error("Config parse error:", error);
      res.setHeader("Content-Type", "text/html");
      res.send(landingPageHtml);
    }
  });
  
  // Serve manifest (with or without config)
  app.get("/manifest.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "max-age=3600, public");
    res.send(JSON.stringify(manifest, null, 2));
  });
  
  app.get("/:config/manifest.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "max-age=3600, public");
    res.send(JSON.stringify(manifest, null, 2));
  });
  
  // Serve streams
  app.get("/:config?/stream/:type/:id.json", async (req, res) => {
    try {
      const config = req.params.config ? parseConfig(req.params.config) : {};
      const result = await streamHandler({
        type: req.params.type,
        id: req.params.id,
        config,
        req,
      });
      res.setHeader("Content-Type", "application/json");
      res.send(JSON.stringify(result));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Serve catalog
  app.get("/:config?/catalog/:type/:id/:extra?.json", async (req, res) => {
    try {
      const config = req.params.config ? parseConfig(req.params.config) : {};
      const result = await catalogHandler({
        type: req.params.type,
        id: req.params.id,
        extra: req.params.extra ? JSON.parse(decodeURIComponent(req.params.extra)) : {},
        config,
      });
      res.setHeader("Content-Type", "application/json");
      res.send(JSON.stringify(result));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Start server
  const server = app.listen(port, () => {
    console.log(`🏴‍☠️ YARR! addon available at http://localhost:${port}`);
  });

  return app;
};

function parseConfig(configStr: string): any {
  try {
    const pairs = configStr.split("&");
    const config: any = {};
    for (const pair of pairs) {
      const [key, value] = pair.split("=");
      if (key && value) {
        config[decodeURIComponent(key)] = decodeURIComponent(value);
      }
    }
    return config;
  } catch (error) {
    return {};
  }
}
