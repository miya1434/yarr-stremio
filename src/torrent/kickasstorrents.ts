import axios from "axios";
import * as cheerio from "cheerio";
import { TorrentSearchResult } from "./search.js";

// KAT proxies/clones
const KAT_PROXIES = [
  "https://kickasstorrents.to",
  "https://kat.am",
  "https://katcr.to",
  "https://kickass.sx",
];

export const searchKickassTorrents = async (
  searchQuery: string
): Promise<TorrentSearchResult[]> => {
  for (const baseUrl of KAT_PROXIES) {
    try {
      const results = await searchWithProxy(baseUrl, searchQuery);
      if (results.length > 0) return results;
    } catch (error) {
      continue; // Try next proxy
    }
  }
  return [];
};

const searchWithProxy = async (
  baseUrl: string,
  searchQuery: string
): Promise<TorrentSearchResult[]> => {
  try {
    const searchUrl = `${baseUrl}/usearch/${encodeURIComponent(searchQuery)}`;

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
        const name = $(element).find(".cellMainLink").text().trim();
        const magnetLink = $(element)
          .find('a[href^="magnet:"]')
          .attr("href");
        const categoryText = $(element)
          .find(".cellMainLink")
          .closest("td")
          .prev()
          .text()
          .trim();

        const sizeText = $(element).find(".nobr").first().text().trim();
        const seedsText = $(element).find("td.green").text().trim();
        const leechText = $(element).find("td.red").text().trim();

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
          tracker: "KickassTorrents",
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
    throw error;
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

