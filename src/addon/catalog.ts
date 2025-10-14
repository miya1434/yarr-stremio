import { Request } from "express";
import { getTrendingContent, getPopularContent, getTraktRecommendationsForUser } from "../metadata/catalog.js";
import { getAllUnifiedChannels, getChannelsByGroup } from "../iptv/unified.js";

interface CatalogArgs {
  type: string;
  id: string;
  extra?: {
    skip?: string;
    genre?: string;
  };
  config?: {
    traktToken?: string;
    enableLiveTV?: string;
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

    if (id === "yarr-livetv") {
      const genre = extra?.genre;
      let channels = genre 
        ? await getChannelsByGroup(genre)
        : await getAllUnifiedChannels();

      const limitedChannels = channels.slice(0, 500);

      console.log(`Returning ${limitedChannels.length} Live TV channels (showing ${limitedChannels.length} of ${channels.length} total)`);

      const metas = limitedChannels.map((channel) => ({
        id: `livetv_${channel.id}`,
        type: "tv" as const,
        name: channel.name,
        poster: channel.logo,
        background: channel.logo,
        logo: channel.logo,
        description: `📡 Live TV - ${channel.providers.length} source(s)`,
        genres: [channel.group],
        runtime: "Live",
      }));

      return { metas };
    }

    return { metas: [] };
  } catch (error) {
    console.error("Catalog handler error:", error);
    return { metas: [] };
  }
};

