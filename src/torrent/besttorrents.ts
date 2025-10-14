import axios from "axios";
import * as cheerio from "cheerio";
import { TorrentSearchResult } from "./search.js";

const BASE_URL = "https://besttorr.com";

export const searchBestTorrents = async (
  searchQuery: string
): Promise<TorrentSearchResult[]> => {
  try {
    const searchUrl = `${BASE_URL}/search/${encodeURIComponent(searchQuery)}`;

    const response = await axios.get(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const results: TorrentSearchResult[] = [];

    $("table.table tr").each((_, element) => {
      try {
        const name = $(element).find("td:nth-child(1) a").text().trim();
        const magnetLink = $(element).find('a[href^="magnet:"]').attr("href");
        
        const sizeText = $(element).find("td:nth-child(2)").text().trim();
        const seedsText = $(element).find("td:nth-child(4)").text().trim();
        const leechText = $(element).find("td:nth-child(5)").text().trim();

        if (!name || !magnetLink) return;

        const seeds = parseInt(seedsText) || 0;
        const peers = parseInt(leechText) || 0;

        // Parse size
        const sizeMatch = sizeText.match(/([0-9.]+)\s*([KMGT]B)/i);
        const size = sizeMatch
          ? parseSizeToBytes(sizeMatch[1], sizeMatch[2])
          : 0;

        results.push({
          name,
          tracker: "BestTorrents",
          category: "Movies/TV (Polish)",
          size,
          seeds,
          peers,
          magnet: magnetLink,
        });
      } catch (error) {
        // Skip malformed entries
      }
    });

    return results;
  } catch (error) {
    console.error("BestTorrents search error:", error);
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

