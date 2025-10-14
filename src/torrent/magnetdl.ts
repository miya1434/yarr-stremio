import axios from "axios";
import * as cheerio from "cheerio";
import { TorrentSearchResult } from "./search.js";

const BASE_URL = "https://www.magnetdl.com";

export const searchMagnetDL = async (
  searchQuery: string
): Promise<TorrentSearchResult[]> => {
  try {
    // MagnetDL uses first letter for search path
    const firstChar = searchQuery.charAt(0).toLowerCase();
    const searchUrl = `${BASE_URL}/${firstChar}/${encodeURIComponent(searchQuery)}`;

    const response = await axios.get(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const results: TorrentSearchResult[] = [];

    $("tr.odd, tr.even").each((_, element) => {
      try {
        const name = $(element).find("td:nth-child(2) a").text().trim();
        const magnetLink = $(element).find('a[href^="magnet:"]').attr("href");

        const sizeText = $(element).find("td:nth-child(6)").text().trim();
        const ageText = $(element).find("td:nth-child(3)").text().trim();

        // MagnetDL doesn't always show seeders/leechers, estimate by age
        let seeds = 0;
        if (ageText.includes("day")) seeds = 50;
        else if (ageText.includes("week")) seeds = 20;
        else if (ageText.includes("month")) seeds = 10;
        else if (ageText.includes("year")) seeds = 5;

        // Parse size
        const sizeMatch = sizeText.match(/([0-9.]+)\s*([KMGT]B)/i);
        const size = sizeMatch
          ? parseSizeToBytes(sizeMatch[1], sizeMatch[2])
          : 0;

        if (!name || !magnetLink) return;

        results.push({
          name,
          tracker: "MagnetDL",
          category: "Movies/TV",
          size,
          seeds,
          peers: 0,
          magnet: magnetLink,
        });
      } catch (error) {
        // Skip malformed entries
      }
    });

    return results;
  } catch (error) {
    console.error("MagnetDL search error:", error);
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

