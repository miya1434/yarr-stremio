import axios from "axios";
import * as cheerio from "cheerio";
import { TorrentSearchResult } from "./search.js";

const BASE_URL = "https://www1.mejortorrent.rip";

export const searchMejorTorrent = async (
  searchQuery: string
): Promise<TorrentSearchResult[]> => {
  try {
    const searchUrl = `${BASE_URL}/buscar/${encodeURIComponent(searchQuery)}`;

    const response = await axios.get(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const results: TorrentSearchResult[] = [];

    $(".list-search-result .item-search").each((_, element) => {
      try {
        const name = $(element).find(".title-search a").text().trim();
        const torrentLink = $(element).find(".title-search a").attr("href");
        
        const quality = $(element).find(".calidad").text().trim();
        const sizeText = $(element).find(".size").text().trim();

        if (!name || !torrentLink) return;

        // Parse size
        const sizeMatch = sizeText.match(/([0-9.]+)\s*([KMGT]B)/i);
        const size = sizeMatch
          ? parseSizeToBytes(sizeMatch[1], sizeMatch[2])
          : 0;

        results.push({
          name: `${name} ${quality}`,
          tracker: "MejorTorrent",
          category: "Movies/TV (Spanish)",
          size,
          seeds: 10, // Estimate
          peers: 0,
          torrent: `${BASE_URL}${torrentLink}`,
        });
      } catch (error) {
        // Skip malformed entries
      }
    });

    return results;
  } catch (error) {
    console.error("MejorTorrent search error:", error);
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

