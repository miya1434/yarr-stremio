import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface M3UChannel {
  id: string;
  name: string;
  tvgId: string;
  logo: string;
  group: string;
  url: string;
  provider: string;
}

function getAllM3UFiles(directory: string): Array<{ name: string; file: string; provider: string }> {
  if (!fs.existsSync(directory)) {
    return [];
  }
  
  const files = fs.readdirSync(directory);
  const m3uFiles = files.filter((f) => f.endsWith(".m3u"));
  
  return m3uFiles.map((file) => {
    const baseName = file.replace(".m3u", "");
    const providerName = baseName.replace(/_/g, " ").toUpperCase();
    
    return {
      name: providerName,
      file,
      provider: baseName,
    };
  });
}

let channelsCache: M3UChannel[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 12 * 60 * 60 * 1000;

export async function parseM3U(content: string, provider: string): Promise<M3UChannel[]> {
  const channels: M3UChannel[] = [];
  const lines = content.split("\n");
  
  let currentChannel: Partial<M3UChannel> | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith("#EXTINF:")) {
      const tvgIdMatch = line.match(/tvg-id="([^"]*)"/);
      const tvgNameMatch = line.match(/tvg-name="([^"]*)"/);
      const tvgLogoMatch = line.match(/tvg-logo="([^"]*)"/);
      const groupMatch = line.match(/group-title="([^"]*)"/);
      
      const namePart = line.split(",").slice(1).join(",").trim();
      
      currentChannel = {
        tvgId: tvgIdMatch ? tvgIdMatch[1] : "",
        logo: tvgLogoMatch ? tvgLogoMatch[1] : "",
        group: groupMatch ? groupMatch[1] : "Uncategorized",
        name: namePart || (tvgNameMatch ? tvgNameMatch[1] : "Unknown"),
        provider,
      };
    } else if (line.startsWith("http") && currentChannel) {
      currentChannel.url = line;
      currentChannel.id = `${provider}_${channels.length}`;
      
      if (currentChannel.name && currentChannel.url) {
        channels.push(currentChannel as M3UChannel);
      }
      
      currentChannel = null;
    }
  }
  
  return channels;
}

export async function fetchAllM3UChannels(): Promise<M3UChannel[]> {
  if (channelsCache && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return channelsCache;
  }
  
  const m3uDir = path.join(__dirname, "m3u-sources");
  const m3uFiles = getAllM3UFiles(m3uDir);
  
  if (m3uFiles.length === 0) {
    console.log(`⚠️ No M3U files found in ${m3uDir}`);
    return [];
  }
  
  console.log(`📡 Loading ${m3uFiles.length} M3U playlists...`);
  
  const allChannels: M3UChannel[] = [];
  
  const results = await Promise.allSettled(
    m3uFiles.map(async (source) => {
      try {
        const filePath = path.join(m3uDir, source.file);
        const content = fs.readFileSync(filePath, "utf-8");
        const channels = await parseM3U(content, source.provider);
        
        if (channels.length > 0) {
          console.log(`  ✅ ${source.name}: ${channels.length} channels`);
        }
        
        return channels;
      } catch (error: any) {
        console.error(`  ❌ ${source.name}: ${error.message}`);
        return [];
      }
    })
  );
  
  results.forEach((result) => {
    if (result.status === "fulfilled") {
      allChannels.push(...result.value);
    }
  });
  
  channelsCache = allChannels;
  cacheTimestamp = Date.now();
  
  console.log(`📊 Total M3U channels loaded: ${allChannels.length} from ${m3uFiles.length} providers`);
  
  return allChannels;
}

export async function searchM3UChannels(query: string): Promise<M3UChannel[]> {
  const allChannels = await fetchAllM3UChannels();
  const queryLower = query.toLowerCase();
  
  return allChannels.filter(
    (ch) =>
      ch.name.toLowerCase().includes(queryLower) ||
      ch.group.toLowerCase().includes(queryLower)
  );
}

export async function getM3UChannelsByGroup(group: string): Promise<M3UChannel[]> {
  const allChannels = await fetchAllM3UChannels();
  return allChannels.filter((ch) => ch.group === group);
}

export async function getM3UChannelById(id: string): Promise<M3UChannel | null> {
  const allChannels = await fetchAllM3UChannels();
  return allChannels.find((ch) => ch.id === id) || null;
}

