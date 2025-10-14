import axios from "axios";
import * as cheerio from "cheerio";
import { TorrentSearchResult } from "./search.js";
import { isImdbId } from "../utils/imdb.js";

// TPB proxies - rotate if one fails
const TPB_PROXIES = [
  "https://thepiratebay.org",
  "https://tpb.party",
  "https://thepiratebay0.org",
  "https://thepiratebay10.org",
];

export const searchThePirateBay = async (
  searchQuery: string
): Promise<TorrentSearchResult[]> => {
  for (const baseUrl of TPB_PROXIES) {
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
    const query = isImdbId(searchQuery) ? searchQuery : searchQuery;
    const searchUrl = `${baseUrl}/search/${encodeURIComponent(query)}/1/99/0`;

    const response = await axios.get(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const results: TorrentSearchResult[] = [];

    $("#searchResult tbody tr").each((_, element) => {
      try {
        const name = $(element).find(".detName a").text().trim();
        const magnetLink = $(element).find('a[href^="magnet:"]').attr("href");
        const categoryText = $(element).find("td.vertTh a").first().text();

        // Parse seeds/leeches from the last td
        const seedLeechText = $(element).find("td").last().text();
        const [seedsText, leechText] = seedLeechText.split(",");
        const seeds = parseInt(seedsText) || 0;
        const peers = parseInt(leechText) || 0;

        // Parse size from description
        const descText = $(element).find(".detDesc").text();
        const sizeMatch = descText.match(/Size\s+([0-9.]+)\s*([KMG]iB)/i);

        let size = 0;
        if (sizeMatch) {
          size = parseSizeToBytes(sizeMatch[1], sizeMatch[2]);
        }

        if (!name || !magnetLink) return;

        results.push({
          name,
          tracker: "ThePirateBay",
          category: categoryText || "Unknown",
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
    TIB: 1024 ** 4,
    GIB: 1024 ** 3,
    MIB: 1024 ** 2,
    KIB: 1024,
  };

  return Math.ceil(size * (units[unit.toUpperCase()] || 0));
};

