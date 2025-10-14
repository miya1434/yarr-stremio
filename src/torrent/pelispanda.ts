import axios from "axios";
import * as cheerio from "cheerio";
import { TorrentSearchResult } from "./search.js";

const BASE_URL = "https://pelispanda.org";

export const searchPelisPanda = async (
  searchQuery: string
): Promise<TorrentSearchResult[]> => {
  try {
    const searchUrl = `${BASE_URL}/search?query=${encodeURIComponent(searchQuery)}`;

    const response = await axios.get(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const results: TorrentSearchResult[] = [];

    $('a[href*="/pelicula/"], a[href*="/serie/"]').each((_, element) => {
      try {
        const name = $(element).find("h3").text().trim();
        const detailLink = $(element).attr("href");

        if (!name || !detailLink) return;

        results.push({
          name,
          tracker: "PelisPanda",
          category: "Movies/TV (Latino)",
          size: 0,
          seeds: 15,
          peers: 5,
          torrent: `${BASE_URL}${detailLink}`,
        });
      } catch (error) {
        
      }
    });

    return results;
  } catch (error) {
    console.error("PelisPanda search error:", error);
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

