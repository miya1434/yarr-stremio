import axios from "axios";
import * as cheerio from "cheerio";
import { TorrentSearchResult } from "./search.js";

const BASE_URL = "https://www.torlock.com";

export const searchTorLock = async (
  searchQuery: string
): Promise<TorrentSearchResult[]> => {
  try {
    const searchUrl = `${BASE_URL}/all/torrents/${encodeURIComponent(searchQuery).replace(/%20/g, '+')}.html`;

    const response = await axios.get(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const results: TorrentSearchResult[] = [];
    const limit = 10;
    let count = 0;

    for (const element of $("table tbody tr").toArray()) {
      if (count >= limit) break;
      
      try {
        const $row = $(element);
        const nameLink = $row.find("td:nth-child(1) a").first();
        const name = nameLink.text().trim();
        const detailPath = nameLink.attr("href");
        
        if (!name || !detailPath) continue;

        const sizeText = $row.find("td:nth-child(3)").text().trim();
        const seedsText = $row.find("td:nth-child(4)").text().trim();
        const peersText = $row.find("td:nth-child(5)").text().trim();

        const seeds = parseInt(seedsText.replace(/,/g, "")) || 0;
        const peers = parseInt(peersText.replace(/,/g, "")) || 0;

        const sizeMatch = sizeText.match(/([0-9.]+)\s*([KMGT]B)/i);
        const size = sizeMatch ? parseSizeToBytes(sizeMatch[1], sizeMatch[2]) : 0;

        const detailUrl = detailPath.startsWith('http') ? detailPath : `${BASE_URL}${detailPath}`;
        
        const detailResponse = await axios.get(detailUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
          timeout: 10000,
        });

        const $detail = cheerio.load(detailResponse.data);
        const magnetLink = $detail('a[href^="magnet:"]').attr("href");

        if (!magnetLink) continue;

        const hash = magnetLink.match(/btih:([a-f0-9]{40})/i)?.[1];

        results.push({
          name,
          tracker: "TorLock",
          category: "Movies/TV",
          size,
          seeds,
          peers,
          magnet: magnetLink,
          infohash: hash?.toLowerCase(),
        });
        
        count++;
      } catch (error) {
        
      }
    }

    return results;
  } catch (error) {
    console.error("TorLock search error:", error);
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

