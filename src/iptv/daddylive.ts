import axios from "axios";
import * as cheerio from "cheerio";
import https from "https";

export interface DaddyLiveChannel {
  id: string;
  name: string;
  category: string;
  stream_url: string;
  watch_url: string;
}

export interface DaddyLiveStream {
  name: string;
  url: string;
  title?: string;
  httpReferrer?: string;
  behaviorHints?: {
    notWebReady?: boolean;
  };
}

export interface DaddyLiveScheduleEvent {
  time: string;
  event: string;
  channels: Array<{
    channel_name: string;
    channel_id: string;
  }>;
  channels2: Array<{
    channel_name: string;
    channel_id: string;
  }>;
}

export interface DaddyLiveSchedule {
  [date: string]: {
    "TV Shows"?: DaddyLiveScheduleEvent[];
    "Sports"?: DaddyLiveScheduleEvent[];
    "Movies"?: DaddyLiveScheduleEvent[];
  };
}

const BASE_URL = "https://dlhd.dad";
const CHANNELS_URL = `${BASE_URL}/24-7-channels.php`;
const WATCH_URL_TEMPLATE = `${BASE_URL}/watch.php?id=`;
const SCHEDULE_API = "https://daddylivestream.com/schedule/schedule-generated.php";

const SERVER_LOOKUP_API = "https://kondoplay.cfd/server_lookup.php";

const SERVER_PATTERNS = [
  { key: "top1/cdn", url: "https://top1.newkso.ru/top1/cdn" },
  { key: "top2", url: "https://top2new.newkso.ru/top2" },
  { key: "top3", url: "https://top3new.newkso.ru/top3" },
  { key: "top4", url: "https://top4new.newkso.ru/top4" },
  { key: "top5", url: "https://top5new.newkso.ru/top5" },
];

let channelsCache: Map<string, DaddyLiveChannel> | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000;

let scheduleCache: DaddyLiveSchedule | null = null;
let scheduleCacheTimestamp = 0;
const SCHEDULE_CACHE_DURATION = 60 * 60 * 1000;

const channelData = [
  { id: "51", name: "ABC USA", category: "USA TV" },
  { id: "52", name: "CBS USA", category: "USA TV" },
  { id: "53", name: "NBC USA", category: "USA TV" },
  { id: "54", name: "FOX USA", category: "USA TV" },
  { id: "766", name: "ABC NY USA", category: "USA TV" },
  { id: "767", name: "CBS NY USA", category: "USA TV" },
  { id: "768", name: "FOX NY USA", category: "USA TV" },
  { id: "769", name: "NBCNY USA", category: "USA TV" },
  { id: "770", name: "ABC LA USA", category: "USA TV" },
  { id: "771", name: "CBS LA USA", category: "USA TV" },
  { id: "772", name: "FOX LA USA", category: "USA TV" },
  { id: "773", name: "NBC LA USA", category: "USA TV" },
  { id: "44", name: "ESPN USA", category: "Sports" },
  { id: "45", name: "ESPN2 USA", category: "Sports" },
  { id: "46", name: "ESPN3 USA", category: "Sports" },
  { id: "316", name: "ESPNU USA", category: "Sports" },
  { id: "317", name: "ESPN News USA", category: "Sports" },
  { id: "404", name: "NBA TV USA", category: "Sports" },
  { id: "405", name: "NFL Network", category: "Sports" },
  { id: "399", name: "MLB Network USA", category: "Sports" },
  { id: "408", name: "NHL Network USA", category: "Sports" },
  { id: "420", name: "Fox Sports 1 USA", category: "Sports" },
  { id: "421", name: "Fox Sports 2 USA", category: "Sports" },
  { id: "410", name: "beIN Sports USA", category: "Sports" },
  { id: "411", name: "beIN Sports 1 USA", category: "Sports" },
  { id: "412", name: "beIN Sports 2 USA", category: "Sports" },
  { id: "413", name: "beIN Sports 3 USA", category: "Sports" },
  { id: "345", name: "CNN USA", category: "News" },
  { id: "347", name: "Fox News", category: "News" },
  { id: "327", name: "MSNBC", category: "News" },
  { id: "346", name: "BBC News", category: "News" },
  { id: "348", name: "Sky News", category: "News" },
  { id: "349", name: "CNBC", category: "News" },
  { id: "350", name: "Bloomberg", category: "News" },
  { id: "321", name: "HBO USA", category: "Premium" },
  { id: "328", name: "AMC USA", category: "Entertainment" },
  { id: "329", name: "FX USA", category: "Entertainment" },
  { id: "330", name: "TNT USA", category: "Entertainment" },
  { id: "331", name: "USA Network", category: "Entertainment" },
  { id: "332", name: "Syfy USA", category: "Entertainment" },
  { id: "333", name: "Comedy Central USA", category: "Entertainment" },
  { id: "334", name: "MTV USA", category: "Entertainment" },
  { id: "335", name: "VH1 USA", category: "Entertainment" },
  { id: "336", name: "Bravo USA", category: "Entertainment" },
  { id: "337", name: "E! USA", category: "Entertainment" },
  { id: "338", name: "Lifetime USA", category: "Entertainment" },
  { id: "339", name: "Disney Channel USA", category: "Entertainment" },
  { id: "340", name: "Nickelodeon USA", category: "Entertainment" },
  { id: "341", name: "Cartoon Network USA", category: "Entertainment" },
  { id: "322", name: "History USA", category: "Entertainment" },
  { id: "323", name: "Discovery USA", category: "Entertainment" },
  { id: "324", name: "National Geographic USA", category: "Entertainment" },
  { id: "325", name: "Animal Planet USA", category: "Entertainment" },
  { id: "326", name: "TLC USA", category: "Entertainment" },
  { id: "430", name: "BT Sport 1", category: "Sports" },
  { id: "431", name: "BT Sport 2", category: "Sports" },
  { id: "432", name: "BT Sport 3", category: "Sports" },
  { id: "440", name: "Sky Sports Main Event", category: "Sports" },
  { id: "441", name: "Sky Sports Premier League", category: "Sports" },
  { id: "442", name: "Sky Sports Football", category: "Sports" },
  { id: "443", name: "Sky Sports Arena", category: "Sports" },
  { id: "444", name: "Sky Sports Action", category: "Sports" },
  { id: "445", name: "Sky Sports Cricket", category: "Sports" },
  { id: "446", name: "Sky Sports Golf", category: "Sports" },
  { id: "450", name: "DAZN 1 DE", category: "Sports" },
  { id: "451", name: "DAZN 2 DE", category: "Sports" },
  { id: "460", name: "Arena Sport 1", category: "Sports" },
  { id: "461", name: "Arena Sport 2", category: "Sports" },
  { id: "462", name: "Arena Sport 3", category: "Sports" },
  { id: "470", name: "Astro SuperSport 1", category: "Sports" },
  { id: "471", name: "Astro SuperSport 2", category: "Sports" },
  { id: "472", name: "Astro SuperSport 3", category: "Sports" },
  { id: "480", name: "Eleven Sports 1", category: "Sports" },
  { id: "481", name: "Eleven Sports 2", category: "Sports" },
  { id: "490", name: "Setanta Sports 1", category: "Sports" },
  { id: "491", name: "Setanta Sports 2", category: "Sports" },
  { id: "500", name: "Eurosport 1", category: "Sports" },
  { id: "501", name: "Eurosport 2", category: "Sports" },
  { id: "922", name: "SportsNet Pittsburgh", category: "Sports" },
];

export async function scrapeChannelList(): Promise<Map<string, DaddyLiveChannel>> {
  if (channelsCache && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return channelsCache;
  }

  const channels = new Map<string, DaddyLiveChannel>();

  channelData.forEach((channel) => {
    channels.set(channel.id, {
      id: channel.id,
      name: channel.name,
      category: channel.category,
      stream_url: `${BASE_URL}/stream/stream-${channel.id}.php`,
      watch_url: `${WATCH_URL_TEMPLATE}${channel.id}`,
    });
  });

  channelsCache = channels;
  cacheTimestamp = Date.now();

  return channels;
}

export async function getChannelById(channelId: string): Promise<DaddyLiveChannel | null> {
  const channels = await scrapeChannelList();
  return channels.get(channelId) || null;
}

export async function searchChannels(query: string): Promise<DaddyLiveChannel[]> {
  const channels = await scrapeChannelList();
  const queryLower = query.toLowerCase();
  const results: DaddyLiveChannel[] = [];

  for (const channel of channels.values()) {
    if (
      channel.name.toLowerCase().includes(queryLower) ||
      channel.category.toLowerCase().includes(queryLower)
    ) {
      results.push(channel);
    }
  }

  return results;
}

export async function getChannelsByCategory(category: string): Promise<DaddyLiveChannel[]> {
  const channels = await scrapeChannelList();
  const results: DaddyLiveChannel[] = [];

  for (const channel of channels.values()) {
    if (channel.category === category) {
      results.push(channel);
    }
  }

  return results;
}

export async function getAllChannels(): Promise<DaddyLiveChannel[]> {
  const channels = await scrapeChannelList();
  return Array.from(channels.values());
}

export async function getSchedule(): Promise<DaddyLiveSchedule | null> {
  if (scheduleCache && Date.now() - scheduleCacheTimestamp < SCHEDULE_CACHE_DURATION) {
    return scheduleCache;
  }

  try {
    const response = await axios.get(SCHEDULE_API, {
      timeout: 10000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (response.headers["content-type"]?.includes("application/json")) {
      scheduleCache = response.data;
      scheduleCacheTimestamp = Date.now();
      return scheduleCache;
    }
  } catch (error) {
    console.error("Failed to fetch schedule:", error);
  }

  return null;
}

export async function getChannelsWithSchedule(): Promise<DaddyLiveChannel[]> {
  const channels = await getAllChannels();
  const schedule = await getSchedule();

  if (!schedule) {
    return channels;
  }

  return channels;
}

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function getM3U8ViaAPI(channelId: string): Promise<string | null> {
  try {
    const streamUrl = `${BASE_URL}/stream/stream-${channelId}.php`;
    
    const response = await axios.get(streamUrl, {
      timeout: 10000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": `${BASE_URL}/`,
      },
      httpsAgent,
    });

    const html = response.data;
    
    let channelKeyMatch = html.match(/const\s+CHANNEL_KEY\s*=\s*["']([^"']+)["']/i) ||
                         html.match(/CHANNEL_KEY\s*=\s*["']([^"']+)["']/i) ||
                         html.match(/channel_key\s*[=:]\s*["']([^"']+)["']/i);
    
    let mainIframeUrl = html.match(/<iframe[^>]+src=["']([^"']+)["']/i)?.[1];
    let iframeHtml = html;
    let actualIframeUrl = mainIframeUrl;
    
    if (!channelKeyMatch && mainIframeUrl) {
      console.log(`🔄 No CHANNEL_KEY in main page, fetching iframe: ${mainIframeUrl}`);
      
      try {
        const iframeResponse = await axios.get(mainIframeUrl, {
          timeout: 10000,
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Referer": streamUrl,
          },
          httpsAgent,
        });
        
        iframeHtml = iframeResponse.data;
        channelKeyMatch = iframeHtml.match(/const\s+CHANNEL_KEY\s*=\s*["']([^"']+)["']/i) ||
                          iframeHtml.match(/CHANNEL_KEY\s*=\s*["']([^"']+)["']/i);
        
        if (channelKeyMatch) {
          console.log(`✅ Found CHANNEL_KEY in iframe: ${channelKeyMatch[1]}`);
          actualIframeUrl = mainIframeUrl;
        }
      } catch (err: any) {
        console.log(`⚠️ Failed to fetch iframe: ${err.message}`);
      }
    }
    
    if (!channelKeyMatch) {
      const channelKey = `premium${channelId}`;
      console.log(`🔄 Using default CHANNEL_KEY: ${channelKey}`);
      return `https://top1.newkso.ru/top1/cdn/${channelKey}/mono.m3u8`;
    }
    
    const channelKey = channelKeyMatch[1];
    console.log(`📝 CHANNEL_KEY: ${channelKey}`);
    
    const apiHost = actualIframeUrl ? new URL(actualIframeUrl).origin : "https://kondoplay.cfd";
    const fetchMatch = iframeHtml.match(/fetchWithRetry\(\s*['"]([^'"]+)['"]/i);
    const apiPath = fetchMatch ? fetchMatch[1] : '/server_lookup.php?channel_id=';
    
    const lookupUrl = `${apiHost}${apiPath}${channelKey}`;
    console.log(`🔍 Calling server lookup API: ${lookupUrl}`);
    
    try {
      const apiResponse = await axios.get(lookupUrl, {
        timeout: 5000,
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Referer": actualIframeUrl || streamUrl,
        },
        httpsAgent,
      });

      let serverKey = "top1/cdn";
      
      if (apiResponse.data) {
        if (typeof apiResponse.data === 'object' && apiResponse.data.server_key) {
          serverKey = apiResponse.data.server_key;
        } else if (typeof apiResponse.data === 'string') {
          const match = apiResponse.data.match(/["':]\s*["']?([a-z0-9/]+)["']?/i);
          if (match) serverKey = match[1];
        }
      }
      
      let m3u8Url;
      if (serverKey === "top1/cdn") {
        m3u8Url = `https://top1.newkso.ru/top1/cdn/${channelKey}/mono.m3u8`;
      } else {
        m3u8Url = `https://${serverKey}new.newkso.ru/${serverKey}/${channelKey}/mono.m3u8`;
      }
      
      console.log(`✅ Server key: ${serverKey}`);
      console.log(`📺 Final M3U8: ${m3u8Url}`);
      return m3u8Url;
    } catch (apiError: any) {
      console.log(`⚠️ API call failed: ${apiError.message}, using top1/cdn fallback`);
      const fallbackUrl = `https://top1.newkso.ru/top1/cdn/${channelKey}/mono.m3u8`;
      console.log(`📺 Fallback M3U8: ${fallbackUrl}`);
      return fallbackUrl;
    }
  } catch (error: any) {
    console.log(`⚠️ API lookup failed for channel ${channelId}: ${error.message}`);
    return null;
  }
}

async function getM3U8Direct(channelId: string): Promise<string[]> {
  const channelKey = `premium${channelId}`;
  
  const urls = SERVER_PATTERNS.map((server) => {
    if (server.key === "top1/cdn") {
      return `${server.url}/${channelKey}/mono.m3u8`;
    } else {
      return `${server.url}/${channelKey}/mono.m3u8`;
    }
  });

  const working: string[] = [];
  
  const results = await Promise.allSettled(
    urls.map(async (url) => {
      try {
        const response = await axios.head(url, {
          timeout: 3000,
          httpsAgent,
        });
        if (response.status === 200) {
          return url;
        }
      } catch {
        return null;
      }
      return null;
    })
  );

  results.forEach((result) => {
    if (result.status === "fulfilled" && result.value) {
      working.push(result.value);
    }
  });

  return working;
}

export async function getAllStreamVariations(channelId: string, channelName: string, category: string): Promise<DaddyLiveStream[]> {
  const streams: DaddyLiveStream[] = [];
  
  console.log(`🔍 Fetching m3u8 streams for ${channelName} (ID: ${channelId})...`);
  
  const apiUrl = await getM3U8ViaAPI(channelId);
  if (apiUrl) {
    streams.push({
      name: `🔴 ${channelName}`,
      title: "Live Stream",
      url: apiUrl,
      httpReferrer: "https://dlhd.dad/",
    });
  }
  
  const directUrls = await getM3U8Direct(channelId);
  directUrls.forEach((url, index) => {
    if (!streams.some(s => s.url === url)) {
      streams.push({
        name: `🔴 ${channelName} [Backup ${index + 1}]`,
        title: "Backup Stream",
        url: url,
        httpReferrer: "https://dlhd.dad/",
      });
    }
  });

  if (streams.length === 0) {
    console.log(`⚠️ No m3u8 streams found, using fallback pattern`);
    const channelKey = `premium${channelId}`;
    const fallbackUrl = `https://top1.newkso.ru/top1/cdn/${channelKey}/mono.m3u8`;
    streams.push({
      name: `🔴 ${channelName}`,
      title: "Live Stream",
      url: fallbackUrl,
      httpReferrer: "https://dlhd.dad/",
    });
  }

  console.log(`📤 Returning ${streams.length} stream(s) for ${channelName}`);
  return streams;
}

