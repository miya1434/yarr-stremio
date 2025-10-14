/**
 * Configuration import/export - Inspired by AIOStreams
 * Allows users to backup and migrate their settings
 */

export interface YARRConfig {
  version: string;
  providers: Record<string, boolean>;
  debrid: {
    service: string;
    apiKey?: string;
  };
  prowlarr?: {
    url?: string;
    apiKey?: string;
  };
  zilean?: {
    url?: string;
  };
  sorting: {
    mode: string;
    minSeeders: number;
    maxResults: number;
  };
  filters: {
    language?: string;
    disableHdr?: boolean;
    disableHevc?: boolean;
    disable4k?: boolean;
    disableCam?: boolean;
    disable3d?: boolean;
    disableRemux?: boolean;
    disableDolbyVision?: boolean;
  };
  features: {
    enableRTN: boolean;
    enableML: boolean;
    searchByTitle: boolean;
    removeAdultContent: boolean;
    formatter: string;
    showStatistics: boolean;
    showExternalDownloads: boolean;
  };
  trakt?: {
    token?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export function exportConfig(config: any): string {
  const yarrConfig: YARRConfig = {
    version: "0.1.0",
    providers: extractProviders(config),
    debrid: {
      service: config.debridService || "None",
      apiKey: config.debridApiKey ? "***REDACTED***" : undefined,
    },
    prowlarr: config.enableProwlarr === "on" ? {
      url: config.prowlarrUrl,
      apiKey: config.prowlarrKey ? "***REDACTED***" : undefined,
    } : undefined,
    zilean: config.enableZilean === "on" ? {
      url: config.zileanUrl,
    } : undefined,
    sorting: {
      mode: config.sortBy || "Quality then Seeders",
      minSeeders: parseInt(config.minSeeders || "0"),
      maxResults: parseInt(config.maxResults || "5"),
    },
    filters: {
      language: config.priorityLanguage,
      disableHdr: config.disableHdr === "on",
      disableHevc: config.disableHevc === "on",
      disable4k: config.disable4k === "on",
      disableCam: config.disableCam === "on",
      disable3d: config.disable3d === "on",
      disableRemux: config.disableRemux === "on",
      disableDolbyVision: config.disableDolbyVision === "on",
    },
    features: {
      enableRTN: config.enableRTN === "on",
      enableML: config.enableML === "on",
      searchByTitle: config.searchByTitle === "on",
      removeAdultContent: config.removeAdultContent === "on",
      formatter: config.formatter || "yarr",
      showStatistics: config.showStatistics === "on",
      showExternalDownloads: config.showExternalDownloads === "on",
    },
    trakt: config.traktToken ? {
      token: "***REDACTED***",
    } : undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return JSON.stringify(yarrConfig, null, 2);
}

function extractProviders(config: any): Record<string, boolean> {
  const providers: Record<string, boolean> = {};
  const providerKeys = [
    "enableYts", "enableEztv", "enable1337x", "enableThePirateBay",
    "enableRarbg", "enableKickassTorrents", "enableTorrentGalaxy",
    "enableMagnetDL", "enableNyaaSi", "enableTokyoTosho", "enableAniDex",
    "enableJackett", "enableProwlarr", "enableZilean", "enableRutor",
    "enableComando", "enableBluDV", "enableTorrent9", "enableIlCorSaRoNeRo",
    "enableMejorTorrent", "enableWolfmax4k", "enableCinecalidad",
    "enableBestTorrents", "enableMicoLeaoDublado", "enableLimeTorrents",
    "enableZooqle", "enableETTV", "enableTorrentDownloads",
    "enableBTDB", "enableTorrentz2", "enableSkyTorrents",
    "enableGloTorrents", "enableTorLock", "enableYIFY",
    "enableSolidTorrents", "enableTorrentProject", "enableTPBClean",
    "enableTorrentFunk", "enableHorribleSubs", "enableSubsPlease",
    "enableAniLibria", "enableErai",
  ];

  for (const key of providerKeys) {
    const providerName = key.replace("enable", "");
    providers[providerName] = config[key] === "on";
  }

  return providers;
}

export function importConfig(jsonString: string): any {
  try {
    const imported: YARRConfig = JSON.parse(jsonString);
    
    // Convert back to YARR! config format
    const config: any = {};

    // Providers
    for (const [name, enabled] of Object.entries(imported.providers)) {
      config[`enable${name}`] = enabled ? "on" : "";
    }

    // Debrid
    config.debridService = imported.debrid.service;
    // Note: API keys won't be imported for security

    // Prowlarr
    if (imported.prowlarr) {
      config.enableProwlarr = "on";
      config.prowlarrUrl = imported.prowlarr.url;
      // Note: API key won't be imported
    }

    // Zilean
    if (imported.zilean) {
      config.enableZilean = "on";
      config.zileanUrl = imported.zilean.url;
    }

    // Sorting
    config.sortBy = imported.sorting.mode;
    config.minSeeders = imported.sorting.minSeeders.toString();
    config.maxResults = imported.sorting.maxResults.toString();

    // Filters
    config.priorityLanguage = imported.filters.language;
    config.disableHdr = imported.filters.disableHdr ? "on" : "";
    config.disableHevc = imported.filters.disableHevc ? "on" : "";
    config.disable4k = imported.filters.disable4k ? "on" : "";
    config.disableCam = imported.filters.disableCam ? "on" : "";
    config.disable3d = imported.filters.disable3d ? "on" : "";
    config.disableRemux = imported.filters.disableRemux ? "on" : "";
    config.disableDolbyVision = imported.filters.disableDolbyVision ? "on" : "";

    // Features
    config.enableRTN = imported.features.enableRTN ? "on" : "";
    config.enableML = imported.features.enableML ? "on" : "";
    config.searchByTitle = imported.features.searchByTitle ? "on" : "";
    config.removeAdultContent = imported.features.removeAdultContent ? "on" : "";
    config.formatter = imported.features.formatter;
    config.showStatistics = imported.features.showStatistics ? "on" : "";
    config.showExternalDownloads = imported.features.showExternalDownloads ? "on" : "";

    // Note: Trakt token won't be imported for security

    return config;
  } catch (error) {
    console.error("Config import error:", error);
    throw new Error("Invalid configuration file");
  }
}

