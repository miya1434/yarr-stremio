import axios from "axios";
import * as cheerio from "cheerio";
import { TorrentSearchResult } from "./search.js";

const BASE_URL = "https://www.torrentdownloads.pro";

export const searchTorrentDownloads = async (
  searchQuery: string
): Promise<TorrentSearchResult[]> => {
  try {
    const searchUrl = `${BASE_URL}/search/?search=${encodeURIComponent(searchQuery)}`;

    const response = await axios.get(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const results: TorrentSearchResult[] = [];

    $("table tbody tr").each((_, element) => {
      try {
        const name = $(element).find("td:nth-child(1) a").text().trim();
        const torrentLink = $(element).find("td:nth-child(1) a").attr("href");
        
        const sizeText = $(element).find("td:nth-child(2)").text().trim();
        const seedsText = $(element).find("td:nth-child(4)").text().trim();
        const leechText = $(element).find("td:nth-child(5)").text().trim();

        if (!name || !torrentLink) return;

        const seeds = parseInt(seedsText.replace(/,/g, "")) || 0;
        const peers = parseInt(leechText.replace(/,/g, "")) || 0;

        const sizeMatch = sizeText.match(/([0-9.]+)\s*([KMGT]B)/i);
        const size = sizeMatch ? parseSizeToBytes(sizeMatch[1], sizeMatch[2]) : 0;

        results.push({
          name,
          tracker: "TorrentDownloads",
          category: "Movies/TV",
          size,
          seeds,
          peers,
          torrent: `${BASE_URL}${torrentLink}`,
        });
      } catch (error) {}
    });

    return results;
  } catch (error) {
    console.error("TorrentDownloads search error:", error);
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

