import axios from "axios";

const KITSU_API = "https://kitsu.io/api/edge";

export interface KitsuMetadata {
  id: string;
  title: string;
  year: number;
  yearEnd?: number;
  episodeCount?: number;
}

export const getKitsuMetadata = async (kitsuId: string): Promise<KitsuMetadata | null> => {
  try {
    const response = await axios.get(`${KITSU_API}/anime/${kitsuId}`, {
      timeout: 10000,
    });

    if (!response.data || !response.data.data) {
      return null;
    }

    const attributes = response.data.data.attributes;
    const year = parseInt(attributes.createdAt?.split("-")[0] || "0");
    const yearEnd = parseInt(attributes.updatedAt?.split("-")[0] || "0");

    return {
      id: kitsuId,
      title: attributes.canonicalTitle || attributes.titles?.en || "Unknown",
      year,
      yearEnd: yearEnd !== year ? yearEnd : undefined,
      episodeCount: attributes.episodeCount,
    };
  } catch (error) {
    console.error(`Kitsu metadata error for ${kitsuId}:`, error);
    return null;
  }
};

export const getKitsuAliases = async (kitsuId: string): Promise<string[]> => {
  try {
    const response = await axios.get(`${KITSU_API}/anime/${kitsuId}`, {
      timeout: 10000,
    });

    if (!response.data || !response.data.data) {
      return [];
    }

    const attributes = response.data.data.attributes;
    const titles = attributes.titles || {};
    const aliases: string[] = [];

    // Get all title variations
    if (titles.en) aliases.push(titles.en);
    if (titles.en_jp) aliases.push(titles.en_jp);
    if (titles.ja_jp) aliases.push(titles.ja_jp);

    // Get canonical title
    if (attributes.canonicalTitle) {
      aliases.push(attributes.canonicalTitle);
    }

    // Get abbreviatedTitles
    if (attributes.abbreviatedTitles) {
      aliases.push(...attributes.abbreviatedTitles);
    }

    return Array.from(new Set(aliases));
  } catch (error) {
    console.error(`Kitsu aliases error for ${kitsuId}:`, error);
    return [];
  }
};

export const searchKitsu = async (query: string): Promise<KitsuMetadata[]> => {
  try {
    const response = await axios.get(`${KITSU_API}/anime`, {
      params: {
        "filter[text]": query,
        "page[limit]": 10,
      },
      timeout: 10000,
    });

    if (!response.data || !response.data.data) {
      return [];
    }

    return response.data.data.map((item: any) => {
      const attributes = item.attributes;
      const year = parseInt(attributes.createdAt?.split("-")[0] || "0");
      const yearEnd = parseInt(attributes.updatedAt?.split("-")[0] || "0");

      return {
        id: item.id,
        title: attributes.canonicalTitle || attributes.titles?.en || "Unknown",
        year,
        yearEnd: yearEnd !== year ? yearEnd : undefined,
        episodeCount: attributes.episodeCount,
      };
    });
  } catch (error) {
    console.error("Kitsu search error:", error);
    return [];
  }
};

