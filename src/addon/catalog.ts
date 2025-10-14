import { Request } from "express";
import { getTrendingContent, getPopularContent, getTraktRecommendationsForUser } from "../metadata/catalog.js";
import { getAllChannels, getChannelsByCategory } from "../iptv/daddylive.js";

interface CatalogArgs {
  type: string;
  id: string;
  extra?: {
    skip?: string;
    genre?: string;
  };
  config?: {
    traktToken?: string;
    enableDaddyLive?: string;
  };
}

export const catalogHandler = async ({ type, id, extra, config }: CatalogArgs) => {
  const skip = parseInt(extra?.skip || "0");

  console.log(`📺 Catalog request: ${id} for type ${type}, skip=${skip}`);
  console.log(`   Config:`, config);
  console.log(`   Extra:`, extra);

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

    if (id === "yarr-livetv-daddylive") {
      console.log(`🔴 LIVE TV CATALOG REQUESTED!`);
      const genre = extra?.genre;
      let channels = genre 
        ? await getChannelsByCategory(genre)
        : await getAllChannels();

      console.log(`📡 Found ${channels.length} channels`);

      const metas = channels.map((channel) => ({
        id: `daddylive:${channel.id}`,
        type: "tv" as const,
        name: channel.name,
        poster: `https://via.placeholder.com/300x450/1a1a2e/eee?text=${encodeURIComponent(channel.name)}`,
        background: `https://via.placeholder.com/1920x1080/1a1a2e/eee?text=${encodeURIComponent(channel.name)}`,
        logo: `https://via.placeholder.com/300x150/1a1a2e/eee?text=${encodeURIComponent(channel.name)}`,
        description: `${channel.category} - Live TV`,
        genres: [channel.category],
      }));

      console.log(`✅ Returning ${metas.length} channel metas`);
      return { metas };
    }

    return { metas: [] };
  } catch (error) {
    console.error("❌ Catalog handler error:", error);
    return { metas: [] };
  }
};

