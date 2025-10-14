import axios from "axios";
import * as cheerio from "cheerio";
import { TorrentSearchResult } from "./search.js";

const BASE_URL = "https://www.cinecalidad.mx";

export const searchCinecalidad = async (
  searchQuery: string
): Promise<TorrentSearchResult[]> => {
  try {
    const searchUrl = `${BASE_URL}/?s=${encodeURIComponent(searchQuery)}`;

    const response = await axios.get(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const results: TorrentSearchResult[] = [];

    $(".item.movies, .item.tvshows").each((_, element) => {
      try {
        const name = $(element).find(".data h3 a").text().trim();
        const link = $(element).find(".data h3 a").attr("href");
        const quality = $(element).find(".quality").text().trim();

        if (!name || !link) return;

        // Cinecalidad requires visiting individual pages for magnet links
        // For now, we'll store the page link
        results.push({
          name: `${name} ${quality}`,
          tracker: "Cinecalidad",
          category: "Movies/Latino",
          size: 0,
          seeds: 10, // Estimate
          peers: 0,
          torrent: link,
        });
      } catch (error) {
        // Skip malformed entries
      }
    });

    return results;
  } catch (error) {
    console.error("Cinecalidad search error:", error);
    return [];
  }
};

