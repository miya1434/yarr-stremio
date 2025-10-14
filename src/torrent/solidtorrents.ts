import axios from "axios";
import * as cheerio from "cheerio";
import { TorrentSearchResult } from "./search.js";

const BASE_URL = "https://solidtorrents.to";

export const searchSolidTorrents = async (
  searchQuery: string
): Promise<TorrentSearchResult[]> => {
  try {
    const searchUrl = `${BASE_URL}/search?q=${encodeURIComponent(searchQuery)}`;

    const response = await axios.get(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const results: TorrentSearchResult[] = [];

    $("div.grid.grid-cols-1.gap-4 > div").each((_, element) => {
      try {
        const name = $(element).find("a.text-lg.font-semibold.text-blue-600.dark\\:text-blue-400").text().trim();
        const magnetLink = $(element).find('a[href^="magnet:"]').attr("href");
        
        const sizeText = $(element).find("div.text-sm.text-gray-500.dark\\:text-gray-400 > span:nth-child(2)").text().trim();
        const seedsText = $(element).find("div.text-sm.text-gray-500.dark\\:text-gray-400 > span:nth-child(1)").text().trim();

        if (!name || !magnetLink) return;

        const seeds = parseInt(seedsText.replace(/\D/g, "")) || 10;
        const sizeMatch = sizeText.match(/([0-9.]+)\s*([KMGT]B)/i);
        const size = sizeMatch ? parseSizeToBytes(sizeMatch[1], sizeMatch[2]) : 0;

        const hash = magnetLink.match(/btih:([a-f0-9]{40})/i)?.[1];

        results.push({
          name,
          tracker: "SolidTorrents",
          category: "Movies/TV",
          size,
          seeds,
          peers: Math.floor(seeds / 3),
          magnet: magnetLink,
          infohash: hash?.toLowerCase(),
        });
      } catch (error) {}
    });

    return results;
  } catch (error) {
    console.error("SolidTorrents search error:", error);
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
  };
  return Math.ceil(size * (units[unit.toUpperCase()] || 0));
};

