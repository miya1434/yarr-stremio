import { getAllA1XSChannels, getA1XSChannelById, A1XSChannel } from "./a1xs.js";
import { getAllCVTVChannels, getCVTVChannelById, CVTVChannel } from "./cvtv.js";
import { getAllChannels, getChannelById, getAllStreamVariations } from "./daddylive.js";
import { fetchAllM3UChannels, getM3UChannelById } from "./m3u-parser.js";

export interface UnifiedChannel {
  id: string;
  name: string;
  logo: string;
  group: string;
  providers: string[];
}

export interface UnifiedStream {
  name: string;
  title: string;
  url: string;
  httpReferrer?: string;
  behaviorHints?: {
    notWebReady?: boolean;
  };
}

const CHANNEL_MAPPING: { [key: string]: { a1xs?: string; cvtv?: string; daddylive?: string; logo?: string } } = {
  "ESPN": { a1xs: "40000011", cvtv: "ESPNHD", daddylive: "44", logo: "https://pixvid.org/images/2025/01/25/espn-logo-1024.png" },
  "ESPN2": { a1xs: "40000012", cvtv: "ESPN2HD", daddylive: "45", logo: "https://pixvid.org/images/2025/01/25/espn-2.png" },
  "ESPNU": { a1xs: "40000013", daddylive: "316", logo: "https://pixvid.org/images/2025/01/25/espn-u.png" },
  "ESPN News": { a1xs: "40000014", daddylive: "317", logo: "https://pixvid.org/images/2025/01/25/espnews.png" },
  "Fox Sports 1": { a1xs: "40000021", cvtv: "FS1", daddylive: "420", logo: "https://pixvid.org/images/2025/01/25/fs1.png" },
  "Fox Sports 2": { a1xs: "40000022", daddylive: "421", logo: "https://pixvid.org/images/2025/01/25/fs2.png" },
  "MLB Network": { a1xs: "40000030", daddylive: "399", logo: "https://pixvid.org/images/2025/01/25/mlb-nw.png" },
  "NBA TV": { a1xs: "40000031", daddylive: "404", logo: "https://pixvid.org/images/2025/01/25/nba-tv.png" },
  "NFL Network": { a1xs: "40000032", daddylive: "405", logo: "https://pixvid.org/images/2025/01/25/nfl-nw.png" },
  "NHL Network": { a1xs: "40000034", daddylive: "408", logo: "https://pixvid.org/images/2025/01/25/nhl-nw.png" },
  "CNN": { a1xs: "300007", cvtv: "CNNHD", daddylive: "345", logo: "https://i.imgur.com/iXbtNPJ.png" },
  "Fox News": { a1xs: "300011", cvtv: "FoxNewsHD", daddylive: "347", logo: "https://i.imgur.com/m22eA9B.png" },
  "MSNBC": { a1xs: "300008", daddylive: "327", logo: "https://i.imgur.com/hYkqMdI.png" },
  "CNBC": { a1xs: "300009", daddylive: "349", logo: "https://i.imgur.com/iOcdEdH.png" },
  "TNT": { a1xs: "300001", cvtv: "TNTHD", daddylive: "330", logo: "https://i.imgur.com/Oa7yt2Z.png" },
  "TBS": { cvtv: "TBSHD", logo: "https://i.imgur.com/Ks8htcP.png" },
  "truTV": { a1xs: "300002", logo: "https://i.imgur.com/D9Ofkf5.png" },
  "USA Network": { a1xs: "1100020", cvtv: "USAHD", daddylive: "331", logo: "https://pixvid.org/images/2025/01/21/usa-network.png" },
  "Comedy Central": { a1xs: "300004", daddylive: "333", logo: "https://i.imgur.com/nJT6QX9.png" },
  "Nickelodeon": { a1xs: "300030", daddylive: "340", logo: "https://i.imgur.com/jE2YHz0.png" },
  "Cartoon Network": { a1xs: "300032", daddylive: "341", logo: "https://i.imgur.com/draQT6x.png" },
  "Discovery": { a1xs: "300034", cvtv: "HistoryHD", daddylive: "323", logo: "https://i.imgur.com/1eM0KX8.png" },
  "History": { cvtv: "HistoryHD", daddylive: "322", logo: "https://i.imgur.com/1eM0KX8.png" },
  "A&E": { cvtv: "AEHD", logo: "https://i.imgur.com/iXbtNPJ.png" },
  "HGTV": { cvtv: "HGTVHD", logo: "https://i.imgur.com/iXbtNPJ.png" },
  "Lifetime": { cvtv: "LifetimeHD", daddylive: "338", logo: "https://i.imgur.com/iXbtNPJ.png" },
  
  "Sky Sports Main Event": { a1xs: "2000001", daddylive: "440", logo: "https://i.ibb.co/CwMZcpP/sky-main-event.png" },
  "Sky Sports Premier League": { a1xs: "2000002", daddylive: "441", logo: "https://i.ibb.co/rcSRMh9/sky-sports-pl.png" },
  "Sky Sports Football": { a1xs: "2000003", daddylive: "442", logo: "https://i.ibb.co/WcCrBqx/sky-football.png" },
  "Sky Sports F1": { a1xs: "2000005", daddylive: "443", logo: "https://i.ibb.co/h26bK2Q/sky-f1.png" },
  "Sky Sports Cricket": { a1xs: "2000006", daddylive: "445", logo: "https://i.ibb.co/JyPnwvB/sky-cricket.png" },
  "Sky Sports Golf": { a1xs: "2000009", daddylive: "446", logo: "https://i.ibb.co/QvhY4tX/sky-golf.png" },
  "TNT Sports 1": { a1xs: "2000021", logo: "https://i.imgur.com/1EYnddH.png" },
  "TNT Sports 2": { a1xs: "2000022", logo: "https://i.imgur.com/YtGYRIB.png" },
  "TNT Sports 3": { a1xs: "2000023", logo: "https://i.imgur.com/z1d9M65.png" },
  "TNT Sports 4": { a1xs: "2000024", logo: "https://i.imgur.com/K92UuvG.png" },
  
  "PPV 1": { a1xs: "ppv1", logo: "https://i.imgur.com/LoQdSia.png" },
  "PPV 2": { a1xs: "ppv2", logo: "https://i.imgur.com/LoQdSia.png" },
  "PPV 3": { a1xs: "ppv3", logo: "https://i.imgur.com/LoQdSia.png" },
  "PPV 4": { a1xs: "ppv4", logo: "https://i.imgur.com/LoQdSia.png" },
  "PPV 5": { a1xs: "ppv5", logo: "https://i.imgur.com/LoQdSia.png" },
};

export async function getAllUnifiedChannels(): Promise<UnifiedChannel[]> {
  const channels: UnifiedChannel[] = [];
  
  for (const [name, mapping] of Object.entries(CHANNEL_MAPPING)) {
    const providers: string[] = [];
    if (mapping.a1xs) providers.push("a1xs");
    if (mapping.cvtv) providers.push("cvtv");
    if (mapping.daddylive) providers.push("daddylive");
    
    let group = "Entertainment";
    if (name.includes("ESPN") || name.includes("Sport") || name.includes("NFL") || name.includes("NBA") || name.includes("MLB") || name.includes("NHL") || name.includes("PPV")) {
      group = "Sports";
    } else if (name.includes("News") || name.includes("CNN") || name.includes("Fox News") || name.includes("MSNBC")) {
      group = "News";
    }
    
    channels.push({
      id: name.toLowerCase().replace(/\s+/g, "_"),
      name,
      logo: mapping.logo || `https://via.placeholder.com/300x150/1a1a2e/eee?text=${encodeURIComponent(name)}`,
      group,
      providers,
    });
  }
  
  const a1xsChannels = await getAllA1XSChannels();
  for (const ch of a1xsChannels) {
    if (!channels.some((c) => c.name === ch.name)) {
      channels.push({
        id: `a1xs_only_${ch.id}`,
        name: ch.name,
        logo: ch.logo,
        group: ch.group,
        providers: ["a1xs"],
      });
    }
  }
  
  const cvtvChannels = await getAllCVTVChannels();
  for (const ch of cvtvChannels) {
    if (!channels.some((c) => c.name === ch.name)) {
      channels.push({
        id: `cvtv_only_${ch.id}`,
        name: ch.name,
        logo: `https://via.placeholder.com/300x150/1a1a2e/eee?text=${encodeURIComponent(ch.name)}`,
        group: ch.group,
        providers: ["cvtv"],
      });
    }
  }
  
  const m3uChannels = await fetchAllM3UChannels();
  
  const preferredProviders = ["hilay", "tvpass"];
  const preferredChannels = m3uChannels.filter((ch) => preferredProviders.includes(ch.provider));
  
  for (const ch of preferredChannels) {
    if (!channels.some((c) => c.name.toLowerCase() === ch.name.toLowerCase())) {
      channels.push({
        id: `m3u_${ch.id}`,
        name: ch.name,
        logo: ch.logo || `https://via.placeholder.com/300x150/1a1a2e/eee?text=${encodeURIComponent(ch.name)}`,
        group: ch.group,
        providers: [ch.provider],
      });
    }
  }
  
  const popularKeywords = [
    "ESPN", "Fox Sports", "NFL", "NBA", "MLB", "NHL", "beIN", "CBS Sports",
    "HBO", "Showtime", "Cinemax", "Starz", "TNT", "TBS", "USA", "FX",
    "CNN", "Fox News", "MSNBC", "BBC", "Sky News", "CBS News",
    "Discovery", "History", "National Geographic", "Animal Planet",
    "MTV", "Comedy Central", "Nickelodeon", "Cartoon Network", "Disney",
    "Pluto TV", "Sky Sports", "TNT Sports", "Premier League", "UFC", "WWE",
    "ABC", "CBS", "NBC", "FOX", "PBS", "CW",
  ];
  
  const popularChannels = m3uChannels.filter((ch) => 
    !preferredProviders.includes(ch.provider) &&
    popularKeywords.some((keyword) => ch.name.toLowerCase().includes(keyword.toLowerCase()))
  );
  
  for (const ch of popularChannels) {
    if (!channels.some((c) => c.name.toLowerCase() === ch.name.toLowerCase())) {
      channels.push({
        id: `m3u_${ch.id}`,
        name: ch.name,
        logo: ch.logo || `https://via.placeholder.com/300x150/1a1a2e/eee?text=${encodeURIComponent(ch.name)}`,
        group: ch.group,
        providers: [ch.provider],
      });
    }
  }
  
  const remainingChannels = m3uChannels.filter((ch) => 
    !preferredProviders.includes(ch.provider) &&
    !popularChannels.includes(ch) && 
    (ch.provider.startsWith("us_") || ch.provider.startsWith("uk_") || ch.provider.startsWith("ca_"))
  );
  
  for (const ch of remainingChannels.slice(0, 500)) {
    if (!channels.some((c) => c.name.toLowerCase() === ch.name.toLowerCase())) {
      channels.push({
        id: `m3u_${ch.id}`,
        name: ch.name,
        logo: ch.logo || `https://via.placeholder.com/300x150/1a1a2e/eee?text=${encodeURIComponent(ch.name)}`,
        group: ch.group,
        providers: [ch.provider],
      });
    }
  }
  
  console.log(`📊 Unified catalog: ${channels.length} unique channels`);
  
  return channels;
}

export async function getStreamsForChannel(channelId: string, channelName: string): Promise<UnifiedStream[]> {
  const streams: UnifiedStream[] = [];
  
  const cleanChannelName = channelName.replace(/_/g, " ").trim();
  console.log(`🔍 Finding streams for: "${channelName}"`);
  
  const allM3U = await fetchAllM3UChannels();
  const preferredProviders = ["hilay", "tvpass"];
  
  const exactMatches = allM3U.filter((ch) => {
    const chName = ch.name.toLowerCase();
    const targetName = cleanChannelName.toLowerCase();
    
    const exactMatch = chName === targetName;
    const startsWithMatch = chName.startsWith(targetName) || targetName.startsWith(chName);
    const containsFullWord = chName.includes(` ${targetName} `) || 
                             chName.startsWith(`${targetName} `) || 
                             chName.endsWith(` ${targetName}`);
    
    return exactMatch || startsWithMatch || containsFullWord;
  });
  
  const preferredMatches = exactMatches.filter((ch) => preferredProviders.includes(ch.provider));
  const otherMatches = exactMatches.filter((ch) => !preferredProviders.includes(ch.provider));
  
  const sortedMatches = [...preferredMatches, ...otherMatches].slice(0, 10);
  
  console.log(`  Found ${sortedMatches.length} exact matches`);
  
  sortedMatches.forEach((ch) => {
    const providerName = ch.provider.replace(/_/g, " ").toUpperCase();
    streams.push({
      name: `🔴 ${ch.name} [${providerName}]`,
      title: "Live Stream",
      url: ch.url,
      httpReferrer: ch.url.includes("pluto.tv") ? "https://pluto.tv/" : undefined,
    });
  });
  
  const a1xsChannels = await getAllA1XSChannels();
  const a1xsMatch = a1xsChannels.find((ch) => {
    const chName = ch.name.toLowerCase();
    const targetName = cleanChannelName.toLowerCase();
    return chName === targetName || chName.startsWith(targetName);
  });
  
  if (a1xsMatch && !streams.some(s => s.url === a1xsMatch.url)) {
    streams.push({
      name: `🔴 ${a1xsMatch.name} [A1XS]`,
      title: "Live Stream",
      url: a1xsMatch.url,
      httpReferrer: "https://a1xs.vip/",
    });
  }
  
  const cvtvChannels = await getAllCVTVChannels();
  const cvtvMatch = cvtvChannels.find((ch) => {
    const chName = ch.name.toLowerCase();
    const targetName = cleanChannelName.toLowerCase();
    return chName === targetName || chName.startsWith(targetName);
  });
  
  if (cvtvMatch && !streams.some(s => s.url === cvtvMatch.url)) {
    streams.push({
      name: `🔴 ${cvtvMatch.name} [CVTV]`,
      title: "Live Stream",
      url: cvtvMatch.url,
      httpReferrer: "https://cvtv.cvalley.net/",
    });
  }
  
  console.log(`📤 Returning ${streams.length} stream(s) for "${channelName}"`);
  return streams;
}

export async function getChannelsByGroup(group: string): Promise<UnifiedChannel[]> {
  const allChannels = await getAllUnifiedChannels();
  return allChannels.filter((ch) => ch.group === group);
}

