import axios from "axios";
import * as cheerio from "cheerio";
import { TorrentSearchResult } from "./search.js";

const BASE_URL = "https://www.elitetorrent.wf";

export const searchEliteTorrent = async (
  searchQuery: string
): Promise<TorrentSearchResult[]> => {
  try {
    const searchUrl = `${BASE_URL}/?s=${encodeURIComponent(searchQuery).replace(/%20/g, '+')}&x=0&y=0`;

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

    const resultItems = $("li").filter((_, el) => $(el).find(".imagen").length > 0);

    for (const element of resultItems.toArray()) {
      if (count >= limit) break;
      
      try {
        const $item = $(element);
        
        const link = $item.find(".imagen a[title]");
        const title = link.attr("title")?.trim();
        const detailUrl = link.attr("href");
        
        if (!title || !detailUrl) continue;

        const qualityMatch = $item.text().match(/(HDRIP|720p|1080p|4k|DVDrip|BRRip|microHD)/i);
        const quality = qualityMatch ? qualityMatch[1] : "";
        
        const sizeMatch = $item.text().match(/(\d+\.?\d*)\s*(GB|MB)s?/i);
        const sizeText = sizeMatch ? sizeMatch[0] : "";

        let language = "Spanish";
        if ($item.find('img[src*="vose.png"]').length) language = "VOSE";
        else if ($item.find('img[src*="castellano.png"]').length) language = "Castellano";
        else if ($item.find('img[src*="latino.png"]').length) language = "Latino";

        const detailResponse = await axios.get(detailUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
          timeout: 10000,
        });

        const $detail = cheerio.load(detailResponse.data);
        
        let magnetLink: string | undefined;
        $detail("a").each((_, el) => {
          const text = $(el).text().trim();
          if (text.includes("Descargar por magnet link")) {
            magnetLink = $(el).attr("href");
            return false;
          }
        });

        if (!magnetLink) continue;

        const detailText = $detail.text();
        const seedsMatch = detailText.match(/Semillas:\s*(\d+)/i);
        const peersMatch = detailText.match(/Clientes:\s*(\d+)/i);
        
        const seeds = seedsMatch ? parseInt(seedsMatch[1]) : 10;
        const peers = peersMatch ? parseInt(peersMatch[1]) : 5;

        const sizeDetailMatch = detailText.match(/Tamaño:\s*([^\n]+)/i);
        const finalSize = sizeDetailMatch ? sizeDetailMatch[1].trim() : sizeText;
        
        const size = parseSizeText(finalSize);
        const hash = magnetLink.match(/btih:([a-f0-9]{40})/i)?.[1];

        results.push({
          name: `${title} ${quality} ${language}`.trim(),
          tracker: "EliteTorrent",
          category: "Movies/TV (Spanish)",
          size,
          seeds,
          peers,
          magnet: magnetLink,
          infohash: hash?.toLowerCase(),
        });
        
        count++;
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
      } catch (error) {
        
      }
    }

    return results;
  } catch (error) {
    console.error("EliteTorrent search error:", error);
    return [];
  }
};

function parseSizeText(sizeText: string): number {
  const match = sizeText.match(/([0-9.]+)\s*(GB|MB|KB|TB)s?/i);
  if (!match) return 0;
  
  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  
  const units: Record<string, number> = {
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024,
    TB: 1024 * 1024 * 1024 * 1024,
  };
  
  return Math.floor(value * (units[unit] || 1));
}

