
export interface YARRPreset {
  id: string;
  name: string;
  description: string;
  emoji: string;
  config: any;
}

export const COMMUNITY_PRESETS: YARRPreset[] = [
  {
    id: "torrentio-replacement",
    name: "Torrentio Replacement",
    emoji: "🔄",
    description: "Exact same providers as Torrentio but self-hosted with zero downtime",
    config: {
   
      enableYts: "on",
      enableEztv: "on",
      enableRarbg: "on",
      enable1337x: "on",
      enableThePirateBay: "on",
      enableKickassTorrents: "on",
      enableTorrentGalaxy: "on",
      enableMagnetDL: "on",
      enableHorribleSubs: "on",
      enableNyaaSi: "on",
      enableTokyoTosho: "on",
      enableAniDex: "on",
      enableRutor: "on",
      enableRutracker: "",
      enableComando: "on",
      enableBluDV: "on",
      enableMicoLeaoDublado: "on",
      enableTorrent9: "on",
      enableIlCorSaRoNeRo: "on",
      enableMejorTorrent: "on",
      enableWolfmax4k: "on",
      enableCinecalidad: "on",
      enableBestTorrents: "on",
      sortBy: "Quality then Seeders",
      maxResults: "5",
      minSeeders: "0",
      formatter: "google-light",
      enableRTN: "on",
      showStatistics: "on",
      disableCam: "on",
      disable3d: "on",
    },
  },
  {
    id: "4k-hdr-enthusiast",
    name: "4K HDR Enthusiast",
    emoji: "🔥",
    description: "Only 4K and HDR content from best quality sources. Perfect for home theater setups.",
    config: {
      
      enableRarbg: "on",
      enableTorrentGalaxy: "on",
      enable1337x: "on",
      enableThePirateBay: "on",
      enableLimeTorrents: "on",
      enableYts: "", 
      sortBy: "Cached First then Quality",
      sortCached: "Quality then Size",
      maxResults: "10",
      minSeeders: "20", 
      formatter: "prism",
      enableRTN: "on",
      showStatistics: "on",
      // Only show 4K
      disable1080p: "",
      disable720p: "",
      disable480p: "",
      disableCam: "on",
      disable3d: "on",
      priorityLanguage: "None",
    },
  },
  {
    id: "anime-specialist",
    name: "Anime Specialist",
    emoji: "🎌",
    description: "All 7 anime trackers enabled. Best anime coverage available in any Stremio addon.",
    config: {
      // ANIME TRACKERS ARE GONNA BE WORKED ON ITS JUST A LOT OF STUFF!!
      enableNyaaSi: "on",
      enableTokyoTosho: "on",
      enableAniDex: "on",
      enableHorribleSubs: "on",
      enableSubsPlease: "on",
      enableAniLibria: "on",
      enableErai: "on",
      // Disable non-anime
      enableYts: "",
      enableEztv: "",
      sortBy: "Quality then Seeders",
      maxResults: "10",
      minSeeders: "5",
      formatter: "google-light",
      enableRTN: "on",
      showStatistics: "on",
      priorityLanguage: "Japanese",
    },
  },
  {
    id: "international-spanish",
    name: "International - Spanish/Latino",
    emoji: "🇪🇸",
    description: "Spanish and Latino content specialists. Best for Spanish-language media.",
    config: {
      enableMejorTorrent: "on",
      enableWolfmax4k: "on",
      enableCinecalidad: "on",
      // Also enable general trackers
      enable1337x: "on",
      enableThePirateBay: "on",
      enableRarbg: "on",
      sortBy: "Quality then Seeders",
      maxResults: "8",
      minSeeders: "3",
      formatter: "google-light",
      enableRTN: "on",
      showStatistics: "on",
      priorityLanguage: "Spanish",
    },
  },
  {
    id: "international-portuguese",
    name: "International - Portuguese/Brazilian",
    emoji: "🇵🇹",
    description: "Portuguese and Brazilian content. Best for Portuguese-language media.",
    config: {
      enableComando: "on",
      enableBluDV: "on",
      enableMicoLeaoDublado: "on",
      enable1337x: "on",
      enableThePirateBay: "on",
      enableRarbg: "on",
      sortBy: "Quality then Seeders",
      maxResults: "8",
      minSeeders: "3",
      formatter: "google-light",
      enableRTN: "on",
      showStatistics: "on",
      priorityLanguage: "Portuguese",
    },
  },
  {
    id: "speed-demon",
    name: "Speed Demon",
    emoji: "⚡",
    description: "Only the fastest, most reliable providers. Optimized for quick results.",
    config: {
      // Top 5 fastest providers
      enableYts: "on",
      enableEztv: "on",
      enableRarbg: "on",
      enableNyaaSi: "on",
      enableTorrentGalaxy: "on",
      sortBy: "Seeders",
      maxResults: "3", // Fewer results, faster
      minSeeders: "50", // Only well-seeded
      formatter: "ultra-clean",
      enableRTN: "on",
      showStatistics: "on",
      disableCam: "on",
      disable3d: "on",
    },
  },
  {
    id: "quality-over-quantity",
    name: "Quality Over Quantity",
    emoji: "💎",
    description: "Only trusted release groups and quality sources. No junk.",
    config: {
      enableRarbg: "on",
      enableTorrentGalaxy: "on",
      enable1337x: "on",
      enableYts: "on", // YTS is trusted for movies
      enableNyaaSi: "on", // Trusted for anime
      sortBy: "Quality then Seeders",
      maxResults: "5",
      minSeeders: "10",
      formatter: "pro",
      enableRTN: "on", // RTN filters for quality groups
      showStatistics: "on",
      disableCam: "on",
      disable3d: "on",
      disableRemux: "", // Keep REMUX for quality
    },
  },
  {
    id: "maximum-coverage",
    name: "Maximum Coverage",
    emoji: "🌐",
    description: "ALL 57 providers enabled. Find everything that exists.",
    config: {
      // Enable ALL providers
      enableYts: "on",
      enableEztv: "on",
      enable1337x: "on",
      enableThePirateBay: "on",
      enableRarbg: "on",
      enableKickassTorrents: "on",
      enableTorrentGalaxy: "on",
      enableMagnetDL: "on",
      enableNyaaSi: "on",
      enableTokyoTosho: "on",
      enableAniDex: "on",
      enableProwlarr: "", // User needs to configure
      enableZilean: "", // User needs to configure
      enableRutor: "on",
      enableComando: "on",
      enableBluDV: "on",
      enableTorrent9: "on",
      enableIlCorSaRoNeRo: "on",
      enableMejorTorrent: "on",
      enableWolfmax4k: "on",
      enableCinecalidad: "on",
      enableBestTorrents: "on",
      enableMicoLeaoDublado: "on",
      enableLimeTorrents: "on",
      enableZooqle: "on",
      enableETTV: "on",
      enableTorrentDownloads: "on",
      enableBTDB: "on",
      enableTorrentz2: "on",
      enableHorribleSubs: "on",
      enableSubsPlease: "on",
      enableAniLibria: "on",
      enableErai: "on",
      enableSkyTorrents: "on",
      enableGloTorrents: "on",
      enableTorLock: "on",
      enableYIFY: "on",
      enableSolidTorrents: "on",
      enableTorrentProject: "on",
      enableTPBClean: "on",
      enableTorrentFunk: "on",
      sortBy: "Quality then Seeders",
      maxResults: "10",
      minSeeders: "0",
      formatter: "google-light",
      enableRTN: "on",
      showStatistics: "on",
    },
  },
  {
    id: "mobile-optimized",
    name: "Mobile Optimized",
    emoji: "📱",
    description: "Compact format, fewer results, faster loading. Perfect for phones.",
    config: {
      enableYts: "on",
      enableEztv: "on",
      enableRarbg: "on",
      enable1337x: "on",
      enableNyaaSi: "on",
      sortBy: "Quality then Seeders",
      maxResults: "3", 
      minSeeders: "10",
      formatter: "compact", 
      enableRTN: "on",
      showStatistics: "",
      disableCam: "on",
      disable3d: "on",
      disable4k: "on", 
    },
  },
];

export function getPreset(id: string): YARRPreset | null {
  return COMMUNITY_PRESETS.find((p) => p.id === id) || null;
}

export function listPresets(): YARRPreset[] {
  return COMMUNITY_PRESETS.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    emoji: p.emoji,
    config: {}, 
  }));
}

export function applyPreset(presetId: string, currentConfig: any): any {
  const preset = getPreset(presetId);
  if (!preset) {
    throw new Error(`Preset ${presetId} not found`);
  }

  
  return {
    ...currentConfig,
    ...preset.config,
  };
}

