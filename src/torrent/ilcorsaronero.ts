import axios from "axios";
import * as cheerio from "cheerio";
import { TorrentSearchResult } from "./search.js";

const BASE_URL = "https://ilcorsaronero.pro";

export const searchIlCorSaRoNeRo = async (
  searchQuery: string
): Promise<TorrentSearchResult[]> => {
  try {
    const searchUrl = `${BASE_URL}/argh.php?search=${encodeURIComponent(searchQuery)}`;

    const response = await axios.get(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const results: TorrentSearchResult[] = [];

    $(".odd, .even").each((_, element) => {
      try {
        const name = $(element).find(".torrents_name a").text().trim();
        const magnetLink = $(element).find('a[href^="magnet:"]').attr("href");
        
        const sizeText = $(element).find(".torrents_size").text().trim();
        const seedsText = $(element).find(".torrents_seeds").text().trim();
        const leechText = $(element).find(".torrents_leech").text().trim();

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
          tracker: "ilCorSaRoNeRo",
          category: "Movies/TV (Italian)",
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
    console.error("ilCorSaRoNeRo search error:", error);
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

