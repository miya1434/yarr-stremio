import axios from "axios";

const TORBOX_API_BASE = "https://api.torbox.app/v1/api";

export const checkTorBoxCached = async (
  magnetLink: string,
  apiKey: string
): Promise<boolean> => {
  try {
    const hashMatch = magnetLink.match(/btih:([a-f0-9]{40})/i);
    if (!hashMatch) return false;

    const hash = hashMatch[1];

    const response = await axios.post(
      `${TORBOX_API_BASE}/torrents/checkcached`,
      {
        hashes: [hash],
      },
      {
        params: {
          format: "list",
          list_files: true,
        },
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: 5000,
      }
    );

    if (!response.data?.success || !response.data?.data) {
      return false;
    }

    const torrent = response.data.data.find((t: any) => t.hash === hash);
    return torrent && torrent.cached === true;
  } catch (error) {
    console.error("TorBox cache check error:", error);
    return false;
  }
};

export const getTorBoxStream = async (
  magnetLink: string,
  apiKey: string
): Promise<string | null> => {
  try {
    // Create torrent
    const createResponse = await axios.post(
      `${TORBOX_API_BASE}/torrents/createtorrent`,
      {
        magnet: magnetLink,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: 10000,
      }
    );

    if (!createResponse.data.success) {
      return null;
    }

    const torrentId = createResponse.data.data.torrent_id;

    // Get torrent info
    const infoResponse = await axios.get(
      `${TORBOX_API_BASE}/torrents/mylist`,
      {
        params: {
          id: torrentId,
        },
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: 10000,
      }
    );

    const torrent = infoResponse.data.data.find(
      (t: any) => t.id === torrentId
    );
    if (!torrent || !torrent.files || torrent.files.length === 0) {
      return null;
    }

    // Get largest video file
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

    // Request download link
    const downloadResponse = await axios.get(
      `${TORBOX_API_BASE}/torrents/requestdl`,
      {
        params: {
          token: apiKey,
          torrent_id: torrentId,
          file_id: largestFile.id,
        },
        timeout: 10000,
      }
    );

    return downloadResponse.data.data;
  } catch (error) {
    console.error("TorBox stream error:", error);
    return null;
  }
};

