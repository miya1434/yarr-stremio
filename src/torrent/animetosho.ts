import axios from "axios";
import * as cheerio from "cheerio";
import { TorrentSearchResult } from "./search.js";

const BASE_URL = "https://animetosho.org";

export const searchAnimeTosho = async (
  searchQuery: string
): Promise<TorrentSearchResult[]> => {
  try {
    const searchUrl = `${BASE_URL}/search?q=${encodeURIComponent(searchQuery).replace(/%20/g, '+')}`;

    const response = await axios.get(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const results: TorrentSearchResult[] = [];

    $(".home_list_entry").each((_, element) => {
      try {
        const $entry = $(element);
        
        const name = $entry.find(".link a").text().trim();
        const magnetLink = $entry.find('a[href^="magnet:"]').attr("href");
        
        if (!name || !magnetLink) return;

        const sizeElem = $entry.find(".size");
        const sizeText = sizeElem.text().trim();
        const sizeTitle = sizeElem.attr("title") || "";
        
        let size = 0;
        const sizeMatch = sizeText.match(/([0-9.]+)\s*([KMGT]B)/i);
        if (sizeMatch) {
          size = parseSizeToBytes(sizeMatch[1], sizeMatch[2]);
        } else {
          const bytesMatch = sizeTitle.match(/([0-9,]+)\s*bytes/i);
          if (bytesMatch) {
            size = parseInt(bytesMatch[1].replace(/,/g, ""));
          }
        }

        const linksText = $entry.find(".links").text();
        const seedPeerMatch = linksText.match(/\[(\d+)↑\/(\d+)↓\]/);
        
        const seeds = seedPeerMatch ? parseInt(seedPeerMatch[1]) : 15;
        const peers = seedPeerMatch ? parseInt(seedPeerMatch[2]) : 5;

        const hash = magnetLink.match(/btih:([a-f0-9]{40})/i)?.[1];

        results.push({
          name,
          tracker: "AnimeTosho",
          category: "Anime",
          size,
          seeds,
          peers,
          magnet: magnetLink,
          infohash: hash?.toLowerCase(),
        });
      } catch (error) {
        
      }
    });

    return results;
  } catch (error) {
    console.error("AnimeTosho search error:", error);
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

