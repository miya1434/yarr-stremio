/**
 * Provider preset mappings for simplified manifest configuration
 */

export interface ProviderConfig {
  [key: string]: boolean;
}

export function applyProviderPreset(preset: string = "all"): ProviderConfig {
  const config: ProviderConfig = {};
  
  // Public trackers (always reliable)
  const publicProviders = [
    "enableYts",
    "enableEztv",
    "enable1337x",
    "enableThePirateBay",
    "enableRarbg",
    "enableTorrentGalaxy",
    "enableLimeTorrents",
    "enableYIFY",
  ];
  
  // Movie-focused providers
  const movieProviders = [
    ...publicProviders,
    "enableKickassTorrents",
    "enableTorLock",
    "enableTorrentDownload",
    "enableTorrentProject",
    "enableMagnetDL",
    "enableTorrentFunk",
    "enableBitSearch",
    "enableSolidTorrents",
    "enableTorrentSeeker",
  ];
  
  // TV-focused providers
  const tvProviders = [
    "enableEztv",
    "enableETTV",
    "enableShowRSS",
    "enable1337x",
    "enableThePirateBay",
    "enableTorrentGalaxy",
    "enableGloDLS",
  ];
  
  // Anime providers
  const animeProviders = [
    "enableNyaaSi",
    "enableTokyoTosho",
    "enableAniDex",
    "enableSubsPlease",
    "enableHorribleSubs",
    "enableErai",
    "enableAniLibria",
    "enableShanaProject",
    "enableAnimeTosho",
  ];
  
  // International providers
  const internationalProviders = [
    "enableRutor",
    "enableRutracker",
    "enableMeduza",
    "enableKinoPoisk",
    "enableCinemageddon",
    "enableDMHY",
    "enableACGRip",
    "enableMejorTorrent",
    "enableEliteTorrent",
    "enableTorrentLand",
    "enableComandoTorrents",
    "enableWolfmax4k",
    "enableBludv",
    "enableMicoleaoDublado",
  ];
  
  // All providers
  const allProviders = [
    ...publicProviders,
    "enableKickassTorrents",
    "enableTorLock",
    "enableTorrentDownload",
    "enableTorrentProject",
    "enableMagnetDL",
    "enableTorrentFunk",
    "enableBitSearch",
    "enableSolidTorrents",
    "enableTorrentSeeker",
    "enableZooqle",
    "enableTorrentz2",
    "enableSkyTorrents",
    "enableBTDB",
    "enableTorrentDownloads",
    "enableTPBClean",
    "enableBestTorrents",
    "enableETTV",
    "enableShowRSS",
    "enableGloDLS",
    ...animeProviders,
    "enableShanaProject",
    "enableAnimeTosho",
    ...internationalProviders,
    "enableTorrent9",
    "enableIlCorSaRoNeRo",
    "enableMeduza",
    "enableKinoPoisk",
    "enableCinemageddon",
    "enableEliteTorrent",
    "enableTorrentLand",
    "enableCinecalidad",
    "enableJackett",
    "enableProwlarr",
    "enableZilean",
    "enableNcore",
    "enableInsane",
    
  ];
  
  // Apply preset
  let selectedProviders: string[] = [];
  
  switch (preset.toLowerCase()) {
    case "all":
      selectedProviders = allProviders;
      break;
    case "movies":
      selectedProviders = movieProviders;
      break;
    case "tv":
      selectedProviders = tvProviders;
      break;
    case "anime":
      selectedProviders = animeProviders;
      break;
    case "international":
      selectedProviders = internationalProviders;
      break;
    case "minimal":
      
      selectedProviders = [
        "enableYts",           
        "enableEztv",          
        "enable1337x",         
        "enableNyaaSi",        
        "enableJackett",       
        "enableProwlarr",      
        "enableZilean",        
      ];
      break;
    default:
      selectedProviders = allProviders;
  }
  
  
  for (const provider of selectedProviders) {
    config[provider] = true;
  }
  
  return config;
}

/**
 * Merge user config with provider preset
 */
export function mergeConfigWithPreset(userConfig: any): any {
  const preset = userConfig?.providerPreset || "all";
  const providerConfig = applyProviderPreset(preset);
  
  console.log(`📦 Provider preset: ${preset}`);
  console.log(`✅ Enabled providers:`, Object.keys(providerConfig).filter(k => providerConfig[k]).length);
  

  const merged = {
    ...providerConfig,
    ...userConfig,
  };
  
  
  for (const key in merged) {
    if (merged[key] === true) {
      merged[key] = "on";
    }
  }
  
  return merged;
}

