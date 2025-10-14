import { Manifest } from "stremio-addon-sdk";

export const manifest: Manifest = {
  id: "community.yarr",
  version: "0.1.0",
  catalogs: [
    {
      id: "yarr-trending",
      type: "movie",
      name: "YARR! Trending",
      extra: [{ name: "skip" }],
    },
    {
      id: "yarr-trending",
      type: "series",
      name: "YARR! Trending",
      extra: [{ name: "skip" }],
    },
    {
      id: "yarr-popular",
      type: "movie",
      name: "YARR! Popular",
      extra: [{ name: "skip" }],
    },
    {
      id: "yarr-popular",
      type: "series",
      name: "YARR! Popular",
      extra: [{ name: "skip" }],
    },
  ],
  resources: ["catalog", "stream"],
  types: ["movie", "series"],
  name: "YARR!",
  description:
    "High-performance torrent addon • 58+ torrent sources • 3000+ IPTV channels (TVPass, Hilay, A1XS, Pluto, Plex, Roku + 300 more) • HBO, ESPN, Sky Sports • Multi-debrid • Zero config",
  logo: "https://spooky.host/yarrwhite.png",
  background: "https://spooky.host/yarrbg.png",
  idPrefixes: ["tt", "kitsu"],
  behaviorHints: {
    // @ts-ignore
    configurable: true,
    configurationRequired: false,
  },
  config: [
    {
      title: "Enable Live TV (All Providers)",
      key: "enableLiveTV",
      type: "checkbox",
    },
    {
      title: "Search Speed",
      key: "speedPreference",
      type: "select",
      // @ts-ignore
      options: ["fast", "balanced", "comprehensive"],
      default: "balanced",
    },
    {
      title: "Content Type",
      key: "providerPreset",
      type: "select",
      // @ts-ignore
      options: ["all", "movies", "tv", "anime", "international"],
      default: "all",
    },
    {
      title: "Languages (comma-separated)",
      key: "priorityLanguage",
      type: "text",
      default: "",
    },
    {
      title: "Debrid Service",
      key: "debridService",
      type: "select",
      // @ts-ignore
      options: ["None", "RealDebrid", "Premiumize", "AllDebrid", "DebridLink", "TorBox", "PikPak"],
      default: "None",
    },
    {
      title: "Debrid API Key",
      key: "debridApiKey",
      type: "password",
    },
    {
      title: "Max Results per Quality",
      key: "maxResults",
      type: "text",
      default: "5",
    },
    {
      title: "Display Style",
      key: "formatter",
      type: "select",
      // @ts-ignore
      options: ["ultra-clean", "google-light", "compact", "torrentio", "detailed"],
      default: "ultra-clean",
    },
    {
      title: "Show Statistics Summary",
      key: "showStatistics",
      type: "checkbox",
      default: "checked",
    },
    {
      title: "Remove Adult Content",
      key: "removeAdultContent",
      type: "checkbox",
      default: "checked",
    },
    {
      title: "Block CAM/TS Quality",
      key: "disableCam",
      type: "checkbox",
      default: "checked",
    },
    {
      title: "Min Seeders",
      key: "minSeeders",
      type: "text",
      default: "5",
    },
    
    // ═══════════════════════════════════════════════════════════
    // ADVANCED - Addon Aggregation
    // ═══════════════════════════════════════════════════════════
    {
      title: "Enable Addon Aggregation",
      key: "enableAggregation",
      type: "checkbox",
    },
    {
      title: "External Addon 1 URL",
      key: "externalAddon1Url",
      type: "text",
    },
    {
      title: "External Addon 2 URL",
      key: "externalAddon2Url",
      type: "text",
    },
    {
      title: "External Addon 3 URL",
      key: "externalAddon3Url",
      type: "text",
    },
    {
      title: "Prowlarr URL",
      key: "prowlarrUrl",
      type: "text",
    },
    {
      title: "Prowlarr API Key",
      key: "prowlarrKey",
      type: "password",
    },
    {
      title: "Jackett URL",
      key: "jackettUrl",
      type: "text",
    },
    {
      title: "Jackett API Key",
      key: "jackettKey",
      type: "password",
    },
    {
      title: "Zilean URL",
      key: "zileanUrl",
      type: "text",
      default: "https://zilean.elfhosted.com",
    },
    
    // ═══════════════════════════════════════════════════════════
    // ADVANCED - Trakt Integration
    // ═══════════════════════════════════════════════════════════
    {
      title: "Trakt Token",
      key: "traktToken",
      type: "password",
    },
    {
      title: "Sort Results By",
      key: "sortBy",
      type: "select",
      // @ts-ignore
      options: ["Cached First then Quality", "Quality then Seeders", "Seeders", "Quality"],
      default: "Cached First then Quality",
    },
    {
      title: "Cache Filter",
      key: "cacheFilter",
      type: "select",
      // @ts-ignore
      options: ["Show All", "Only Cached", "Prefer Cached"],
      default: "Prefer Cached",
    },
    {
      title: "Enable RTN Smart Ranking",
      key: "enableRTN",
      type: "checkbox",
      default: "checked",
    },
    {
      title: "Search by Title",
      key: "searchByTitle",
      type: "checkbox",
      default: "checked",
    },
    {
      title: "Block HDR Content",
      key: "disableHdr",
      type: "checkbox",
    },
    {
      title: "Block HEVC/H265",
      key: "disableHevc",
      type: "checkbox",
    },
    {
      title: "Block 4K Content",
      key: "disable4k",
      type: "checkbox",
    },
    {
      title: "Block 3D Content",
      key: "disable3d",
      type: "checkbox",
    },
    {
      title: "Block Remux",
      key: "disableRemux",
      type: "checkbox",
    },
    {
      title: "Block Dolby Vision",
      key: "disableDolbyVision",
      type: "checkbox",
    },
  ],
};
