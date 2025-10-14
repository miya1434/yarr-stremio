import axios from "axios";
import * as cheerio from "cheerio";
import { TorrentSearchResult } from "./search.js";
import { isImdbId } from "../utils/imdb.js";

const BASE_URL = "https://1337x.to";
const SEARCH_URL = `${BASE_URL}/search`;
const TORRENT_URL = `${BASE_URL}/torrent`;

export const search1337x = async (
  searchQuery: string
): Promise<TorrentSearchResult[]> => {
  try {
    const query = isImdbId(searchQuery) ? searchQuery : searchQuery;
    const searchUrl = `${SEARCH_URL}/${encodeURIComponent(query)}/1/`;

    const response = await axios.get(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Referer": "https://1337x.to/",
        "Sec-Ch-Ua": '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"Windows"',
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "same-origin",
        "Upgrade-Insecure-Requests": "1",
      },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);
    const results: TorrentSearchResult[] = [];

    $("tbody tr").each((_, element) => {
      try {
        const name = $(element).find(".name a:nth-child(2)").text().trim();
        const torrentLink = $(element).find(".name a:nth-child(2)").attr("href");
        const seedsText = $(element).find(".seeds").text().trim();
        const leechText = $(element).find(".leeches").text().trim();
        const sizeText = $(element).find(".size").text().split(" ");

        if (!name || !torrentLink) return;

        const seeds = parseInt(seedsText) || 0;
        const peers = parseInt(leechText) || 0;
        const size = parseSizeToBytes(sizeText[0], sizeText[1]);

        results.push({
          name,
          tracker: "1337x",
          category: "Movies",
          size,
          seeds,
          peers,
          // Note: 1337x requires visiting individual torrent page for magnet link
          // We'll store the torrent page URL here
          torrent: `${BASE_URL}${torrentLink}`,
        });
      } catch (error) {
        // Skip malformed entries
      }
    });

    // Fetch magnet links for top results (to avoid rate limiting)
    const topResults = results.slice(0, 10);
    await Promise.all(
      topResults.map(async (result) => {
        try {
          const torrentPage = await axios.get(result.torrent!, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
              "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
              "Accept-Language": "en-US,en;q=0.9",
              "Referer": searchUrl,
              "Sec-Fetch-Dest": "document",
              "Sec-Fetch-Mode": "navigate",
            },
            timeout: 10000,
          });

          const $torrent = cheerio.load(torrentPage.data);
          const magnetLink = $torrent('a[href^="magnet:"]').attr("href");

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
    console.error("1337x search error:", error);
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

