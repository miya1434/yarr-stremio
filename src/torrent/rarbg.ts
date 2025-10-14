import axios from "axios";
import * as cheerio from "cheerio";
import { TorrentSearchResult } from "./search.js";
import { isImdbId } from "../utils/imdb.js";

// RARBG proxies since the original site is down
const RARBG_PROXIES = [
  "https://rarbg.to",
  "https://rarbgprx.org",
  "https://rarbggo.to",
  "https://rarbgaccess.org",
];

export const searchRarbg = async (
  searchQuery: string
): Promise<TorrentSearchResult[]> => {
  for (const baseUrl of RARBG_PROXIES) {
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
    let searchUrl: string;

    if (isImdbId(searchQuery)) {
      searchUrl = `${baseUrl}/torrents.php?imdb=${searchQuery}`;
    } else {
      searchUrl = `${baseUrl}/torrents.php?search=${encodeURIComponent(searchQuery)}`;
    }

    const response = await axios.get(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const results: TorrentSearchResult[] = [];

    $("tr.lista2").each((_, element) => {
      try {
        const name = $(element).find("td:nth-child(2) a").text().trim();
        const torrentLink = $(element).find("td:nth-child(2) a").attr("href");
        const category = $(element).find("td:nth-child(1) a").text().trim();
        const sizeText = $(element).find("td:nth-child(4)").text().trim();
        const seedsText = $(element).find("td:nth-child(5)").text().trim();
        const leechText = $(element).find("td:nth-child(6)").text().trim();

        if (!name || !torrentLink) return;

        const seeds = parseInt(seedsText) || 0;
        const peers = parseInt(leechText) || 0;

        // Parse size
        const sizeMatch = sizeText.match(/([0-9.]+)\s*([KMGT]B)/i);
        const size = sizeMatch
          ? parseSizeToBytes(sizeMatch[1], sizeMatch[2])
          : 0;

        results.push({
          name,
          tracker: "RARBG",
          category,
          size,
          seeds,
          peers,
          torrent: `${baseUrl}${torrentLink}`,
        });
      } catch (error) {
        // Skip malformed entries
      }
    });

    // Fetch magnet links for top results
    const topResults = results.slice(0, 10);
    await Promise.all(
      topResults.map(async (result) => {
        try {
          const torrentPage = await axios.get(result.torrent!, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
            timeout: 5000,
          });

          const $torrent = cheerio.load(torrentPage.data);
          const magnetLink = $torrent('a[href^="magnet:"]').first().attr("href");

          if (magnetLink) {
            result.magnet = magnetLink;
          }
        } catch (error) {
          // Skip if can't get magnet link
        }
      })
    );

    return topResults.filter((r) => r.magnet);
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

