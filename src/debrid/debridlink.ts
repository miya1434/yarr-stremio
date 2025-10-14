import axios from "axios";

const DL_API_BASE = "https://debrid-link.fr/api/v2";

export const checkDebridLinkCached = async (
  magnetLink: string,
  apiKey: string
): Promise<boolean> => {
  try {
    const response = await axios.post(
      `${DL_API_BASE}/seedbox/cached`,
      {
        url: magnetLink,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: 5000,
      }
    );

    return response.data.value && response.data.value.length > 0;
  } catch (error) {
    console.error("DebridLink cache check error:", error);
    return false;
  }
};

export const getDebridLinkStream = async (
  magnetLink: string,
  apiKey: string
): Promise<string | null> => {
  try {
    // Add magnet
    const addResponse = await axios.post(
      `${DL_API_BASE}/seedbox/add`,
      {
        url: magnetLink,
        async: false,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: 10000,
      }
    );

    if (!addResponse.data.success) {
      return null;
    }

    const torrentId = addResponse.data.value.id;

    // Get torrent files
    const filesResponse = await axios.get(
      `${DL_API_BASE}/seedbox/list`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: 10000,
      }
    );

    const torrent = filesResponse.data.value.find(
      (t: any) => t.id === torrentId
    );
    if (!torrent || !torrent.files) {
      return null;
    }

    // Find largest video file
    const videoFiles = torrent.files.filter(
      (file: any) =>
        file.name.endsWith(".mp4") ||
        file.name.endsWith(".mkv") ||
        file.name.endsWith(".avi")
    );

    if (videoFiles.length === 0) return null;

    const largestFile = videoFiles.reduce((prev: any, current: any) =>
      prev.size > current.size ? prev : current
    );

    return largestFile.downloadUrl;
  } catch (error) {
    console.error("DebridLink stream error:", error);
    return null;
  }
};

