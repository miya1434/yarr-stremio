import axios from "axios";
import rssParser from "rss-to-json";
import { TorrentSearchResult } from "./search.js";

const { parse } = rssParser;

const NYAA_BASE = "https://nyaa.si";
const NYAA_RSS = `${NYAA_BASE}/?page=rss&q=`;

export const searchNyaaSi = async (
  searchQuery: string
): Promise<TorrentSearchResult[]> => {
  try {
    const rssUrl = `${NYAA_RSS}${encodeURIComponent(searchQuery)}`;

    const feed = await parse(rssUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!feed || !feed.items) return [];

    const results: TorrentSearchResult[] = feed.items.map((item: any) => {
      const title = item.title || "";
      const magnetMatch = item.link?.match(/magnet:\?[^"]+/) || [];
      const magnet = magnetMatch[0] || "";

      // Parse seeders/leechers from description
      const description = item.description || "";
      const seedsMatch = description.match(/Seeders:\s*(\d+)/);
      const leechMatch = description.match(/Leechers:\s*(\d+)/);
      const sizeMatch = description.match(/Size:\s*([0-9.]+)\s*([KMGT]iB)/);

      const seeds = seedsMatch ? parseInt(seedsMatch[1]) : 0;
      const peers = leechMatch ? parseInt(leechMatch[1]) : 0;
      const size = sizeMatch
        ? parseSizeToBytes(sizeMatch[1], sizeMatch[2])
        : 0;

      return {
        name: title,
        tracker: "NyaaSi",
        category: item.category || "Anime",
        size,
        seeds,
        peers,
        magnet,
        torrent: item.link,
      };
    });

    return results.filter((r) => r.magnet);
  } catch (error) {
    console.error("NyaaSi search error:", error);
    return [];
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

