import axios from "axios";
import { TorrentSearchResult } from "./search.js";

export const searchZilean = async (
  searchQuery: string,
  zileanUrl?: string
): Promise<TorrentSearchResult[]> => {
  if (!zileanUrl) {
    console.log("Zilean: URL not configured");
    return [];
  }

  try {
    // Zilean DMM (Debrid Media Manager) format
    const response = await axios.get(`${zileanUrl}/dmm/search`, {
      params: {
        query: searchQuery,
      },
      timeout: 10000,
    });

    if (!response.data) {
      return [];
    }

    const results: TorrentSearchResult[] = [];

    // Zilean returns hashlists
    for (const item of response.data) {
      if (!item.info_hash) continue;

      // Create magnet link from info hash
      const magnet = `magnet:?xt=urn:btih:${item.info_hash}`;

      results.push({
        name: item.raw_title || item.title || "Unknown",
        tracker: "Zilean",
        category: "Movies/TV",
        size: item.size || 0,
        seeds: item.seeders || 0,
        peers: item.leechers || 0,
        magnet,
      });
    }

    return results;
  } catch (error) {
    console.error("Zilean search error:", error);
    return [];
  }
};

