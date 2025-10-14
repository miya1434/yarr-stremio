import axios from "axios";

const RD_API_BASE = "https://api.real-debrid.com/rest/1.0";

export interface DebridStream {
  url: string;
  quality: string;
  cached: boolean;
}

export const checkRealDebridCached = async (
  magnetLink: string,
  apiKey: string
): Promise<boolean> => {
  try {
    // Extract info hash from magnet link
    const hashMatch = magnetLink.match(/btih:([a-f0-9]{40})/i);
    if (!hashMatch) return false;

    const hash = hashMatch[1];

    const response = await axios.get(
      `${RD_API_BASE}/torrents/instantAvailability/${hash}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: 5000,
      }
    );

    // Check if torrent has any available files
    return !!(
      response.data &&
      Object.keys(response.data).length > 0 &&
      Object.values(response.data)[0]
    );
  } catch (error) {
    console.error("RealDebrid cache check error:", error);
    return false;
  }
};

export const getRealDebridStream = async (
  magnetLink: string,
  apiKey: string
): Promise<string | null> => {
  try {
    // Add magnet to RealDebrid
    const addResponse = await axios.post(
      `${RD_API_BASE}/torrents/addMagnet`,
      new URLSearchParams({
        magnet: magnetLink,
      }),
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: 10000,
      }
    );

    const torrentId = addResponse.data.id;

    // Select all files
    await axios.post(
      `${RD_API_BASE}/torrents/selectFiles/${torrentId}`,
      new URLSearchParams({
        files: "all",
      }),
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: 10000,
      }
    );

    // Get torrent info
    const infoResponse = await axios.get(
      `${RD_API_BASE}/torrents/info/${torrentId}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: 10000,
      }
    );

    const links = infoResponse.data.links;
    if (!links || links.length === 0) return null;

    // Unrestrict the first link (usually the largest video file)
    const unrestrictResponse = await axios.post(
      `${RD_API_BASE}/unrestrict/link`,
      new URLSearchParams({
        link: links[0],
      }),
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: 10000,
      }
    );

    return unrestrictResponse.data.download;
  } catch (error) {
    console.error("RealDebrid stream error:", error);
    return null;
  }
};

export const deleteRealDebridTorrent = async (
  torrentId: string,
  apiKey: string
): Promise<void> => {
  try {
    await axios.delete(`${RD_API_BASE}/torrents/delete/${torrentId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      timeout: 5000,
    });
  } catch (error) {
    console.error("RealDebrid delete error:", error);
  }
};

