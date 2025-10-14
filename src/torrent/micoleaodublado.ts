import axios from "axios";
import * as cheerio from "cheerio";
import { TorrentSearchResult } from "./search.js";

const BASE_URL = "https://micoleaodublado.com";

export const searchMicoLeaoDublado = async (
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

    $("article.item").each((_, element) => {
      try {
        const name = $(element).find(".data h3 a").text().trim();
        const link = $(element).find(".data h3 a").attr("href");
        const quality = $(element).find(".quality").text().trim();

        if (!name || !link) return;

        results.push({
          name: `${name} ${quality}`,
          tracker: "MicoLeaoDublado",
          category: "Movies/TV (Portuguese Dubbed)",
          size: 0,
          seeds: 15,
          peers: 0,
          torrent: link,
        });
      } catch (error) {}
    });

    return results;
  } catch (error) {
    console.error("MicoLeaoDublado search error:", error);
    return [];
  }
};

