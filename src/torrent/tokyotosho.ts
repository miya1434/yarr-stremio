import axios from "axios";
import { TorrentSearchResult } from "./search.js";

const BASE_URL = "https://www.tokyotosho.info";
const SEARCH_URL = `${BASE_URL}/search.php`;

export const searchTokyoTosho = async (
  searchQuery: string
): Promise<TorrentSearchResult[]> => {
  try {
    const searchUrl = `${SEARCH_URL}?terms=${encodeURIComponent(searchQuery)}&type=1`;

    const response = await axios.get(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 10000,
    });

    // TokyoTosho returns RSS-like format
    const results: TorrentSearchResult[] = [];

    // Simple parsing of TokyoTosho HTML
    const lines = response.data.split("\n");
    let currentTorrent: any = {};

    for (const line of lines) {
      if (line.includes("class=\"name\"")) {
        const nameMatch = line.match(/>([^<]+)</);
        if (nameMatch) currentTorrent.name = nameMatch[1].trim();
      }

      if (line.includes("magnet:?")) {
        const magnetMatch = line.match(/href="(magnet:[^"]+)"/);
        if (magnetMatch) {
          currentTorrent.magnet = magnetMatch[1];

          if (currentTorrent.name) {
            results.push({
              name: currentTorrent.name,
              tracker: "TokyoTosho",
              category: "Anime",
              size: 0,
              seeds: 0,
              peers: 0,
              magnet: currentTorrent.magnet,
            });
          }

          currentTorrent = {};
        }
      }
    }

    return results;
  } catch (error) {
    console.error("TokyoTosho search error:", error);
    return [];
  }
};

