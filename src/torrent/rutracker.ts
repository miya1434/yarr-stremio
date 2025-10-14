import axios from "axios";
import * as cheerio from "cheerio";
import { TorrentSearchResult } from "./search.js";

const BASE_URL = "https://rutracker.org";

export const searchRutracker = async (
  searchQuery: string,
  username?: string,
  password?: string
): Promise<TorrentSearchResult[]> => {
  try {
    // RuTracker requires authentication, similar to nCore
    if (!username || !password) {
      return [];
    }

    console.log("RuTracker requires authentication - not implemented yet");
    return [];
  } catch (error) {
    console.error("RuTracker search error:", error);
    return [];
  }
};

