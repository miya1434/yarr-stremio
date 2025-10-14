import axios from "axios";
import * as cheerio from "cheerio";
import { TorrentSearchResult } from "./search.js";

const YIFY_PROXIES = [
  "https://yts.mx",
  "https://yts.am",
  "https://yts.lt",
];

export const searchYIFY = async (
  searchQuery: string
): Promise<TorrentSearchResult[]> => {
  for (const baseUrl of YIFY_PROXIES) {
    try {
      const results = await searchWithProxy(baseUrl, searchQuery);
      if (results.length > 0) return results;
    } catch (error) {
      continue;
    }
  }
  return [];
};

const searchWithProxy = async (
  baseUrl: string,
  searchQuery: string
): Promise<TorrentSearchResult[]> => {
  try {
    const searchUrl = `${baseUrl}/browse-movies/${encodeURIComponent(searchQuery)}/all/all/0/latest`;

    const response = await axios.get(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const results: TorrentSearchResult[] = [];

    $(".browse-movie-wrap").each((_, element) => {
      try {
        const title = $(element).find(".browse-movie-title").text().trim();
        const year = $(element).find(".browse-movie-year").text().trim();
        const detailLink = $(element).find(".browse-movie-link").attr("href");

        if (!title || !detailLink) return;

        // YIFY requires visiting movie page for torrents, so we store the link
        results.push({
          name: `${title} ${year}`,
          tracker: "YIFY",
          category: "Movies",
          size: 0,
          seeds: 50, // Estimate
          peers: 10,
          torrent: detailLink,
        });
      } catch (error) {}
    });

    return results;
  } catch (error) {
    throw error;
  }
};

