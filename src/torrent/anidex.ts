import axios from "axios";
import { TorrentSearchResult } from "./search.js";

const BASE_URL = "https://anidex.info";
const API_URL = `${BASE_URL}/api/`;

export const searchAniDex = async (
  searchQuery: string
): Promise<TorrentSearchResult[]> => {
  try {
    const searchUrl = `${API_URL}?q=${encodeURIComponent(searchQuery)}`;

    const response = await axios.get(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 10000,
    });

    if (!response.data || !Array.isArray(response.data)) {
      return [];
    }

    const results: TorrentSearchResult[] = response.data.map((item: any) => ({
      name: item.title || item.filename || "Unknown",
      tracker: "AniDex",
      category: "Anime",
      size: parseInt(item.filesize) || 0,
      seeds: parseInt(item.seeders) || 0,
      peers: parseInt(item.leechers) || 0,
      magnet: item.magnet,
      torrent: item.torrent_download_url,
    }));

    return results.filter((r) => r.magnet || r.torrent);
  } catch (error) {
    console.error("AniDex search error:", error);
    return [];
  }
};

