import axios from "axios";
import { cache } from "../utils/cache.js";

const CINEMETA_API = "https://v3-cinemeta.strem.io";

export interface CatalogMeta {
  id: string;
  type: string;
  name: string;
  poster?: string;
  description?: string;
  releaseInfo?: string;
  imdbRating?: string;
}

export const getTrendingContent = async (
  type: "movie" | "series",
  skip: number = 0
): Promise<CatalogMeta[]> => {
  const cacheKey = `catalog:trending:${type}:${skip}`;

  const cached = cache.get<CatalogMeta[]>(cacheKey);
  if (cached) return cached;

  try {
    // Use Cinemeta for trending content
    const genre = "trending";
    const response = await axios.get(
      `${CINEMETA_API}/catalog/${type}/${genre}/skip=${skip}.json`,
      {
        timeout: 10000,
      }
    );

    if (!response.data || !response.data.metas) {
      return [];
    }

    const metas = response.data.metas.map((meta: any) => ({
      id: meta.id,
      type: meta.type,
      name: meta.name,
      poster: meta.poster,
      description: meta.description,
      releaseInfo: meta.releaseInfo,
      imdbRating: meta.imdbRating,
    }));

    cache.set(cacheKey, metas, 3600); // Cache for 1 hour
    return metas;
  } catch (error) {
    console.error("Trending content error:", error);
    return [];
  }
};

export const getPopularContent = async (
  type: "movie" | "series",
  skip: number = 0
): Promise<CatalogMeta[]> => {
  const cacheKey = `catalog:popular:${type}:${skip}`;

  const cached = cache.get<CatalogMeta[]>(cacheKey);
  if (cached) return cached;

  try {
    const genre = "top";
    const response = await axios.get(
      `${CINEMETA_API}/catalog/${type}/${genre}/skip=${skip}.json`,
      {
        timeout: 10000,
      }
    );

    if (!response.data || !response.data.metas) {
      return [];
    }

    const metas = response.data.metas.map((meta: any) => ({
      id: meta.id,
      type: meta.type,
      name: meta.name,
      poster: meta.poster,
      description: meta.description,
      releaseInfo: meta.releaseInfo,
      imdbRating: meta.imdbRating,
    }));

    cache.set(cacheKey, metas, 3600);
    return metas;
  } catch (error) {
    console.error("Popular content error:", error);
    return [];
  }
};

export const getTraktRecommendationsForUser = async (
  traktToken: string,
  type: "movie" | "series"
): Promise<CatalogMeta[]> => {
  // This would use the Trakt integration from metadata/trakt.ts
  // No server-side caching - stateless per-request
  try {
    const { getTraktUserRecommendations } = await import("./trakt.js");
    const mediaType = type === "series" ? "show" : "movie";
    const recommendations = await getTraktUserRecommendations(traktToken, mediaType);

    // Fetch metadata for each recommendation
    const metas = await Promise.all(
      recommendations.slice(0, 20).map(async (rec) => {
        try {
          const response = await axios.get(
            `${CINEMETA_API}/meta/${type}/${rec.imdbId}.json`,
            { timeout: 5000 }
          );
          return response.data.meta;
        } catch (error) {
          return null;
        }
      })
    );

    return metas.filter((m) => m !== null);
  } catch (error) {
    console.error("Trakt user recommendations error:", error);
    return [];
  }
};

