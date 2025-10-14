import axios from "axios";
import { gotScraping } from "got-scraping";

const TORBOX_API_BASE = "https://api.torbox.app/v1/api";

// Batch check multiple hashes at once
export const checkTorBoxCachedBatch = async (
  magnetLinks: string[],
  apiKey: string
): Promise<Map<string, boolean>> => {
  const results = new Map<string, boolean>();
  
  try {
    const hashes = magnetLinks
      .map(magnet => {
        const match = magnet.match(/btih:([a-f0-9]{40})/i);
        return match ? match[1].toLowerCase() : null;
      })
      .filter(h => h !== null) as string[];

    if (hashes.length === 0) return results;

    console.log(`   📤 Sending ${hashes.length} hashes to TorBox:`, hashes.slice(0, 3));

    // Use got-scraping to bypass Cloudflare TLS fingerprinting
    const response: any = await gotScraping.post(
      `${TORBOX_API_BASE}/torrents/checkcached`,
      {
        searchParams: {
          format: "list",
          list_files: "true",
        },
        json: {
          hashes: hashes,
        },
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: {
          request: 30000,
        },
        responseType: 'json',
      }
    ).then(res => ({ data: res.body }));

    console.log(`   🔍 TorBox response:`, JSON.stringify(response.data, null, 2));
    
    if (response.data?.success && response.data?.data) {
      console.log(`   📦 TorBox returned ${response.data.data.length} results`);
      response.data.data.forEach((t: any, idx: number) => {
        // TorBox returns torrents WITH files if they're cached!
        // If they return it, it's cached. No "cached" boolean field!
        const isCached = t.files && t.files.length > 0;
        console.log(`   [${idx}] Hash: ${t.hash}, HasFiles: ${isCached}, Files: ${t.files?.length || 0}`);
        if (t.hash) {
          results.set(t.hash.toLowerCase(), isCached);
        }
      });
    } else {
      console.log(`   ⚠️ TorBox unexpected response format:`, response.data);
    }
    
    // Set false for any hashes that weren't in the response
    hashes.forEach(hash => {
      if (!results.has(hash)) {
        console.log(`   ❌ Hash not in response: ${hash}`);
        results.set(hash, false);
      }
    });
    
  } catch (error: any) {
    console.error("TorBox batch cache check error:", error.response?.data || error.message);
    console.error("   Full error:", error);
  }
  
  return results;
};

export const checkTorBoxCached = async (
  magnetLink: string,
  apiKey: string
): Promise<boolean> => {
  const results = await checkTorBoxCachedBatch([magnetLink], apiKey);
  const hash = magnetLink.match(/btih:([a-f0-9]{40})/i)?.[1].toLowerCase();
  return hash ? (results.get(hash) || false) : false;
};

export const getTorBoxStream = async (
  magnetLink: string,
  apiKey: string
): Promise<string | null> => {
  try {
    // Create torrent
    const createResponse: any = await gotScraping.post(
      `${TORBOX_API_BASE}/torrents/createtorrent`,
      {
        json: {
          magnet: magnetLink,
        },
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: {
          request: 30000,
        },
        responseType: 'json',
      }
    ).then(res => ({ data: res.body }));

    if (!createResponse.data.success) {
      return null;
    }

    const torrentId = createResponse.data.data.torrent_id;

    // Get torrent info
    const infoResponse: any = await gotScraping.get(
      `${TORBOX_API_BASE}/torrents/mylist`,
      {
        searchParams: {
          id: torrentId,
        },
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: {
          request: 30000,
        },
        responseType: 'json',
      }
    ).then(res => ({ data: res.body }));

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
    const downloadResponse: any = await gotScraping.get(
      `${TORBOX_API_BASE}/torrents/requestdl`,
      {
        searchParams: {
          token: apiKey,
          torrent_id: torrentId.toString(),
          file_id: largestFile.id.toString(),
        },
        timeout: {
          request: 30000,
        },
        responseType: 'json',
      }
    ).then(res => ({ data: res.body }));

    return downloadResponse.data.data;
  } catch (error) {
    console.error("TorBox stream error:", error);
    return null;
  }
};

