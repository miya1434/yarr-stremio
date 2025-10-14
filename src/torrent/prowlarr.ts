import axios from "axios";
import { TorrentSearchResult } from "./search.js";

const DEFAULT_CATEGORIES = [2000, 5000]; // Movies and TV

export const searchProwlarr = async (
  searchQuery: string,
  apiUrl?: string,
  apiKey?: string
): Promise<TorrentSearchResult[]> => {
  if (!apiUrl || !apiKey) {
    console.log("Prowlarr: API URL or Key not configured");
    return [];
  }

  try {
    const response = await axios.get(`${apiUrl}/api/v1/search`, {
      params: {
        query: searchQuery,
        categories: DEFAULT_CATEGORIES.join(","),
        type: "search",
      },
      headers: {
        "X-Api-Key": apiKey,
      },
      timeout: 10000,
    });

    if (!response.data || !Array.isArray(response.data)) {
      return [];
    }

    const results: TorrentSearchResult[] = response.data.map((item: any) => {
      // Extract magnet or download URL
      let magnet: string | undefined;
      let torrent: string | undefined;

      if (item.magnetUrl) {
        magnet = item.magnetUrl;
      } else if (item.downloadUrl) {
        // Check if it's a magnet link
        if (item.downloadUrl.startsWith("magnet:")) {
          magnet = item.downloadUrl;
        } else {
          torrent = item.downloadUrl;
        }
      }

      // Get indexer name
      const indexer = item.indexer || "Unknown";

      return {
        name: item.title || "Unknown",
        tracker: `Prowlarr|${indexer}`,
        category: getCategoryName(item.categories),
        size: item.size || 0,
        seeds: item.seeders || 0,
        peers: item.leechers || 0,
        torrent,
        magnet,
      };
    });

    return results.filter((r) => r.magnet || r.torrent);
  } catch (error) {
    console.error("Prowlarr search error:", error);
    return [];
  }
};

function getCategoryName(categories: number[]): string {
  if (!categories || categories.length === 0) return "Unknown";

  const category = categories[0];

  // Prowlarr category IDs
  if (category >= 2000 && category < 3000) return "Movies";
  if (category >= 5000 && category < 6000) return "TV";
  if (category >= 7000 && category < 8000) return "XXX";
  if (category >= 1000 && category < 2000) return "Console";
  if (category >= 3000 && category < 4000) return "Audio";
  if (category >= 4000 && category < 5000) return "PC";
  if (category >= 6000 && category < 7000) return "XXX";
  if (category >= 8000 && category < 9000) return "Other";

  return "Unknown";
}

