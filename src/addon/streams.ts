import { Request } from "express";
import Stremio from "stremio-addon-sdk";
import {
  TorrentCategory,
  TorrentSearchResult,
  TorrentSource,
  searchTorrents,
} from "../torrent/search.js";
import { getTorrentInfo } from "../torrent/webtorrent.js";
import { getReadableSize, isSubtitleFile, isVideoFile } from "../utils/file.js";
import { getTitles } from "../utils/imdb.js";
import { guessLanguage, prioritizeByLanguage } from "../utils/language.js";
import { guessQuality } from "../utils/quality.js";
import { isFileNameMatch, isTorrentNameMatch } from "../utils/shows.js";
import { cache } from "../utils/cache.js";
import { getDebridService } from "../debrid/index.js";
import { calculateTorrentScore } from "../utils/rtn-ranking.js";
import { mlEngine } from "../utils/ml-engine.js";
import { enhanceMagnetLink, isAnimeTracker, isRussianTracker, getTrackerSources } from "../utils/trackers.js";
import { getTraktAliases } from "../metadata/trakt.js";
import { parseTorrentName, getQualityFromParsed, formatQualityName, getBingeGroup, isSameInfo } from "../utils/torrent-parser.js";
import { cleanOutputObject } from "../utils/error-handler.js";
import { streamQueue } from "../utils/request-queue.js";
import { getFormatter, FormatterType } from "../utils/formatters.js";
import { calculateStatistics, formatStatisticsStream } from "../utils/statistics.js";
import { getSortFunction } from "../utils/sort-functions.js";
import { aggregateExternalAddons, convertExternalStream, ExternalAddon } from "../utils/addon-aggregator.js";
import { mergeConfigWithPreset } from "../utils/provider-presets.js";

interface HandlerArgs {
  type: string;
  id: string;
  config?: {
    
    speedPreference?: string;
    
    providerPreset?: string;
    
    enableJackett: string;
    jackettUrl: string;
    jackettKey: string;
    enableNcore: string;
    nCoreUser: string;
    nCorePassword: string;
    enableInsane: string;
    insaneUser: string;
    insanePassword: string;
    enableItorrent: string;
    enableYts: string;
    enableEztv: string;
    
    enable1337x: string;
    enableThePirateBay: string;
    enableRarbg: string;
    enableKickassTorrents: string;
    enableTorrentGalaxy: string;
    enableMagnetDL: string;
    enableNyaaSi: string;
    enableTokyoTosho: string;
    enableAniDex: string;
    enableCinecalidad: string;
    enableMiTorrent: string;
    enablePelisPanda: string;
    enableRutracker: string;
    
    enableProwlarr: string;
    prowlarrUrl: string;
    prowlarrKey: string;
    enableZilean: string;
    zileanUrl: string;
    
    enableRutor: string;
    enableComando: string;
    enableBluDV: string;
    enableTorrent9: string;
    enableIlCorSaRoNeRo: string;
    enableMejorTorrent: string;
    enableWolfmax4k: string;
    enableBestTorrents: string;
    enableMicoLeaoDublado: string;
   
    enableZooqle: string;
    enableETTV: string;
    enableTorrentDownloads: string;
    enableTorrentz2: string;
    enableSkyTorrents: string;
    enableSolidTorrents: string;
    enableTorrentFunk: string;
    
    enableHorribleSubs: string;
    enableSubsPlease: string;
    enableAniLibria: string;
    enableErai: string;
    
    debridService: string;
    debridApiKey: string;
   
    sortBy: string;
    sortCached: string;
    minSeeders: string;
    maxResults: string;
    priorityLanguage: string;
    searchByTitle: string;
    enableRTN: string;
    enableML: string;
    traktToken: string;
    removeAdultContent: string;
    formatter: string;
    showStatistics: string;
    showExternalDownloads: string;
    
    enableAggregation: string;
    externalAddon1Name: string;
    externalAddon1Url: string;
    externalAddon2Name: string;
    externalAddon2Url: string;
    externalAddon3Name: string;
    externalAddon3Url: string;
    
    disableHdr: string;
    disableHevc: string;
    disable4k: string;
    disableCam: string;
    disable3d: string;
    allow4k: string;
    allow1440p: string;
    allow1080p: string;
    allow720p: string;
    allow480p: string;
    allow360p: string;
    disableRemux: string;
    disableDolbyVision: string;
  };
  req: Request;
}

export const streamHandler = async ({ type, id, config, req }: HandlerArgs) => {
  
  config = mergeConfigWithPreset(config) as any;
  

  return streamQueue.wrap(id, async () => {
    const cacheKey = `streams:${type}:${id}:${JSON.stringify(config)}`;
    
  
    const cachedResult = cache.get<any>(cacheKey);
    if (cachedResult) {
      console.log(`Cache hit for ${id}`);
      return cachedResult;
    }

    return processStreamRequest(type, id, config, req, cacheKey);
  });
};

async function processStreamRequest(
  type: string,
  id: string,
  config: HandlerArgs["config"],
  req: any,
  cacheKey: string
) {
  const [mediaId, season, episode] = id.split(":");
  console.log(`\n🔍 Stream request for ${type}:${id}`);
  console.log(`   Media: ${mediaId}, Season: ${season || 'N/A'}, Episode: ${episode || 'N/A'}`);

  let torrents: TorrentSearchResult[] = [];

  const categories: TorrentCategory[] = [];
  if (type === "movie") categories.push("movie");
  if (type === "series") categories.push("show");

  const sources: TorrentSource[] = [];
  
 
  if (config.enableZilean === "on") sources.push("zilean");
  if (config.enableProwlarr === "on") sources.push("prowlarr");
  if (config.enableJackett === "on") sources.push("jackett");
  
  
  if (config.enableYts === "on") sources.push("yts");
  if (config.enableEztv === "on") sources.push("eztv");
  
  
  if (config.enableNcore === "on") sources.push("ncore");
  if (config.enableInsane === "on") sources.push("insane");
  
  if (config.enable1337x === "on") sources.push("1337x");
  if (config.enableThePirateBay === "on") sources.push("thepiratebay");
  if (config.enableRarbg === "on") sources.push("rarbg");
  if (config.enableKickassTorrents === "on") sources.push("kickasstorrents");
  if (config.enableTorrentGalaxy === "on") sources.push("torrentgalaxy");
  if (config.enableMagnetDL === "on") sources.push("magnetdl");
  if (config.enableNyaaSi === "on") sources.push("nyaasi");
  if (config.enableTokyoTosho === "on") sources.push("tokyotosho");
  if (config.enableAniDex === "on") sources.push("anidex");
  if (config.enableCinecalidad === "on") sources.push("cinecalidad");
  if (config.enableMiTorrent === "on") sources.push("mitorrent");
  if (config.enablePelisPanda === "on") sources.push("pelispanda");
  if (config.enableRutracker === "on") sources.push("rutracker");
 
  if (config.enableRutor === "on") sources.push("rutor");
  if (config.enableComando === "on") sources.push("comando");
  if (config.enableBluDV === "on") sources.push("bludv");
  if (config.enableTorrent9 === "on") sources.push("torrent9");
  if (config.enableIlCorSaRoNeRo === "on") sources.push("ilcorsaronero");
  if (config.enableMejorTorrent === "on") sources.push("mejortorrent");
  if (config.enableWolfmax4k === "on") sources.push("wolfmax4k");
  if (config.enableBestTorrents === "on") sources.push("besttorrents");
  if (config.enableMicoLeaoDublado === "on") sources.push("micoleaodublado");
  
  if (config.enableZooqle === "on") sources.push("zooqle");
  if (config.enableETTV === "on") sources.push("ettv");
  if (config.enableTorrentDownloads === "on") sources.push("torrentdownloads");
  if (config.enableTorrentz2 === "on") sources.push("torrentz2");
  if (config.enableSkyTorrents === "on") sources.push("skytorrents");
  if (config.enableSolidTorrents === "on") sources.push("solidtorrents");
  if (config.enableTorrentFunk === "on") sources.push("torrentfunk");
  
  if (config.enableHorribleSubs === "on") sources.push("horriblesubs");
  if (config.enableSubsPlease === "on") sources.push("subsplease");
  if (config.enableAniLibria === "on") sources.push("anilibria");
  if (config.enableErai === "on") sources.push("erai");

  
  const speedPreference = config?.speedPreference || "balanced";
  const originalSourceCount = sources.length;
  
  if (speedPreference === "fast") {
   
    const fastSources = [
      "zilean", "prowlarr", "jackett", 
      "yts", "eztv", "1337x", "nyaasi", "thepiratebay", "rarbg" 
    ];
    const filteredSources = sources.filter(s => fastSources.includes(s));
    console.log(` FAST MODE: Using ${filteredSources.length} fastest sources (down from ${sources.length})`);
    sources.length = 0;
    sources.push(...filteredSources);
  } else if (speedPreference === "balanced") {
    
    const balancedSources = [
      "zilean", "prowlarr", "jackett", 
      "yts", "eztv", "1337x", "nyaasi", 
      "thepiratebay", "rarbg", "kickasstorrents", 
      "tokyotosho", "limetorrents" 
    ];
    const filteredSources = sources.filter(s => balancedSources.includes(s));
    console.log(` BALANCED MODE: Using ${filteredSources.length}/${originalSourceCount} sources (limiting for speed)`);
    sources.length = 0;
    sources.push(...filteredSources);
  }
  
  console.log(`📊 Using ${sources.length} sources (Speed: ${speedPreference})`);

  const isKitsu = id.startsWith("kitsu:");
  const imdbId = isKitsu ? mediaId.replace("kitsu:", "") : mediaId;

  
  const queries: string[] = [];
  
  
  if (!isKitsu) {
    const titles = await getTitles(mediaId);
    if (titles.length > 0) {
      // For series, add season/episode to query
      if (season && episode) {
        queries.push(...titles.map(title => `${title} S${season.padStart(2, '0')}E${episode.padStart(2, '0')}`));
        queries.push(...titles.map(title => `${title} ${season}x${episode.padStart(2, '0')}`));
      } else {
        queries.push(...titles);
      }
    } else {
      // Fallback to IMDB ID if no titles found
      queries.push(mediaId);
    }
  } else {
    queries.push(imdbId);
  }
  
  
  if (isKitsu) {
    try {
      const { getKitsuAliases } = await import("../metadata/kitsu.js");
      const kitsuAliases = await getKitsuAliases(imdbId);
      if (kitsuAliases.length > 0) {
        queries.push(...kitsuAliases.slice(0, 5)); // Add top 5 aliases for anime
        console.log(`Added ${kitsuAliases.length} Kitsu aliases for better anime search`);
      }
    } catch (error) {
      console.error("Kitsu aliases error:", error);
    }
  }
  
  // Add Trakt aliases if token provided
  if (config?.traktToken && !isKitsu) {
    try {
      const traktAliases = await getTraktAliases(type === "movie" ? "movie" : "show", mediaId);
      if (traktAliases.length > 0) {
        queries.push(...traktAliases.slice(0, 3)); // Add top 3 aliases
        console.log(`Added ${traktAliases.length} Trakt aliases for better search`);
      }
    } catch (error) {
      console.error("Trakt aliases error:", error);
    }
  }
  
  console.log(`🎯 Searching ${sources.length} sources with ${queries.length} queries:`, queries.slice(0, 3));
  
  if (sources.length === 0) {
    console.error("⚠️  NO SOURCES ENABLED! Check provider preset configuration.");
    return { streams: [] };
  }

  
  const MIN_RESULTS = speedPreference === "fast" ? 5 : speedPreference === "balanced" ? 10 : 20;
  const SEARCH_TIMEOUT = speedPreference === "fast" ? 5000 : speedPreference === "balanced" ? 12000 : 40000;
  const startTime = Date.now();
  
  
  const searchPromises = queries.map((query) =>
    searchTorrents(query, {
      categories,
      sources,
      jackett: {
        url: config.jackettUrl,
        apiKey: config.jackettKey,
      },
      ncore: {
        user: config.nCoreUser,
        password: config.nCorePassword,
      },
      insane: {
        user: config.insaneUser,
        password: config.insanePassword,
      },
      prowlarr: {
        url: config.prowlarrUrl,
        apiKey: config.prowlarrKey,
      },
      zilean: {
        url: config.zileanUrl,
      },
    }).catch(err => {
      console.error(`Query "${query}" failed:`, err.message);
      return [];
    })
  );

  // Collect results with early return
  torrents = await Promise.race([
    // Wait for all queries
    Promise.all(searchPromises).then(results => results.flat()),
    // OR timeout
    new Promise<TorrentSearchResult[]>((resolve) => {
      setTimeout(() => {
        console.log(`⏱️ Timeout reached (${SEARCH_TIMEOUT}ms), processing partial results...`);
        Promise.all(searchPromises.map(p => Promise.race([p, Promise.resolve([])])))
          .then(results => resolve(results.flat()));
      }, SEARCH_TIMEOUT);
    })
  ]);

  const elapsed = Date.now() - startTime;
  console.log(`✅ Search complete: ${torrents.length} results in ${elapsed}ms (Speed: ${speedPreference})`);

  const beforeDedup = torrents.length;
  torrents = await dedupeTorrents(torrents);
  console.log(`Deduplication: ${beforeDedup} -> ${torrents.length} (removed ${beforeDedup - torrents.length} duplicates)`);

  // Apply RTN ranking if enabled
  if (config?.enableRTN === "on") {
    console.log("Applying RTN smart ranking...");
    torrents = torrents.map((torrent) => {
      const rtnScore = calculateTorrentScore(
        torrent.name,
        torrent.size,
        torrent.seeds
      );
      return {
        ...torrent,
        rtnScore: rtnScore.totalScore,
      };
    });
    // Sort by RTN score
    torrents.sort((a: any, b: any) => (b.rtnScore || 0) - (a.rtnScore || 0));
    console.log(`   Top scored: ${torrents[0]?.name.substring(0, 60)} (score: ${(torrents[0] as any)?.rtnScore})`);
  }

  // Apply language prioritization
  const priorityLanguage = config?.priorityLanguage;
  if (priorityLanguage && priorityLanguage !== "None") {
    console.log(`Prioritizing language: ${priorityLanguage}`);
    torrents = prioritizeByLanguage(
      torrents,
      priorityLanguage,
      (t) => t.name,
      (t) => t.category
    );
  }

  // Apply minimum seeders filter
  const minSeeders = parseInt(config?.minSeeders || "0");
  
  const beforeFilterCount = torrents.length;
  const filterStats = {
    seeders: 0,
    dvd: 0,
    adult: 0,
    format: 0,
    quality: 0,
    seasonEpisode: 0,
  };
  
  torrents = torrents.filter((torrent) => {
    if (!torrent.seeds || torrent.seeds < minSeeders) {
      filterStats.seeders++;
      return false;
    }
    if (torrent.category?.includes("DVD")) {
      filterStats.dvd++;
      return false;
    }
    
    // Adult content filtering
    if (config?.removeAdultContent === "on") {
      const adultKeywords = ["xxx", "porn", "adult", "erotic", "18+", "hentai"];
      const nameLower = torrent.name.toLowerCase();
      const categoryLower = (torrent.category || "").toLowerCase();
      
      if (adultKeywords.some(keyword => nameLower.includes(keyword) || categoryLower.includes(keyword))) {
        filterStats.adult++;
        return false;
      }
    }
    
    if (!isAllowedFormat(config, torrent.name)) {
      filterStats.format++;
      return false;
    }
    if (!isAllowedQuality(config, guessQuality(torrent.name).quality)) {
      filterStats.quality++;
      return false;
    }

    if (
      season &&
      episode &&
      !isTorrentNameMatch(torrent.name, Number(season), Number(episode))
    ) {
      filterStats.seasonEpisode++;
      return false;
    }

    return true;
  });
  
  console.log(`Filtering: ${beforeFilterCount} -> ${torrents.length} (removed ${beforeFilterCount - torrents.length})`);
  if (torrents.length < beforeFilterCount) {
    console.log(`   Rejected: ${filterStats.seeders} low seeds, ${filterStats.dvd} DVD, ${filterStats.adult} adult, ${filterStats.format} format, ${filterStats.quality} quality, ${filterStats.seasonEpisode} S/E mismatch`);
  }

  // Get formatter
  const formatterType = (config?.formatter as FormatterType) || "yarr";

  console.log(`Converting ${torrents.length} torrents to streams...`);
  let streams = (
    await Promise.all(
      torrents.map((torrent) =>
        getStreamsFromTorrent(req, torrent, season, episode, formatterType)
      )
    )
  ).flat();
  
  console.log(`   Generated ${streams.length} raw streams`);

  
  if (config?.enableAggregation === "on") {
    const externalAddons: ExternalAddon[] = [];

    // Build list of external addons from config
    if (config.externalAddon1Url && config.externalAddon1Name) {
      externalAddons.push({
        name: config.externalAddon1Name,
        url: config.externalAddon1Url.replace("/manifest.json", ""), // Clean URL
        enabled: true,
        timeout: 15000, // Give external addons more time
      });
    }

    if (config.externalAddon2Url && config.externalAddon2Name) {
      externalAddons.push({
        name: config.externalAddon2Name,
        url: config.externalAddon2Url.replace("/manifest.json", ""),
        enabled: true,
        timeout: 15000,
      });
    }

    if (config.externalAddon3Url && config.externalAddon3Name) {
      externalAddons.push({
        name: config.externalAddon3Name,
        url: config.externalAddon3Url.replace("/manifest.json", ""),
        enabled: true,
        timeout: 15000,
      });
    }

    if (externalAddons.length > 0) {
      console.log(`🔗 Aggregating from ${externalAddons.length} external addon(s): ${externalAddons.map(a => a.name).join(", ")}`);
      const externalStreams = await aggregateExternalAddons(externalAddons, type, id);
      
      if (externalStreams.length > 0) {
        // Convert external streams to YARR! format
        const convertedExternal = externalStreams.map((ext) => 
          convertExternalStream(ext, formatterType)
        );

        // Add to our streams (will be deduplicated later)
        streams.push(...convertedExternal);
        console.log(`✅ Added ${convertedExternal.length} streams from external addons (total now: ${streams.length})`);
      } else {
        console.log(`⚠️ No streams returned from external addons`);
      }
    }
  }

  const beforeStreamFilter = streams.length;
  streams = streams.filter((stream) => {
    if (!isAllowedFormat(config, stream.fileName)) return false;
    if (!isAllowedQuality(config, stream.quality)) return false;
    return true;
  });
  console.log(`🔍 Stream filtering: ${beforeStreamFilter} -> ${streams.length} (removed ${beforeStreamFilter - streams.length})`);

  // Apply ML scoring if enabled
  if (config?.enableML === "on") {
    console.log("Applying ML recommendations...");
    streams = streams.map((stream) => {
      const mlScore = mlEngine.calculateMLScore(stream, stream.score);
      return {
        ...stream,
        score: mlScore.finalScore,
        mlBoost: mlScore.finalScore - mlScore.baseScore,
      };
    });
  }


  const sortBy = config?.sortBy || "Quality then Seeders";
  const sortCached = config?.sortCached || "Same as above";
  
  // Check if we need separate sorting for cached vs uncached
  if (sortBy === "Cached First then Quality" || sortCached !== "Same as above") {
    
    const cachedStreams = streams.filter((s: any) => s.cached);
    const uncachedStreams = streams.filter((s: any) => !s.cached);

    // Sort cached streams
    const cachedSortMode = sortCached !== "Same as above" ? sortCached : "Quality";
    cachedStreams.sort(getSortFunction(cachedSortMode));

    // Sort uncached streams
    uncachedStreams.sort(getSortFunction(sortBy === "Cached First then Quality" ? "Quality then Seeders" : sortBy));

    // Combine: cached first
    streams = [...cachedStreams, ...uncachedStreams];
  } else {
    // Single sorting for all streams
    streams.sort(getSortFunction(sortBy));
  }

  // Apply max results per quality
  const maxResults = parseInt(config?.maxResults || "5");
  const qualityGroups = new Map<string, typeof streams>();
  
  streams.forEach(stream => {
    const quality = stream.quality;
    if (!qualityGroups.has(quality)) {
      qualityGroups.set(quality, []);
    }
    const group = qualityGroups.get(quality)!;
    if (group.length < maxResults) {
      group.push(stream);
    }
  });

  streams = Array.from(qualityGroups.values()).flat();

  // Generate statistics if enabled
  let statisticsStream = null;
  if (config?.showStatistics === "on" && streams.length > 0) {
    const stats = calculateStatistics(streams);
    const statsFormatted = formatStatisticsStream(stats);
    statisticsStream = {
      name: statsFormatted.name,
      title: statsFormatted.description,
      externalUrl: "https://github.com/spookyhost1/yarr-stremio",
    };
  }

  // Check if debrid service is configured
  const debridService = config?.debridService;
  const debridApiKey = config?.debridApiKey;

  if (debridService && debridService !== "None" && debridApiKey) {
    const service = getDebridService(debridService);
    
    if (service) {
      console.log(`🔍 Checking ${streams.length} streams against ${debridService}...`);
      
      // Enhance streams with debrid cached status
      const enhancedStreams = await Promise.all(
        streams.map(async (stream, idx) => {
          try {
            // Verify stream structure
            if (!stream.stream) {
              console.error(`   ⚠️ Stream ${idx} has no .stream property!`, Object.keys(stream));
              return null;
            }
            
            // Extract magnet link from the original torrent
            const torrent = torrents.find(t => stream.torrentName === t.name);
            if (!torrent) {
              console.warn(`   ⚠️ Stream ${idx} torrent not found: "${stream.torrentName}"`);
              return stream.stream;
            }
            
            if (!torrent.magnet) {
              console.warn(`   ⚠️ Stream ${idx} has no magnet link`);
              return stream.stream;
            }
            
            const isCached = await service.checkCached(torrent.magnet, debridApiKey);
            
            if (isCached) {
              console.log(`   ✅ Stream ${idx} is CACHED!`);
              const originalStream = stream.stream;
              return {
                ...originalStream,
                name: `⚡ CACHED | ${originalStream.name}`,
                title: `✅ ${debridService} - INSTANT STREAMING\n\n${originalStream.title || ''}`,
              };
            } else {
              console.log(`   ⭕ Stream ${idx} not cached`);
            }
            
            return stream.stream;
          } catch (error) {
            console.error(`   ❌ Debrid check error for stream ${idx}:`, error);
            return stream.stream;
          }
        })
      );
      
      // Filter out null values
      const validStreams = enhancedStreams.filter(s => s !== null);
      
      console.log(`   📊 Valid streams after debrid check: ${validStreams.length}/${enhancedStreams.length}`);

      // Add statistics and external downloads if configured
      let finalStreams = validStreams;
      
      if (config?.showExternalDownloads === "on") {
        const withDownloads: any[] = [];
        for (const stream of validStreams) {
          withDownloads.push(stream);
          if (stream.url) {
            withDownloads.push({
              ...stream,
              name: `📥 ${stream.name}`,
              title: `Download: ${stream.title || stream.name}`,
              externalUrl: stream.url,
            });
          }
        }
        finalStreams = withDownloads;
      }

      if (statisticsStream) {
        finalStreams.unshift(statisticsStream);
      }

      console.log(`\n🎬 RETURNING ${finalStreams.length} STREAMS TO STREMIO (with debrid):`);
      if (finalStreams.length > 0) {
        console.log(`   First stream:`, JSON.stringify(finalStreams[0], null, 2).substring(0, 500));
      } else {
        console.error(`   ⚠️ NO STREAMS AFTER DEBRID CHECK! EDIT SOURCES OR TRY AGAIN`);
      }

      const result = { streams: finalStreams };
      cache.set(cacheKey, result, 600); // Cache for 10 minutes
      return result;
    }
  }

  // Add statistics and external downloads if configured
  let finalStreams = streams.map((stream) => stream.stream);
  
  if (config?.showExternalDownloads === "on") {
    const withDownloads: any[] = [];
    for (const stream of finalStreams) {
      withDownloads.push(stream);
      if (stream.url) {
        withDownloads.push({
          ...stream,
          name: `📥 ${stream.name}`,
          title: `Download: ${stream.title}`,
          externalUrl: stream.url,
        });
      }
    }
    finalStreams = withDownloads;
  }

  if (statisticsStream) {
    finalStreams.unshift(statisticsStream);
  }

  console.log(`\n🎬 RETURNING ${finalStreams.length} STREAMS TO STREMIO:`);
  if (finalStreams.length > 0) {
    console.log(`   First stream:`, JSON.stringify(finalStreams[0], null, 2).substring(0, 500));
  } else {
    console.error(`   ⚠️ NO STREAMS AFTER FILTERING!`);
  }

  const result = { streams: finalStreams };
  cache.set(cacheKey, result, 600); // Cache for 10 minutes
  return result;
}

const dedupeTorrents = async (torrents: TorrentSearchResult[]) => {

  const { smartDeduplicate } = await import("../utils/smart-dedup.js");
  return smartDeduplicate(torrents, ["infohash", "smart-hash", "tracker+name"]);
};

export const getStreamsFromTorrent = async (
  req: Request,
  torrent: TorrentSearchResult,
  season?: string,
  episode?: string,
  formatterType: FormatterType = "yarr"
): Promise<
  {
    stream: Stremio.Stream;
    torrentName: string;
    fileName: string;
    quality: string;
    score: number;
    torrentSeeds: number;
    fileSize: number;
  }[]
> => {
  // Get magnet link or torrent URL
  let uri = torrent.magnet || torrent.torrent;
  if (!uri) {
    console.warn(`   ⚠️ No magnet/torrent for: ${torrent.name}`);
    return [];
  }

  // Extract infohash from magnet link
  let infoHash: string | undefined;
  if (uri.startsWith("magnet:")) {
    // Match magnet:?xt=urn:btih:HASH or magnet:?xt=urn:btmh:HASH
    const match = uri.match(/magnet:\?xt=urn:bt[im]h:([a-fA-F0-9]{40}|[a-zA-Z0-9]{32})/i);
    infoHash = match ? match[1].toLowerCase() : undefined;
    
    // Enhance magnet links with best trackers
    let trackerType: "anime" | "russian" | "general" = "general";
    if (isAnimeTracker(torrent.tracker)) {
      trackerType = "anime";
    } else if (isRussianTracker(torrent.tracker)) {
      trackerType = "russian";
    }
    uri = enhanceMagnetLink(uri, torrent.name, trackerType);
  }

  if (!infoHash) {
    console.warn(`   ⚠️ Could not extract infohash from: ${uri.substring(0, 100)}`);
    return [];
  }

 
  const torrentParsed = parseTorrentName(torrent.name);
  const torrentQuality = guessQuality(torrent.name);
  const language = guessLanguage(torrent.name, torrent.category);

  // Get quality from parsed info
  const parsedQuality = getQualityFromParsed(torrentParsed, torrentParsed);
  const hdrProfiles = torrentParsed.hdr || [];
  const threeD = torrentParsed.threeD || false;
  const finalQuality = parsedQuality || torrentQuality.quality;

  
  const bingeGroup = getBingeGroup(
    infoHash,
    torrentParsed,
    torrentParsed,
    finalQuality,
    season && episode ? "series" : "movie",
    true 
  );

  // Get specialized tracker sources for the content type
  let trackerType: "anime" | "russian" | "general" = "general";
  if (isAnimeTracker(torrent.tracker)) trackerType = "anime";
  else if (isRussianTracker(torrent.tracker)) trackerType = "russian";
  
  const sources = getTrackerSources(infoHash, trackerType);

  // Get formatter function
  const formatter = getFormatter(formatterType);
  
  // Prepare formatter data
  const formatterData = {
    torrentName: torrent.name,
    fileName: torrent.name, 
    quality: finalQuality,
    size: torrent.size || 0,
    seeds: torrent.seeds || 0,
    peers: torrent.peers || 0,
    tracker: torrent.tracker,
    language: language || "English",
    hdr: hdrProfiles,
    codec: torrentParsed.codec,
    audio: torrentParsed.audio,
    source: torrentParsed.source,
    releaseGroup: torrentParsed.group,
    cached: false, // Will be updated by debrid check
    debridService: undefined,
  };

  // Use formatter to generate stream name and description
  const formatted = formatter(formatterData);
  const streamName = formatted.name;
  const streamTitle = formatted.description;

  
  const stream: Stremio.Stream = cleanOutputObject({
    name: streamName,
    title: streamTitle,
    infoHash: infoHash,
    
    sources,
    behaviorHints: bingeGroup ? cleanOutputObject({
      bingeGroup,
    }) : undefined,
  });

  console.log(`   ✅ Created stream for: ${torrent.name.substring(0, 50)}...`);

  return [{
    stream,
    torrentName: torrent.name,
    fileName: torrent.name,
    quality: finalQuality,
    score: torrentQuality.score,
    torrentSeeds: torrent.seeds || 0,
    fileSize: torrent.size || 0,
  }];
};

const isAllowedQuality = (config: HandlerArgs["config"], quality: string) => {
  if (config?.disable4k === "on" && quality.includes("4K")) return false;
  if (config?.disableCam === "on" && quality.includes("CAM")) return false;
  if (config?.disableHdr === "on" && quality.includes("HDR")) return false;
  if (config?.disableDolbyVision === "on" && quality.includes("Dolby Vision")) return false;
  if (config?.disable3d === "on" && quality.includes("3D")) return false;
  if (config?.disableRemux === "on" && quality.includes("REMUX")) return false;

  if (config?.allow4k !== "on" && (quality.includes("4K") || quality.includes("2160p"))) return false;
  if (config?.allow1440p !== "on" && quality.includes("1440p")) return false;
  if (config?.allow1080p !== "on" && quality.includes("1080p")) return false;
  if (config?.allow720p !== "on" && quality.includes("720p")) return false;
  if (config?.allow480p !== "on" && quality.includes("480p")) return false;
  if (config?.allow360p !== "on" && (quality.includes("360p") || quality.includes("SD"))) return false;

  return true;
};

const isAllowedFormat = (config: HandlerArgs["config"], name: string) => {
  if (config?.disableHevc === "on") {
    const str = name.replace(/\W/g, "").toLowerCase();
    if (str.includes("x265") || str.includes("h265") || str.includes("hevc"))
      return false;
  }

  return true;
};
