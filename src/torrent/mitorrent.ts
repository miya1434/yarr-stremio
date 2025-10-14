import axios from "axios";
import * as cheerio from "cheerio";
import { TorrentSearchResult } from "./search.js";

const BASE_URL = "https://www.mitorrent.mx";

export const searchMiTorrent = async (
  searchQuery: string
): Promise<TorrentSearchResult[]> => {
  try {
    const searchUrl = `${BASE_URL}/buscar/?q=${encodeURIComponent(searchQuery)}`;

    const response = await axios.get(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const results: TorrentSearchResult[] = [];

    $("article.item, .entry, .post").each((_, element) => {
      try {
        const name = $(element).find(".title, h2, h3").first().text().trim();
        const magnetLink = $(element).find('a[href^="magnet:"]').attr("href");
        const sizeText = $(element).find(".size, .filesize").text().trim();
        const seedsText = $(element).find(".seeders, .seeds").text().trim();

        if (!name || !magnetLink) return;

        const seeds = parseInt(seedsText) || 10;
        
        const sizeMatch = sizeText.match(/([0-9.]+)\s*([KMGT]B)/i);
        const size = sizeMatch
          ? parseSizeToBytes(sizeMatch[1], sizeMatch[2])
          : 0;

        const hash = magnetLink.match(/btih:([a-f0-9]{40})/i)?.[1];

        results.push({
          name,
          tracker: "MiTorrent",
          category: "Movies/TV (Latino)",
          size,
          seeds,
          peers: Math.floor(seeds / 3),
          magnet: magnetLink,
          infohash: hash?.toLowerCase(),
        });
      } catch (error) {
        
      }
    });

    return results;
  } catch (error) {
    console.error("MiTorrent search error:", error);
    return [];
  }
};

function parseSizeToBytes(value: string, unit: string): number {
  const size = parseFloat(value);
  const units: Record<string, number> = {
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024,
    TB: 1024 * 1024 * 1024 * 1024,
  };
  return Math.floor(size * (units[unit.toUpperCase()] || 1));
}

