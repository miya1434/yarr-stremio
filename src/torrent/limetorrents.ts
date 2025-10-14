import axios from "axios";
import * as cheerio from "cheerio";
import { TorrentSearchResult } from "./search.js";

const BASE_URL = "https://www.limetorrents.lol";

export const searchLimeTorrents = async (
  searchQuery: string
): Promise<TorrentSearchResult[]> => {
  try {
    const searchUrl = `${BASE_URL}/search/all/${encodeURIComponent(searchQuery)}/`;

    const response = await axios.get(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const results: TorrentSearchResult[] = [];

    $("table.table2 tr").each((_, element) => {
      try {
        const name = $(element).find(".tt-name a").first().text().trim();
        const torrentLink = $(element).find(".tt-name a").first().attr("href");
        
        const sizeText = $(element).find("td:nth-child(3)").text().trim();
        const seedsText = $(element).find("td.tdseed").text().trim();
        const leechText = $(element).find("td.tdleech").text().trim();

        if (!name || !torrentLink) return;

        const seeds = parseInt(seedsText) || 0;
        const peers = parseInt(leechText) || 0;

        const sizeMatch = sizeText.match(/([0-9.]+)\s*([KMGT]B)/i);
        const size = sizeMatch ? parseSizeToBytes(sizeMatch[1], sizeMatch[2]) : 0;

        results.push({
          name,
          tracker: "LimeTorrents",
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
    console.error("LimeTorrents search error:", error);
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

