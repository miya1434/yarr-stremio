import axios from "axios";
import * as cheerio from "cheerio";
import { TorrentSearchResult } from "./search.js";

const BASE_URL = "https://www.torrent9.red";

export const searchTorrent9 = async (
  searchQuery: string
): Promise<TorrentSearchResult[]> => {
  try {
    const searchUrl = `${BASE_URL}/search_torrent/${encodeURIComponent(searchQuery)}.html`;

    const response = await axios.get(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const results: TorrentSearchResult[] = [];

    $("table.table-striped tbody tr").each((_, element) => {
      try {
        const name = $(element).find("td:nth-child(1) a").text().trim();
        const torrentLink = $(element).find("td:nth-child(1) a").attr("href");
        
        const sizeText = $(element).find("td:nth-child(2)").text().trim();
        const seedsText = $(element).find("td:nth-child(3)").text().trim();
        const leechText = $(element).find("td:nth-child(4)").text().trim();

        if (!name || !torrentLink) return;

        const seeds = parseInt(seedsText) || 0;
        const peers = parseInt(leechText) || 0;

        // Parse size
        const sizeMatch = sizeText.match(/([0-9.]+)\s*([KMGT]o)/i);
        const size = sizeMatch
          ? parseSizeToBytes(sizeMatch[1], sizeMatch[2].replace('o', 'B'))
          : 0;

        results.push({
          name,
          tracker: "Torrent9",
          category: "Movies/TV (French)",
          size,
          seeds,
          peers,
          torrent: `${BASE_URL}${torrentLink}`,
        });
      } catch (error) {
        // Skip malformed entries
      }
    });

    return results;
  } catch (error) {
    console.error("Torrent9 search error:", error);
    return [];
  }
};

const parseSizeToBytes = (sizeStr: string, unit: string): number => {
  const size = parseFloat(sizeStr);
  if (isNaN(size)) return 0;

  const units: Record<string, number> = {
    TB: 1024 ** 4,
    GB: 1024 ** 3,
    MB: 1024 ** 2,
    KB: 1024,
    B: 1,
  };

  return Math.ceil(size * (units[unit.toUpperCase()] || 0));
};

