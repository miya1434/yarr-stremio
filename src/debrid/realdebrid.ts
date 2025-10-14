// @ts-ignore
import RealDebridClient from "real-debrid-api";
import axios from "axios";

const RD_API_BASE = "https://api.real-debrid.com/rest/1.0";

export interface DebridStream {
  url: string;
  quality: string;
  cached: boolean;
}

// Check via multiple methods (direct API, StremThru proxy, individual checks)
export const checkRealDebridCachedBatch = async (
  magnetLinks: string[],
  apiKey: string
): Promise<Map<string, boolean>> => {
  const results = new Map<string, boolean>();
  
  // Extract all hashes
  const hashes = magnetLinks
    .map(magnet => {
      const match = magnet.match(/btih:([a-f0-9]{40})/i);
      return match ? match[1].toLowerCase() : null;
    })
    .filter(h => h !== null) as string[];

  if (hashes.length === 0) return results;

  // METHOD 1: Try direct API first
  try {
    console.log(`   📤 Trying RealDebrid direct API for ${hashes.length} hashes...`);

    const hashesString = hashes.join('/');
    const response = await axios.get(
      `${RD_API_BASE}/torrents/instantAvailability/${hashesString}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: 15000,
      }
    );
    
    if (response.data && typeof response.data === 'object') {
      let cachedCount = 0;
      hashes.forEach(hash => {
        const hashData = response.data[hash];
        if (hashData && hashData.rd) {
          const isCached = Array.isArray(hashData.rd) && 
                          hashData.rd.length > 0 && 
                          hashData.rd[0] && 
                          Object.keys(hashData.rd[0]).length > 0;
          results.set(hash, isCached);
          if (isCached) cachedCount++;
        } else {
          results.set(hash, false);
        }
      });
      console.log(`   ✅ RealDebrid (direct): ${cachedCount}/${hashes.length} cached`);
      return results; // Success - return immediately
    }
    
  } catch (error: any) {
    const errorCode = error.response?.data?.error_code;
    const errorMsg = error.response?.data?.error || error.message;
    console.log(`   ⚠️ Direct API failed (error ${errorCode || 'unknown'}): ${errorMsg}`);
    
    // If error 37 (disabled_endpoint) or 403, try alternative methods
    if (errorCode === 37 || error.response?.status === 403) {
      // METHOD 2: Try StremThru proxy
      console.log(`   🔄 Trying StremThru proxy...`);
      try {
        const stremThruUrl = `https://stremthru.elfhosted.com/v0/store/magnets/check`;
        const magnetQuery = magnetLinks.join(',');
        
        const proxyResponse = await axios.get(`${stremThruUrl}?magnet=${encodeURIComponent(magnetQuery)}`, {
          headers: {
            'X-StremThru-Store-Name': 'realdebrid',
            'X-StremThru-Store-Authorization': `Bearer ${apiKey}`,
          },
          timeout: 15000,
        });
        
        if (proxyResponse.data?.data?.items) {
          let cachedCount = 0;
          proxyResponse.data.data.items.forEach((item: any) => {
            if (item.hash && item.status === 'cached') {
              results.set(item.hash.toLowerCase(), true);
              cachedCount++;
            } else if (item.hash) {
              results.set(item.hash.toLowerCase(), false);
            }
          });
          console.log(`   ✅ RealDebrid (StremThru): ${cachedCount}/${hashes.length} cached`);
          return results; // Success - return immediately
        }
      } catch (proxyError: any) {
        console.log(`   ⚠️ StremThru proxy failed: ${proxyError.message}`);
      }
      
      // METHOD 3: Try individual hash checks (slower but more reliable)
      console.log(`   🔄 Trying individual hash checks (slower)...`);
      try {
        let cachedCount = 0;
        
        // Check in smaller batches to avoid rate limits
        const batchSize = 10;
        for (let i = 0; i < hashes.length; i += batchSize) {
          const batch = hashes.slice(i, i + batchSize);
          const batchString = batch.join('/');
          
          try {
            const batchResponse = await axios.get(
              `${RD_API_BASE}/torrents/instantAvailability/${batchString}`,
              {
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                },
                timeout: 10000,
              }
            );
            
            if (batchResponse.data && typeof batchResponse.data === 'object') {
              batch.forEach(hash => {
                const hashData = batchResponse.data[hash];
                if (hashData && hashData.rd) {
                  const isCached = Array.isArray(hashData.rd) && 
                                  hashData.rd.length > 0 && 
                                  hashData.rd[0] && 
                                  Object.keys(hashData.rd[0]).length > 0;
                  results.set(hash, isCached);
                  if (isCached) cachedCount++;
                } else {
                  results.set(hash, false);
                }
              });
            }
            
            // Small delay to avoid rate limits
            if (i + batchSize < hashes.length) {
              await new Promise(resolve => setTimeout(resolve, 200));
            }
          } catch (batchError) {
            // If this batch fails, mark all as uncached
            batch.forEach(hash => results.set(hash, false));
          }
        }
        
        console.log(`   ✅ RealDebrid (individual): ${cachedCount}/${hashes.length} cached`);
        return results;
      } catch (individualError: any) {
        console.log(`   ⚠️ Individual checks failed: ${individualError.message}`);
      }
    }
  }
  
  // All methods failed - mark all as uncached
  console.log(`   ❌ All RealDebrid methods failed - marking all as uncached`);
  hashes.forEach(hash => results.set(hash, false));
  return results;
};

// Single check wrapper
export const checkRealDebridCached = async (
  magnetLink: string,
  apiKey: string
): Promise<boolean> => {
  const results = await checkRealDebridCachedBatch([magnetLink], apiKey);
  const hash = magnetLink.match(/btih:([a-f0-9]{40})/i)?.[1].toLowerCase();
  return hash ? (results.get(hash) || false) : false;
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

