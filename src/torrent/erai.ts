import axios from "axios";
import rssParser from "rss-to-json";
import { TorrentSearchResult } from "./search.js";

const { parse } = rssParser;

const RSS_URL = "https://www.erai-raws.info/rss-magnet/";

export const searchEraiRaws = async (
  searchQuery: string
): Promise<TorrentSearchResult[]> => {
  try {
    const feed = await parse(RSS_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!feed || !feed.items) return [];

    const results: TorrentSearchResult[] = [];
    const searchLower = searchQuery.toLowerCase();

    for (const item of feed.items) {
      const title = item.title || "";
      if (!title.toLowerCase().includes(searchLower)) continue;

      const magnetMatch = item.description?.match(/magnet:\?[^"]+/);
      const magnet = magnetMatch ? magnetMatch[0] : null;

      if (!magnet) continue;

      // Parse quality from title
      let quality = "1080p";
      if (title.includes("[1080p]")) quality = "1080p";
      if (title.includes("[720p]")) quality = "720p";
      if (title.includes("[480p]")) quality = "480p";

      results.push({
        name: title,
        tracker: "Erai-raws",
        category: "Anime",
        size: 0,
        seeds: 20, // Estimate
        peers: 5,
        magnet,
      });
    }

    return results;
  } catch (error) {
    console.error("Erai-raws search error:", error);
    return [];
  }
};

