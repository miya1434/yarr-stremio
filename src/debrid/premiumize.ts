import axios from "axios";

const PM_API_BASE = "https://www.premiumize.me/api";

export const checkPremiumizeCached = async (
  magnetLink: string,
  apiKey: string
): Promise<boolean> => {
  try {
    const response = await axios.get(`${PM_API_BASE}/cache/check`, {
      params: {
        apikey: apiKey,
        items: [magnetLink],
      },
      timeout: 5000,
    });

    return (
      response.data &&
      response.data.response &&
      response.data.response.length > 0 &&
      response.data.response[0] === true
    );
  } catch (error) {
    console.error("Premiumize cache check error:", error);
    return false;
  }
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

