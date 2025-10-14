import { Request } from "express";
import { getTrendingContent, getPopularContent, getTraktRecommendationsForUser } from "../metadata/catalog.js";

interface CatalogArgs {
  type: string;
  id: string;
  extra?: {
    skip?: string;
    genre?: string;
  };
  config?: {
    traktToken?: string;
  };
}

export const catalogHandler = async ({ type, id, extra, config }: CatalogArgs) => {
  const skip = parseInt(extra?.skip || "0");

  console.log(`Catalog request: ${id} for ${type}, skip=${skip}`);

  try {
    if (id === "yarr-trending") {
      const metas = await getTrendingContent(type as "movie" | "series", skip);
      return { metas };
    }

    if (id === "yarr-popular") {
      const metas = await getPopularContent(type as "movie" | "series", skip);
      return { metas };
    }

    if (id === "yarr-trakt-recommended" && config?.traktToken) {
      const metas = await getTraktRecommendationsForUser(
        config.traktToken,
        type as "movie" | "series"
      );
      return { metas };
    }

    return { metas: [] };
  } catch (error) {
    console.error("Catalog handler error:", error);
    return { metas: [] };
  }
};

