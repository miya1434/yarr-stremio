import axios from "axios";
import * as cheerio from "cheerio";
import { TorrentSearchResult } from "./search.js";

const BASE_URL = "https://horriblesubs.info";

export const searchHorribleSubs = async (
  searchQuery: string
): Promise<TorrentSearchResult[]> => {
  try {
    const searchUrl = `${BASE_URL}/lib/search.php?value=${encodeURIComponent(searchQuery)}`;

    const response = await axios.get(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const results: TorrentSearchResult[] = [];

    $(".episode").each((_, element) => {
      try {
        const name = $(element).find(".episode-title").text().trim();
        const magnetLink = $(element).find('a[href^="magnet:"]').attr("href");
        
        const quality = $(element).find(".quality").text().trim();

        if (!name || !magnetLink) return;

        results.push({
          name: `${name} ${quality}`,
          tracker: "HorribleSubs",
          category: "Anime",
          size: 0,
          seeds: 10,
          peers: 0,
          magnet: magnetLink,
        });
      } catch (error) {}
    });

    return results;
  } catch (error) {
    console.error("HorribleSubs search error:", error);
    return [];
  }
};

