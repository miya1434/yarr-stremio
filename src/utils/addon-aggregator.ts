/**
 * External Addon Aggregator - AIOStreams-inspired
 * Allows YARR! to pull results from other Stremio addons
 * Best of both worlds: 57+ built-in scrapers + aggregate other addons!
 */

import axios from "axios";

export interface ExternalAddon {
  name: string;
  url: string;
  enabled: boolean;
  timeout: number;
  debridKey?: string; // Some addons need debrid key in URL
}

export interface ExternalStreamResult {
  name?: string;
  title?: string;
  description?: string;
  url?: string;
  infoHash?: string;
  fileIdx?: number;
  externalUrl?: string;
  behaviorHints?: any;
  subtitles?: any[];
  sources?: string[];
  addon: string;
}

/**
 * Fetch streams from an external Stremio addon
 */
export async function fetchFromExternalAddon(
  addon: ExternalAddon,
  type: string,
  id: string
): Promise<ExternalStreamResult[]> {
  if (!addon.enabled) {
    return [];
  }

  try {
    const streamUrl = `${addon.url}/stream/${type}/${id}.json`;
    
    const response = await axios.get(streamUrl, {
      timeout: addon.timeout || 10000,
      headers: {
        "User-Agent": "YARR! Addon Aggregator",
      },
    });

    if (!response.data || !response.data.streams) {
      return [];
    }

    // Tag each stream with the source addon
    return response.data.streams.map((stream: any) => ({
      ...stream,
      addon: addon.name,
    }));
  } catch (error: any) {
    console.warn(`Failed to fetch from ${addon.name}: ${error.message}`);
    return [];
  }
}

/**
 * Fetch from multiple external addons in parallel
 */
export async function aggregateExternalAddons(
  addons: ExternalAddon[],
  type: string,
  id: string
): Promise<ExternalStreamResult[]> {
  const enabledAddons = addons.filter((a) => a.enabled);

  if (enabledAddons.length === 0) {
    return [];
  }

  console.log(`Aggregating from ${enabledAddons.length} external addons...`);

  const results = await Promise.allSettled(
    enabledAddons.map((addon) => fetchFromExternalAddon(addon, type, id))
  );

  const streams: ExternalStreamResult[] = [];
  let failedCount = 0;

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      streams.push(...result.value);
    } else {
      failedCount++;
      console.warn(`External addon ${enabledAddons[index].name} failed:`, result.reason);
    }
  });

  console.log(`Aggregated ${streams.length} streams from external addons (${failedCount} failed)`);

  return streams;
}

/**
 * Parse common external addon URL formats
 */
export function parseAddonUrl(url: string, debridKey?: string): string {
  // Handle Torrentio format: https://torrentio.strem.fun/realdebrid=KEY/manifest.json
  if (url.includes("torrentio.strem.fun") && debridKey) {
    return url.replace("/manifest.json", "").replace(/\/[^/]+$/, `/realdebrid=${debridKey}`);
  }

  // Handle Comet format: https://comet.elfhosted.com/BASE64CONFIG/manifest.json
  if (url.includes("comet")) {
    return url.replace("/manifest.json", "");
  }

  // Generic: just remove /manifest.json
  return url.replace("/manifest.json", "");
}

/**
 * Convert external stream to YARR! format
 */
export function convertExternalStream(
  externalStream: ExternalStreamResult,
  formatterType: string = "external"
): any {
  // Try to extract metadata from the stream
  const name = externalStream.name || "Unknown Quality";
  const description = externalStream.title || externalStream.description || "";

  // Parse quality from name if possible
  const qualityMatch = name.match(/(\d{3,4}p|4K|1080p|720p|480p)/i);
  const quality = qualityMatch ? qualityMatch[0] : "Unknown";

  // Parse seeders if in description
  const seedersMatch = description.match(/👤\s*(\d+)|(\d+)\s*seeds?/i);
  const seeds = seedersMatch ? parseInt(seedersMatch[1] || seedersMatch[2]) : 0;

  // Parse size if in description
  const sizeMatch = description.match(/💾?\s*([0-9.]+)\s*([KMGT]B)/i);
  let fileSizeBytes = 0;
  if (sizeMatch) {
    const size = parseFloat(sizeMatch[1]);
    const unit = sizeMatch[2].toUpperCase();
    const multipliers: Record<string, number> = {
      TB: 1024 ** 4,
      GB: 1024 ** 3,
      MB: 1024 ** 2,
      KB: 1024,
    };
    fileSizeBytes = size * (multipliers[unit] || 0);
  }

  // Parse video size from behaviorHints if available
  if (externalStream.behaviorHints?.videoSize) {
    fileSizeBytes = externalStream.behaviorHints.videoSize;
  }

  // Determine if cached (look for cached indicators)
  const isCached = name.includes("⚡") || name.includes("Cached") || 
                   description.includes("⚡") || description.includes("Cached");

  return {
    stream: {
      name: `[${externalStream.addon}] ${name}`,
      title: description,
      url: externalStream.url,
      infoHash: externalStream.infoHash,
      fileIdx: externalStream.fileIdx,
      externalUrl: externalStream.externalUrl,
      behaviorHints: externalStream.behaviorHints,
      subtitles: externalStream.subtitles,
      sources: externalStream.sources,
    },
    torrentName: externalStream.addon,
    fileName: description.split("\n")[0] || name, 
    quality,
    score: 50, 
    torrentSeeds: seeds,
    fileSize: fileSizeBytes,
    tracker: externalStream.addon,
    isExternal: true,
    cached: isCached, 
  };
}

