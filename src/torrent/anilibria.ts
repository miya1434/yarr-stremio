import axios from "axios";
import { TorrentSearchResult } from "./search.js";

const API_URL = "https://api.anilibria.tv/v3/title/search";

export const searchAniLibria = async (
  searchQuery: string
): Promise<TorrentSearchResult[]> => {
  try {
    const response = await axios.get(API_URL, {
      params: {
        search: searchQuery,
        limit: 20,
      },
      timeout: 10000,
    });

    if (!response.data || !response.data.list) return [];

    const results: TorrentSearchResult[] = [];

    for (const item of response.data.list) {
      if (!item.torrents) continue;

      for (const torrent of item.torrents.list) {
        const quality = torrent.quality?.string || "Unknown";
        
        results.push({
          name: `${item.names.ru} - ${torrent.series.string} [${quality}]`,
          tracker: "AniLibria",
          category: "Anime (Russian)",
          size: torrent.total_size || 0,
          seeds: torrent.seeders || 0,
          peers: torrent.leechers || 0,
          torrent: `https://www.anilibria.tv${torrent.url}`,
        });
      }
    }

    return results;
  } catch (error) {
    console.error("AniLibria search error:", error);
    return [];
  }
};

