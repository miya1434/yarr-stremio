import axios from "axios";

export interface DaddyLiveChannel {
  id: string;
  name: string;
  category: string;
  stream_url: string;
  watch_url: string;
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
const STREAM_URL_TEMPLATE = `${BASE_URL}/stream/stream-`;
const SCHEDULE_API = "https://daddylivestream.com/schedule/schedule-generated.php";

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
  { id: "44", name: "ESPN USA", category: "Sports" },
  { id: "45", name: "ESPN2 USA", category: "Sports" },
  { id: "46", name: "ESPN3 USA", category: "Sports" },
  { id: "316", name: "ESPNU USA", category: "Sports" },
  { id: "317", name: "ESPN News USA", category: "Sports" },
  { id: "404", name: "NBA TV USA", category: "Sports" },
  { id: "405", name: "NFL Network", category: "Sports" },
  { id: "399", name: "MLB Network USA", category: "Sports" },
  { id: "408", name: "NHL Network USA", category: "Sports" },
  { id: "321", name: "HBO USA", category: "Premium" },
  { id: "345", name: "CNN USA", category: "News" },
  { id: "347", name: "Fox News", category: "News" },
  { id: "327", name: "MSNBC", category: "News" },
  { id: "346", name: "BBC News", category: "News" },
  { id: "348", name: "Sky News", category: "News" },
  { id: "349", name: "CNBC", category: "News" },
  { id: "350", name: "Bloomberg", category: "News" },
  { id: "322", name: "History USA", category: "Entertainment" },
  { id: "323", name: "Discovery USA", category: "Entertainment" },
  { id: "324", name: "National Geographic USA", category: "Entertainment" },
  { id: "325", name: "Animal Planet USA", category: "Entertainment" },
  { id: "326", name: "TLC USA", category: "Entertainment" },
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
  { id: "410", name: "beIN Sports USA", category: "Sports" },
  { id: "411", name: "beIN Sports 1 USA", category: "Sports" },
  { id: "412", name: "beIN Sports 2 USA", category: "Sports" },
  { id: "413", name: "beIN Sports 3 USA", category: "Sports" },
  { id: "420", name: "Fox Sports 1 USA", category: "Sports" },
  { id: "421", name: "Fox Sports 2 USA", category: "Sports" },
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
  { id: "766", name: "ABC NY USA", category: "USA TV" },
  { id: "767", name: "CBS NY USA", category: "USA TV" },
  { id: "768", name: "FOX NY USA", category: "USA TV" },
  { id: "769", name: "NBCNY USA", category: "USA TV" },
  { id: "770", name: "ABC LA USA", category: "USA TV" },
  { id: "771", name: "CBS LA USA", category: "USA TV" },
  { id: "772", name: "FOX LA USA", category: "USA TV" },
  { id: "773", name: "NBC LA USA", category: "USA TV" },
  { id: "922", name: "SportsNet Pittsburgh", category: "Sports" },
];

export async function scrapeChannelList(): Promise<Map<string, DaddyLiveChannel>> {
  if (channelsCache && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return channelsCache;
  }

  const channels = new Map<string, DaddyLiveChannel>();

  for (const channel of channelData) {
    channels.set(channel.id, {
      id: channel.id,
      name: channel.name,
      category: channel.category,
      stream_url: `${STREAM_URL_TEMPLATE}${channel.id}.php`,
      watch_url: `${WATCH_URL_TEMPLATE}${channel.id}`,
    });
  }

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

