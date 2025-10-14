import axios from "axios";
import * as cheerio from "cheerio";
import { TorrentSearchResult } from "./search.js";

const BASE_URL = "https://torrentgalaxy.to";

export const searchTorrentGalaxy = async (
  searchQuery: string
): Promise<TorrentSearchResult[]> => {
  try {
    const searchUrl = `${BASE_URL}/torrents.php?search=${encodeURIComponent(searchQuery)}`;

    const response = await axios.get(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const results: TorrentSearchResult[] = [];

    $(".tgxtablerow").each((_, element) => {
      try {
        const name = $(element).find(".txlight a").first().text().trim();
        const magnetLink = $(element)
          .find('a[href^="magnet:"]')
          .attr("href");
        const categoryText = $(element)
          .find(".tgxtablecell a")
          .first()
          .text()
          .trim();

        // Parse size, seeders, leechers
        const sizeText = $(element)
          .find(".tgxtablecell:contains('MB'), .tgxtablecell:contains('GB')")
          .text()
          .trim();
        const seedsText = $(element)
          .find(".tgxtablecell font[color='green']")
          .text()
          .trim();
        const leechText = $(element)
          .find(".tgxtablecell font[color='#ff0000']")
          .text()
          .trim();

        const seeds = parseInt(seedsText) || 0;
        const peers = parseInt(leechText) || 0;

        // Parse size
        const sizeMatch = sizeText.match(/([0-9.]+)\s*([KMGT]B)/i);
        const size = sizeMatch
          ? parseSizeToBytes(sizeMatch[1], sizeMatch[2])
          : 0;

        if (!name || !magnetLink) return;

        results.push({
          name,
          tracker: "TorrentGalaxy",
          category: categoryText,
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
    console.error("TorrentGalaxy search error:", error);
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

