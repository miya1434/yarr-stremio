// @ts-ignore
import PremiumizeClient from "premiumize-api";
import axios from "axios";

const PM_API_BASE = "https://www.premiumize.me/api";

// Use official Premiumize API library (same as Torrentio)
export const checkPremiumizeCachedBatch = async (
  magnetLinks: string[],
  apiKey: string
): Promise<Map<string, boolean>> => {
  const results = new Map<string, boolean>();
  
  try {
    if (magnetLinks.length === 0) return results;

    const PM = new PremiumizeClient(apiKey);
    
    // Use official library's cache check
    const response = await PM.cache.check(magnetLinks);
    
    if (response && response.response && Array.isArray(response.response)) {
      magnetLinks.forEach((magnet, index) => {
        const hash = magnet.match(/btih:([a-f0-9]{40})/i)?.[1].toLowerCase();
        if (hash) {
          results.set(hash, response.response[index] === true);
        }
      });
    }
    
  } catch (error: any) {
    console.error("Premiumize batch cache check error:", error.message || error);
  }
  
  return results;
};

export const checkPremiumizeCached = async (
  magnetLink: string,
  apiKey: string
): Promise<boolean> => {
  const results = await checkPremiumizeCachedBatch([magnetLink], apiKey);
  const hash = magnetLink.match(/btih:([a-f0-9]{40})/i)?.[1].toLowerCase();
  return hash ? (results.get(hash) || false) : false;
};

export const getPremiumizeStream = async (
  magnetLink: string,
  apiKey: string
): Promise<string | null> => {
  try {
    // Create transfer
    const createResponse = await axios.post(
      `${PM_API_BASE}/transfer/create`,
      new URLSearchParams({
        apikey: apiKey,
        src: magnetLink,
      }),
      {
        timeout: 10000,
      }
    );

    if (
      createResponse.data.status !== "success" ||
      !createResponse.data.content
    ) {
      return null;
    }

    const folderId = createResponse.data.content[0].id;

    // List folder
    const listResponse = await axios.get(`${PM_API_BASE}/folder/list`, {
      params: {
        apikey: apiKey,
        id: folderId,
      },
      timeout: 10000,
    });

    if (
      listResponse.data.status !== "success" ||
      !listResponse.data.content ||
      listResponse.data.content.length === 0
    ) {
      return null;
    }

    // Find largest video file
    const videoFiles = listResponse.data.content.filter(
      (file: any) =>
        file.type === "file" &&
        (file.name.endsWith(".mp4") ||
          file.name.endsWith(".mkv") ||
          file.name.endsWith(".avi"))
    );

    if (videoFiles.length === 0) return null;

    const largestFile = videoFiles.reduce((prev: any, current: any) =>
      prev.size > current.size ? prev : current
    );

    return largestFile.link;
  } catch (error) {
    console.error("Premiumize stream error:", error);
    return null;
  }
};

