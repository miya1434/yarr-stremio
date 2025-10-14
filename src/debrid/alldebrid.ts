import axios from "axios";

const AD_API_BASE = "https://api.alldebrid.com/v4";

export const checkAllDebridCached = async (
  magnetLink: string,
  apiKey: string
): Promise<boolean> => {
  try {
    const response = await axios.get(`${AD_API_BASE}/magnet/instant`, {
      params: {
        agent: "YARR",
        apikey: apiKey,
        magnets: [magnetLink],
      },
      timeout: 5000,
    });

    return (
      response.data &&
      response.data.status === "success" &&
      response.data.data &&
      response.data.data.magnets &&
      response.data.data.magnets.length > 0 &&
      response.data.data.magnets[0].instant === true
    );
  } catch (error) {
    console.error("AllDebrid cache check error:", error);
    return false;
  }
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

