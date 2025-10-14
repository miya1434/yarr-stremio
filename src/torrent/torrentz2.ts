import axios from "axios";
import * as cheerio from "cheerio";
import { TorrentSearchResult } from "./search.js";

const BASE_URL = "https://torrentz2eu.org";

export const searchTorrentz2 = async (
  searchQuery: string
): Promise<TorrentSearchResult[]> => {
  try {
    const searchUrl = `${BASE_URL}/search?f=${encodeURIComponent(searchQuery)}`;

    const response = await axios.get(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const results: TorrentSearchResult[] = [];

    $("dl").each((_, element) => {
      try {
        const name = $(element).find("dt a").text().trim();
        const hash = $(element).find("dt a").attr("href")?.replace("/", "");
        
        const seedsText = $(element).find("dd span:nth-child(4)").text().trim();
        const sizeText = $(element).find("dd span:nth-child(3)").text().trim();

        if (!name || !hash) return;

        const seeds = parseInt(seedsText.replace(/,/g, "")) || 0;

        const sizeMatch = sizeText.match(/([0-9.]+)\s*([KMGT]B)/i);
        const size = sizeMatch ? parseSizeToBytes(sizeMatch[1], sizeMatch[2]) : 0;

        const magnet = `magnet:?xt=urn:btih:${hash}&dn=${encodeURIComponent(name)}`;

        results.push({
          name,
          tracker: "Torrentz2",
          category: "Meta-search",
          size,
          seeds,
          peers: 0,
          magnet,
        });
      } catch (error) {}
    });

    return results;
  } catch (error) {
    console.error("Torrentz2 search error:", error);
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

