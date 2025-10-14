import axios from "axios";
import { TorrentSearchResult } from "./search.js";

const API_URL = "https://api.subsplease.org/api/?f=search&tz=UTC&s=";

export const searchSubsPlease = async (
  searchQuery: string
): Promise<TorrentSearchResult[]> => {
  try {
    const response = await axios.get(`${API_URL}${encodeURIComponent(searchQuery)}`, {
      timeout: 10000,
    });

    if (!response.data) return [];

    const results: TorrentSearchResult[] = [];

    for (const item of Object.values(response.data) as any[]) {
      if (!item.downloads) continue;

      for (const download of Object.values(item.downloads) as any[]) {
        if (download.magnet) {
          results.push({
            name: `${item.show} - ${item.episode} [${download.res}p]`,
            tracker: "SubsPlease",
            category: "Anime",
            size: parseInt(download.size) || 0,
            seeds: 15,
            peers: 0,
            magnet: download.magnet,
          });
        }
      }
    }

    return results;
  } catch (error) {
    console.error("SubsPlease search error:", error);
    return [];
  }
};

