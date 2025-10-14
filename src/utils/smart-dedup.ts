/**
 * Smart deduplication - Inspired by AIOStreams
 * Multiple strategies for detecting duplicate torrents
 */

import { TorrentSearchResult } from "../torrent/search.js";

export type DeduplicationMethod = "tracker+name" | "infohash" | "smart-hash" | "filename";

/**
 * Generate a simple text hash (similar to AIOStreams)
 */
function simpleHash(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Smart hash based on torrent attributes
 */
function generateSmartHash(torrent: TorrentSearchResult): string {
  // Round size to nearest 100MB for margin of error
  const roundedSize = torrent.size 
    ? Math.round(torrent.size / 100000000) * 100000000
    : 0;

  // Extract key attributes
  const resolution = torrent.name.match(/(\d{3,4}p|4K|2160p|1080p|720p)/i)?.[0] || "";
  const codec = torrent.name.match(/(H\.?265|HEVC|x265|H\.?264|x264|AV1)/i)?.[0] || "";
  const source = torrent.name.match(/(BluRay|WEB-DL|WEBRip|HDTV|REMUX)/i)?.[0] || "";

  const hashInput = `${roundedSize}${resolution}${codec}${source}`;
  return simpleHash(hashInput);
}

/**
 * Deduplicate using multiple methods (AIOStreams-style)
 */
export function smartDeduplicate(
  torrents: TorrentSearchResult[],
  methods: DeduplicationMethod[] = ["infohash", "smart-hash"]
): TorrentSearchResult[] {
  const seen = new Set<string>();
  const result: TorrentSearchResult[] = [];

  for (const torrent of torrents) {
    const keys: string[] = [];

    // Generate keys based on selected methods
    for (const method of methods) {
      switch (method) {
        case "tracker+name":
          keys.push(`tracker:${torrent.tracker}:${torrent.name}`);
          break;

        case "infohash":
          if (torrent.magnet) {
            const hashMatch = torrent.magnet.match(/btih:([a-f0-9]{40})/i);
            if (hashMatch) {
              keys.push(`infohash:${hashMatch[1].toLowerCase()}`);
            }
          }
          break;

        case "smart-hash":
          keys.push(`smart:${generateSmartHash(torrent)}`);
          break;

        case "filename":
          // Normalize filename for comparison
          const normalized = torrent.name
            .replace(/\.(mkv|mp4|avi|mov|wmv)$/i, "")
            .replace(/[^\w\d]/g, "")
            .toLowerCase();
          keys.push(`filename:${normalized}`);
          break;
      }
    }

    // Check if any key has been seen
    const isDuplicate = keys.some((key) => seen.has(key));

    if (!isDuplicate) {
      // Mark all keys as seen
      keys.forEach((key) => seen.add(key));
      result.push(torrent);
    }
  }

  console.log(`Deduplication: ${torrents.length} -> ${result.length} (removed ${torrents.length - result.length} duplicates)`);

  return result;
}

/**
 * Group similar torrents (same content, different quality/source)
 */
export function groupSimilarTorrents(
  torrents: TorrentSearchResult[]
): Map<string, TorrentSearchResult[]> {
  const groups = new Map<string, TorrentSearchResult[]>();

  for (const torrent of torrents) {
    // Extract base title (remove quality indicators)
    const baseTitle = torrent.name
      .replace(/(\d{3,4}p|4K|2160p|1080p|720p|480p)/gi, "")
      .replace(/(BluRay|WEB-DL|WEBRip|HDTV|REMUX|x264|x265|HEVC)/gi, "")
      .replace(/\[.*?\]/g, "")
      .trim();

    if (!groups.has(baseTitle)) {
      groups.set(baseTitle, []);
    }

    groups.get(baseTitle)!.push(torrent);
  }

  return groups;
}

