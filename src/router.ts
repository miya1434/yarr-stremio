import { Router } from "express";
import axios from "axios";
import { searchTorrents } from "./torrent/search.js";
import {
  getFile,
  getOrAddTorrent,
  getStats,
  getTorrentInfo,
  streamClosed,
  streamOpened,
} from "./torrent/webtorrent.js";
import { getStreamingMimeType } from "./utils/file.js";
import { mlEngine } from "./utils/ml-engine.js";
import { getTrendingContent, getPopularContent } from "./metadata/catalog.js";
import { getTraktUserRecommendations, getTraktTrending, getTraktPopular } from "./metadata/trakt.js";
import { exportConfig, importConfig } from "./utils/config-manager.js";
import { COMMUNITY_PRESETS, getPreset, applyPreset } from "./utils/presets.js";
import { providerHealth } from "./utils/provider-health.js";
import { analyzeAndRecommend, recommendationsToConfig } from "./utils/smart-recommendations.js";
import { checkRealDebridCached } from "./debrid/realdebrid.js";
import { checkPremiumizeCached } from "./debrid/premiumize.js";
import { checkAllDebridCached } from "./debrid/alldebrid.js";
import { checkDebridLinkCached } from "./debrid/debridlink.js";
import { checkTorBoxCached } from "./debrid/torbox.js";
import { checkPikPakCached } from "./debrid/pikpak.js";

export const router = Router();

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    version: "0.1.0",
    providers: "56+",
    features: ["RTN", "Trakt", "Catalogs", "6 Debrid Services"],
  });
});

// Test debrid API key endpoint
router.post("/test-debrid", async (req, res) => {
  const { service, apiKey } = req.body;
  
  if (!service || !apiKey) {
    return res.status(400).json({ valid: false, error: "Missing service or apiKey" });
  }
  
  try {
    
    
    let isValid = false;
    
    switch (service) {
      case 'RealDebrid':
        // Make a simple API call to validate the key
        const rdResponse = await axios.get('https://api.real-debrid.com/rest/1.0/user', {
          headers: { Authorization: `Bearer ${apiKey}` },
          timeout: 5000,
        });
        isValid = rdResponse.status === 200 && rdResponse.data;
        break;
      case 'Premiumize':
        const pmResponse = await axios.get('https://www.premiumize.me/api/account/info', {
          params: { apikey: apiKey },
          timeout: 5000,
        });
        isValid = pmResponse.status === 200 && pmResponse.data.status === 'success';
        break;
      case 'AllDebrid':
        const adResponse = await axios.get('https://api.alldebrid.com/v4/user', {
          params: { agent: 'yarr', apikey: apiKey },
          timeout: 5000,
        });
        isValid = adResponse.status === 200 && adResponse.data.status === 'success';
        break;
      case 'DebridLink':
        const dlResponse = await axios.get('https://debrid-link.com/api/v2/account/infos', {
          headers: { Authorization: `Bearer ${apiKey}` },
          timeout: 5000,
        });
        isValid = dlResponse.status === 200 && dlResponse.data.value;
        break;
      case 'TorBox':
        const tbResponse = await axios.get('https://api.torbox.app/v1/api/user/me', {
          headers: { Authorization: `Bearer ${apiKey}` },
          timeout: 5000,
        });
        isValid = tbResponse.status === 200 && tbResponse.data.data;
        break;
      case 'PikPak':
        const ppResponse = await axios.get('https://api-drive.mypikpak.com/drive/v1/about', {
          headers: { Authorization: `Bearer ${apiKey}` },
          timeout: 5000,
        });
        isValid = ppResponse.status === 200;
        break;
      default:
        return res.status(400).json({ valid: false, error: "Unknown service" });
    }
    
    if (isValid) {
      res.json({ valid: true, service, message: "API key is valid and working!" });
    } else {
      res.json({ valid: false, error: "API key validation failed" });
    }
  } catch (error: any) {
    console.error(`Debrid test error for ${service}:`, error.message);
    res.json({ valid: false, error: error.message || "Invalid API key or service unavailable" });
  }
});

router.get("/stats", (req, res) => {
  const stats = getStats();
  res.json(stats);
});

router.get("/ml/insights", (req, res) => {
  const insights = mlEngine.getInsights();
  res.json(insights);
});

router.post("/ml/track", (req, res) => {
  const streamData = req.body;
  mlEngine.recordSelection(streamData);
  res.json({ success: true });
});

router.post("/ml/reset", (req, res) => {
  mlEngine.reset();
  res.json({ success: true, message: "ML preferences reset" });
});

router.get("/ml/export", (req, res) => {
  const exported = mlEngine.export();
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", "attachment; filename=yarr-ml-preferences.json");
  res.send(exported);
});

router.post("/ml/import", (req, res) => {
  const data = req.body.data;
  const success = mlEngine.import(data);
  res.json({ success, message: success ? "Preferences imported" : "Import failed" });
});

// Catalog endpoints
router.get("/catalog/trending/:type", async (req, res) => {
  const { type } = req.params;
  const skip = parseInt(req.query.skip as string || "0");
  const metas = await getTrendingContent(type as "movie" | "series", skip);
  res.json({ metas });
});

router.get("/catalog/popular/:type", async (req, res) => {
  const { type } = req.params;
  const skip = parseInt(req.query.skip as string || "0");
  const metas = await getPopularContent(type as "movie" | "series", skip);
  res.json({ metas });
});


router.get("/trakt/recommendations/:type", async (req, res) => {
  const { type } = req.params;
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ error: "Trakt token required" });
  }
  const recommendations = await getTraktUserRecommendations(token, type as "movie" | "show");
  res.json({ recommendations });
});

router.get("/trakt/trending/:type", async (req, res) => {
  const { type } = req.params;
  const trending = await getTraktTrending(type as "movie" | "show");
  res.json({ trending });
});

router.get("/trakt/popular/:type", async (req, res) => {
  const { type } = req.params;
  const popular = await getTraktPopular(type as "movie" | "show");
  res.json({ popular });
});


router.post("/config/export", (req, res) => {
  const config = req.body;
  const exported = exportConfig(config);
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", "attachment; filename=yarr-config.json");
  res.send(exported);
});

router.post("/config/import", (req, res) => {
  try {
    const jsonData = req.body.config;
    const imported = importConfig(jsonData);
    res.json({ success: true, config: imported });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});


router.get("/formatters", (req, res) => {
  const { getFormatterInfo } = require("./utils/formatters.js");
  const formatters = [
    "ultra-clean", "google-light", "compact", "pro",
    "yarr", "google", "prism", "torrentio",
    "minimal", "detailed",
  ].map(type => ({
    id: type,
    ...getFormatterInfo(type),
  }));
  res.json({ formatters });
});


router.get("/presets", (req, res) => {
  res.json({ presets: COMMUNITY_PRESETS });
});

router.get("/presets/:id", (req, res) => {
  const preset = getPreset(req.params.id);
  if (!preset) {
    return res.status(404).json({ error: "Preset not found" });
  }
  res.json({ preset });
});

router.post("/presets/:id/apply", (req, res) => {
  const currentConfig = req.body.currentConfig || {};
  try {
    const newConfig = applyPreset(req.params.id, currentConfig);
    res.json({ success: true, config: newConfig });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});


router.get("/health/providers", (req, res) => {
  const dashboard = providerHealth.getDashboard();
  res.json(dashboard);
});

router.get("/health/providers/:name", (req, res) => {
  const health = providerHealth.getHealth(req.params.name);
  if (!health) {
    return res.status(404).json({ error: "Provider not found" });
  }
  res.json({ health });
});

router.post("/health/providers/:name/reset", (req, res) => {
  providerHealth.resetProvider(req.params.name);
  res.json({ success: true, message: `Provider ${req.params.name} health reset` });
});

router.get("/health/export", (req, res) => {
  const exported = providerHealth.export();
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", "attachment; filename=yarr-provider-health.json");
  res.send(exported);
});


router.post("/recommendations/analyze", async (req, res) => {
  const traktToken = req.body.traktToken;
  if (!traktToken) {
    return res.status(400).json({ error: "Trakt token required" });
  }
  
  try {
    const recommendations = await analyzeAndRecommend(traktToken);
    const suggestedConfig = recommendationsToConfig(recommendations);
    res.json({ 
      success: true,
      recommendations,
      suggestedConfig,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/torrents/:query", async (req, res) => {
  const { query } = req.params;
  const torrents = await searchTorrents(query);
  res.json(torrents);
});

router.post("/torrents/:query", async (req, res) => {
  const { query } = req.params;
  const options = req.body;
  const torrents = await searchTorrents(query, options);
  res.json(torrents);
});

router.get("/torrent/:torrentUri", async (req, res) => {
  const { torrentUri } = req.params;

  const torrent = await getTorrentInfo(torrentUri);
  if (!torrent) return res.status(500).send("Failed to get torrent");

  torrent.files.forEach((file) => {
    file.url = [
      `${req.protocol}://${req.get("host")}`,
      "stream",
      encodeURIComponent(torrentUri),
      encodeURIComponent(file.path),
    ].join("/");
  });

  res.json(torrent);
});

router.get("/stream/:torrentUri/:filePath", async (req, res) => {
  const { torrentUri, filePath } = req.params;

  const torrent = await getOrAddTorrent(torrentUri);
  if (!torrent) return res.status(500).send("Failed to add torrent");

  const file = getFile(torrent, filePath);
  if (!file) return res.status(404).send("File not found");

  const { range } = req.headers;
  const positions = (range || "").replace(/bytes=/, "").split("-");
  const start = Number(positions[0]);
  const end = Number(positions[1]) || file.length - 1;

  if (start >= file.length || end >= file.length) {
    res.writeHead(416, {
      "Content-Range": `bytes */${file.length}`,
    });
    return res.end();
  }

  const headers = {
    "Content-Range": `bytes ${start}-${end}/${file.length}`,
    "Accept-Ranges": "bytes",
    "Content-Length": end - start + 1,
    "Content-Type": getStreamingMimeType(file.name),
  };

  res.writeHead(206, headers);

  try {
    const noDataTimeout = setTimeout(() => {
      res.status(500).end();
    }, 10000);

    const noReadTimeout = setTimeout(() => {
      res.status(200).end();
    }, 60000);

    const videoStream = file.createReadStream({ start, end });

    videoStream.on("data", () => {
      clearTimeout(noDataTimeout);
    });

    videoStream.on("readable", () => {
      noReadTimeout.refresh();
    });

    videoStream.on("error", (error) => {});

    videoStream.pipe(res);

    streamOpened(torrent.infoHash, file.name);

    res.on("close", () => {
      streamClosed(torrent.infoHash, file.name);
    });
  } catch (error) {
    res.status(500).end();
  }
});
