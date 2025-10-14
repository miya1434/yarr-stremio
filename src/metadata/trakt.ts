import axios from "axios";

const TRAKT_API_BASE = "https://api.trakt.tv";
const TRAKT_CLIENT_ID = process.env.TRAKT_CLIENT_ID || ""; // Optional: Register app at trakt.tv to enable Trakt features

export interface TraktRecommendation {
  imdbId: string;
  title: string;
  year: number;
  type: "movie" | "show";
  score: number;
}

export const getTraktUserRecommendations = async (
  userToken: string,
  mediaType: "movie" | "show",
  limit: number = 20
): Promise<TraktRecommendation[]> => {
  try {
    const endpoint = mediaType === "movie" ? "movies" : "shows";
    const response = await axios.get(
      `${TRAKT_API_BASE}/recommendations/${endpoint}`,
      {
        headers: {
          "Content-Type": "application/json",
          "trakt-api-version": "2",
          "trakt-api-key": TRAKT_CLIENT_ID,
          Authorization: `Bearer ${userToken}`,
        },
        params: {
          limit,
        },
        timeout: 10000,
      }
    );

    if (!response.data) return [];

    return response.data.map((item: any, index: number) => {
      const media = item[mediaType];
      return {
        imdbId: media.ids.imdb,
        title: media.title,
        year: media.year,
        type: mediaType,
        score: 100 - index, // Higher score for earlier recommendations
      };
    });
  } catch (error) {
    console.error("Trakt recommendations error:", error);
    return [];
  }
};

export const getTraktUserWatchlist = async (
  userToken: string,
  mediaType: "movie" | "show"
): Promise<string[]> => {
  try {
    const endpoint = mediaType === "movie" ? "movies" : "shows";
    const response = await axios.get(
      `${TRAKT_API_BASE}/sync/watchlist/${endpoint}`,
      {
        headers: {
          "Content-Type": "application/json",
          "trakt-api-version": "2",
          "trakt-api-key": TRAKT_CLIENT_ID,
          Authorization: `Bearer ${userToken}`,
        },
        timeout: 10000,
      }
    );

    if (!response.data) return [];

    return response.data.map((item: any) => item[mediaType].ids.imdb);
  } catch (error) {
    console.error("Trakt watchlist error:", error);
    return [];
  }
};

export const getTraktWatchedHistory = async (
  userToken: string,
  mediaType: "movie" | "show",
  limit: number = 50
): Promise<string[]> => {
  try {
    const endpoint = mediaType === "movie" ? "movies" : "shows";
    const response = await axios.get(
      `${TRAKT_API_BASE}/sync/history/${endpoint}`,
      {
        headers: {
          "Content-Type": "application/json",
          "trakt-api-version": "2",
          "trakt-api-key": TRAKT_CLIENT_ID,
          Authorization: `Bearer ${userToken}`,
        },
        params: {
          limit,
        },
        timeout: 10000,
      }
    );

    if (!response.data) return [];

    // Get unique IMDB IDs from history
    const imdbIds = new Set<string>();
    for (const item of response.data) {
      const imdbId = item[mediaType].ids.imdb;
      if (imdbId) imdbIds.add(imdbId);
    }

    return Array.from(imdbIds);
  } catch (error) {
    console.error("Trakt history error:", error);
    return [];
  }
};

export const getTraktTrending = async (
  mediaType: "movie" | "show",
  limit: number = 20
): Promise<TraktRecommendation[]> => {
  try {
    const endpoint = mediaType === "movie" ? "movies" : "shows";
    const response = await axios.get(
      `${TRAKT_API_BASE}/${endpoint}/trending`,
      {
        headers: {
          "Content-Type": "application/json",
          "trakt-api-version": "2",
          "trakt-api-key": TRAKT_CLIENT_ID,
        },
        params: {
          limit,
        },
        timeout: 10000,
      }
    );

    if (!response.data) return [];

    return response.data.map((item: any, index: number) => {
      const media = item[mediaType];
      return {
        imdbId: media.ids.imdb,
        title: media.title,
        year: media.year,
        type: mediaType,
        score: item.watchers || (100 - index),
      };
    });
  } catch (error) {
    console.error("Trakt trending error:", error);
    return [];
  }
};

export const getTraktPopular = async (
  mediaType: "movie" | "show",
  limit: number = 20
): Promise<TraktRecommendation[]> => {
  try {
    const endpoint = mediaType === "movie" ? "movies" : "shows";
    const response = await axios.get(
      `${TRAKT_API_BASE}/${endpoint}/popular`,
      {
        headers: {
          "Content-Type": "application/json",
          "trakt-api-version": "2",
          "trakt-api-key": TRAKT_CLIENT_ID,
        },
        params: {
          limit,
        },
        timeout: 10000,
      }
    );

    if (!response.data) return [];

    return response.data.map((item: any, index: number) => ({
      imdbId: item.ids.imdb,
      title: item.title,
      year: item.year,
      type: mediaType,
      score: 100 - index,
    }));
  } catch (error) {
    console.error("Trakt popular error:", error);
    return [];
  }
};

export const getTraktAliases = async (
  mediaType: "movie" | "show",
  imdbId: string
): Promise<string[]> => {
  try {
    const endpoint = mediaType === "movie" ? "movies" : "shows";
    const response = await axios.get(
      `${TRAKT_API_BASE}/${endpoint}/${imdbId}/aliases`,
      {
        headers: {
          "Content-Type": "application/json",
          "trakt-api-version": "2",
          "trakt-api-key": TRAKT_CLIENT_ID,
        },
        timeout: 10000,
      }
    );

    if (!response.data) return [];

    return response.data.map((item: any) => item.title);
  } catch (error) {
    console.error("Trakt aliases error:", error);
    return [];
  }
};

