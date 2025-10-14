// @ts-ignore
import AllDebridClient from "all-debrid-api";
import axios from "axios";

const AD_API_BASE = "https://api.alldebrid.com/v4";

// Use official AllDebrid API library (same as Torrentio)
export const checkAllDebridCachedBatch = async (
  magnetLinks: string[],
  apiKey: string
): Promise<Map<string, boolean>> => {
  const results = new Map<string, boolean>();
  
  try {
    if (magnetLinks.length === 0) return results;

    const AD = new AllDebridClient(apiKey, { agent: "YARR" });
    
    // Use official library's instant check
    const response = await AD.magnet.instant(magnetLinks);
    
    if (response && response.data && response.data.magnets) {
      response.data.magnets.forEach((m: any, index: number) => {
        const hash = magnetLinks[index].match(/btih:([a-f0-9]{40})/i)?.[1].toLowerCase();
        if (hash) {
          results.set(hash, m.instant === true);
        }
      });
    }
    
  } catch (error: any) {
    console.error("AllDebrid batch cache check error:", error.message || error);
  }
  
  return results;
};

export const checkAllDebridCached = async (
  magnetLink: string,
  apiKey: string
): Promise<boolean> => {
  const results = await checkAllDebridCachedBatch([magnetLink], apiKey);
  const hash = magnetLink.match(/btih:([a-f0-9]{40})/i)?.[1].toLowerCase();
  return hash ? (results.get(hash) || false) : false;
};

export const getAllDebridStream = async (
  magnetLink: string,
  apiKey: string
): Promise<string | null> => {
  try {
    // Upload magnet
    const uploadResponse = await axios.get(`${AD_API_BASE}/magnet/upload`, {
      params: {
        agent: "YARR",
        apikey: apiKey,
        magnets: [magnetLink],
      },
      timeout: 10000,
    });

    if (
      uploadResponse.data.status !== "success" ||
      !uploadResponse.data.data ||
      !uploadResponse.data.data.magnets ||
      uploadResponse.data.data.magnets.length === 0
    ) {
      return null;
    }

    const magnetId = uploadResponse.data.data.magnets[0].id;

    // Get magnet status
    const statusResponse = await axios.get(`${AD_API_BASE}/magnet/status`, {
      params: {
        agent: "YARR",
        apikey: apiKey,
        id: magnetId,
      },
      timeout: 10000,
    });

    if (
      statusResponse.data.status !== "success" ||
      !statusResponse.data.data ||
      !statusResponse.data.data.magnets ||
      !statusResponse.data.data.magnets.links ||
      statusResponse.data.data.magnets.links.length === 0
    ) {
      return null;
    }

    const firstLink = statusResponse.data.data.magnets.links[0].link;

    // Unlock link
    const unlockResponse = await axios.get(`${AD_API_BASE}/link/unlock`, {
      params: {
        agent: "YARR",
        apikey: apiKey,
        link: firstLink,
      },
      timeout: 10000,
    });

    if (
      unlockResponse.data.status !== "success" ||
      !unlockResponse.data.data ||
      !unlockResponse.data.data.link
    ) {
      return null;
    }

    return unlockResponse.data.data.link;
  } catch (error) {
    console.error("AllDebrid stream error:", error);
    return null;
  }
};

