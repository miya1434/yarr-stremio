/**
 * Smart Recommendations Engine
 * KILLER FEATURE #4 - Auto-configure based on user's Trakt history
 */

import axios from "axios";
import { getTraktUserRecommendations, getTraktWatchedHistory } from "../metadata/trakt.js";

const TRAKT_API_BASE = "https://api.trakt.tv";
const TRAKT_CLIENT_ID = process.env.TRAKT_CLIENT_ID || ""; // Optional: Add your Trakt client ID to enable smart recommendations

export interface ContentAnalysis {
  totalMovies: number;
  totalShows: number;
  totalAnime: number;
  movieRatio: number;
  showRatio: number;
  animeRatio: number;
  topGenres: string[];
  averageYear: number;
  recentYears: number; // How recent the content is (2020+)
  popularityLevel: "mainstream" | "mixed" | "niche";
  qualityPreference: "4k" | "1080p" | "720p" | "any";
  languages: Map<string, number>;
  dominantLanguage: string;
}

export interface SmartRecommendation {
  suggestedPreset?: string;
  suggestedProviders: string[];
  suggestedLanguage?: string;
  suggestedQuality: string;
  suggestedFormatter: string;
  suggestedSortMode: string;
  suggestedMinSeeders: number;
  suggestedMaxResults: number;
  enabledFeatures: {
    enableRTN: boolean;
    searchByTitle: boolean;
    enableAggregation: boolean;
    externalAddons: string[];
  };
  reasoning: string[];
  confidence: number; // 0-100
  analysis: ContentAnalysis;
}

/**
 * Fetch detailed Trakt stats
 */
async function getTraktStats(traktToken: string): Promise<any> {
  try {
    const response = await axios.get(`${TRAKT_API_BASE}/users/me/stats`, {
      headers: {
        "Content-Type": "application/json",
        "trakt-api-version": "2",
        "trakt-api-key": TRAKT_CLIENT_ID,
        Authorization: `Bearer ${traktToken}`,
      },
      timeout: 10000,
    });
    return response.data;
  } catch (error) {
    console.error("Trakt stats error:", error);
    return null;
  }
}

/**
 * Fetch user's top genres
 */
async function getTopGenres(traktToken: string, mediaType: "movies" | "shows"): Promise<string[]> {
  try {
    // Get recently watched to analyze genres
    const response = await axios.get(
      `${TRAKT_API_BASE}/sync/history/${mediaType}?limit=50`,
      {
        headers: {
          "Content-Type": "application/json",
          "trakt-api-version": "2",
          "trakt-api-key": TRAKT_CLIENT_ID,
          Authorization: `Bearer ${traktToken}`,
        },
        timeout: 10000,
      }
    );

    if (!response.data) return [];

    // Extract genres from items
    const genreCounts = new Map<string, number>();
    for (const item of response.data) {
      const media = item[mediaType === "movies" ? "movie" : "show"];
      if (media?.genres) {
        for (const genre of media.genres) {
          genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1);
        }
      }
    }

    // Return top 5 genres
    return Array.from(genreCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([genre]) => genre);
  } catch (error) {
    console.error("Top genres error:", error);
    return [];
  }
}

/**
 * Analyze content and return detailed insights
 */
async function analyzeContent(traktToken: string): Promise<ContentAnalysis> {
  const [stats, movieHistory, showHistory, topMovieGenres, topShowGenres] = await Promise.all([
    getTraktStats(traktToken),
    getTraktWatchedHistory(traktToken, "movie", 100),
    getTraktWatchedHistory(traktToken, "show", 100),
    getTopGenres(traktToken, "movies"),
    getTopGenres(traktToken, "shows"),
  ]);

  const totalMovies = stats?.movies?.watched || movieHistory.length;
  const totalShows = stats?.shows?.watched || showHistory.length;
  const totalWatched = totalMovies + totalShows;

  // Detect anime (common anime genres/keywords)
  const animeGenres = ["anime", "animation"];
  const animeCount = [...topMovieGenres, ...topShowGenres].filter((g) =>
    animeGenres.some((ag) => g.toLowerCase().includes(ag))
  ).length;
  const totalAnime = Math.floor((animeCount / 5) * totalWatched * 0.2); // Estimate

  const movieRatio = totalWatched > 0 ? totalMovies / totalWatched : 0;
  const showRatio = totalWatched > 0 ? totalShows / totalWatched : 0;
  const animeRatio = totalWatched > 0 ? totalAnime / totalWatched : 0;

  // Analyze genres for popularity
  const allGenres = [...topMovieGenres, ...topShowGenres];
  const mainstreamGenres = ["action", "comedy", "drama", "thriller"];
  const nicheGenres = ["documentary", "foreign", "indie", "experimental"];

  const mainstreamCount = allGenres.filter((g) =>
    mainstreamGenres.some((mg) => g.toLowerCase().includes(mg))
  ).length;
  const nicheCount = allGenres.filter((g) =>
    nicheGenres.some((ng) => g.toLowerCase().includes(ng))
  ).length;

  let popularityLevel: "mainstream" | "mixed" | "niche" = "mixed";
  if (mainstreamCount > nicheCount * 2) popularityLevel = "mainstream";
  else if (nicheCount > mainstreamCount) popularityLevel = "niche";

  // Determine quality preference based on content type
  let qualityPreference: "4k" | "1080p" | "720p" | "any" = "1080p";
  if (stats?.movies?.watched > 100 && movieRatio > 0.6) {
    qualityPreference = "4k"; // Movie enthusiasts likely want 4K
  } else if (showRatio > 0.7) {
    qualityPreference = "1080p"; // TV show bingers prioritize speed over 4K
  }

  // Estimate average year
  const currentYear = new Date().getFullYear();
  const averageYear = currentYear - 5; // Default estimate
  const recentYears = 0; // Would need actual year data from API

  // Language analysis (would need more data)
  const languages = new Map<string, number>();
  languages.set("English", totalWatched); // Default assumption
  const dominantLanguage = "English";

  return {
    totalMovies,
    totalShows,
    totalAnime,
    movieRatio,
    showRatio,
    animeRatio,
    topGenres: [...new Set([...topMovieGenres, ...topShowGenres])].slice(0, 5),
    averageYear,
    recentYears,
    popularityLevel,
    qualityPreference,
    languages,
    dominantLanguage,
  };
}

/**
 * Analyze Trakt history and recommend optimal YARR! configuration
 */
export async function analyzeAndRecommend(
  traktToken: string
): Promise<SmartRecommendation> {
  const reasoning: string[] = [];
  const suggestedProviders: string[] = [];
  let suggestedLanguage: string | undefined = "None";
  let suggestedQuality = "1080p";
  let suggestedFormatter = "google-light";
  let suggestedPreset: string | undefined;
  let suggestedSortMode = "Quality then Seeders";
  let suggestedMinSeeders = 5;
  let suggestedMaxResults = 5;
  let confidence = 0;
  const externalAddons: string[] = [];

  try {
    // Perform deep content analysis
    const analysis = await analyzeContent(traktToken);

    if (analysis.totalMovies + analysis.totalShows === 0) {
      reasoning.push("No watch history found - recommending balanced setup");
      return getDefaultRecommendation();
    }

    const totalWatched = analysis.totalMovies + analysis.totalShows;
    reasoning.push(`📊 Analyzed ${totalWatched} watched items (${analysis.totalMovies} movies, ${analysis.totalShows} shows)`);
    confidence = Math.min(100, (totalWatched / 50) * 100); // 50+ items = 100% confidence

    // Content type analysis
    if (analysis.movieRatio > 0.7) {
      reasoning.push(`🎬 You watch mostly movies (${(analysis.movieRatio * 100).toFixed(0)}%)`);
      
      // Movie-focused providers
      suggestedProviders.push(
        "enableYts", // Best for movies
        "enableRarbg", // High quality
        "enable1337x", // Variety
        "enableYIFY", // Quality movies
        "enableLimeTorrents" // Good movie coverage
      );

      if (analysis.qualityPreference === "4k") {
        reasoning.push("🔥 Recommending 4K sources based on movie preference");
        suggestedPreset = "4k-hdr-enthusiast";
        suggestedFormatter = "prism";
        suggestedMinSeeders = 20; // 4K needs good seeders
        suggestedProviders.push("enableWolfmax4k"); // 4K Spanish content
      } else {
        suggestedPreset = "quality-over-quantity";
        suggestedQuality = "1080p";
      }

      suggestedSortMode = "Quality then Size"; // Movies: quality matters
      suggestedMaxResults = 8; // More options for movies
    } else if (analysis.showRatio > 0.7) {
      reasoning.push(`📺 You watch mostly TV shows (${(analysis.showRatio * 100).toFixed(0)}%)`);
      
      // TV show-focused providers
      suggestedProviders.push(
        "enableEztv", // Best for TV
        "enableTorrentGalaxy", // Good TV coverage
        "enableETTV", // TV specialist
        "enable1337x", // General variety
        "enableThePirateBay" // Reliable for TV
      );

      suggestedPreset = "speed-demon";
      suggestedSortMode = "Seeders"; // TV: speed over quality
      suggestedFormatter = "compact"; // Clean for episode lists
      suggestedQuality = "1080p";
      suggestedMinSeeders = 10; // Lower for TV shows
      suggestedMaxResults = 5; // Fewer options (faster decisions)
    } else {
      reasoning.push(`📊 You watch balanced content (${(analysis.movieRatio * 100).toFixed(0)}% movies, ${(analysis.showRatio * 100).toFixed(0)}% shows)`);
      suggestedPreset = "torrentio-replacement";
      suggestedProviders.push(
        "enableYts",
        "enableEztv",
        "enableRarbg",
        "enable1337x",
        "enableThePirateBay",
        "enableTorrentGalaxy"
      );
    }

    // Anime detection and recommendation
    if (analysis.animeRatio > 0.2 || analysis.topGenres.some((g) => g.toLowerCase().includes("anim"))) {
      reasoning.push(`🎌 Anime detected (${(analysis.animeRatio * 100).toFixed(0)}% of content) - enabling anime trackers`);
      
      suggestedProviders.push(
        "enableNyaaSi", // Must-have for anime
        "enableTokyoTosho", // Quality anime
        "enableAniDex", // Community favorite
        "enableSubsPlease", // Latest releases
        "enableHorribleSubs", // Classic fansubs
        "enableErai", // Fast releases
        "enableAniLibria" // Russian anime
      );

      if (analysis.animeRatio > 0.6) {
        // Primarily anime watcher
        suggestedPreset = "anime-specialist";
        suggestedFormatter = "google-light";
        reasoning.push("🎯 Primarily anime - using Anime Specialist preset");
      }
    } else {
      // Enable at least one anime tracker for coverage
      suggestedProviders.push("enableNyaaSi");
    }

    // Genre-based recommendations
    if (analysis.topGenres.length > 0) {
      reasoning.push(`🎭 Top genres: ${analysis.topGenres.join(", ")}`);

      // Action/Thriller = quality matters
      if (analysis.topGenres.some((g) => ["action", "thriller", "sci-fi"].includes(g.toLowerCase()))) {
        reasoning.push("🎬 Action/thriller detected - prioritizing quality");
        suggestedMinSeeders = Math.max(suggestedMinSeeders, 15);
        
        if (!suggestedPreset || suggestedPreset === "torrentio-replacement") {
          suggestedPreset = "quality-over-quantity";
        }
      }

      // Documentary/Foreign = niche content needs more sources
      if (analysis.topGenres.some((g) => ["documentary", "foreign"].includes(g.toLowerCase()))) {
        reasoning.push("🌐 Niche content detected - enabling maximum coverage");
        suggestedPreset = "maximum-coverage";
        suggestedMinSeeders = 0; // Lower for rare content
        suggestedProviders.push(
          "enableZooqle",
          "enableSolidTorrents",
          "enableTorrentDownloads",
          "enableBTDB"
        );
      }
    }

    // Popularity level analysis
    if (analysis.popularityLevel === "mainstream") {
      reasoning.push("🌟 Mainstream content - top providers sufficient");
      // Stick with top providers only
    } else if (analysis.popularityLevel === "niche") {
      reasoning.push("🔍 Niche content - enabling specialty trackers");
      suggestedProviders.push(
        "enableZooqle",
        "enableBTDB",
        "enableTorrentz2", // Meta-search for rare content
        "enableSolidTorrents"
      );
      suggestedMinSeeders = 0; // Be lenient for rare content
    }

    // Language detection (would need better API data, using heuristics)
    // For now, check if user has international content in genres
    if (analysis.topGenres.some((g) => g.toLowerCase().includes("foreign"))) {
      reasoning.push("🌍 International content detected");
      
      // Enable international trackers
      suggestedProviders.push(
        "enableRutor",
        "enableComando",
        "enableTorrent9",
        "enableIlCorSaRoNeRo"
      );

      // Could be smarter with actual language detection
      reasoning.push("🌐 Enabling international trackers for broader coverage");
    }

    // Quality preference analysis
    if (analysis.qualityPreference === "4k") {
      reasoning.push("🔥 Recommending 4K quality based on movie preference");
      suggestedQuality = "4k";
      suggestedMaxResults = 10; // More options for 4K
    } else if (analysis.qualityPreference === "1080p") {
      reasoning.push("🎯 Recommending 1080p as optimal balance");
      suggestedQuality = "1080p";
    }

    // Formatter recommendation based on content type
    if (analysis.showRatio > 0.7) {
      suggestedFormatter = "compact"; // Better for episode lists
      reasoning.push("📱 Compact formatter recommended for TV show viewing");
    } else if (analysis.movieRatio > 0.7 && analysis.qualityPreference === "4k") {
      suggestedFormatter = "prism"; // Beautiful for 4K movies
      reasoning.push("🎨 Prism formatter recommended for 4K movie viewing");
    } else {
      suggestedFormatter = "google-light"; // Clean default
      reasoning.push("✨ Google Light formatter for clean, balanced display");
    }

    // External addon recommendations
    if (totalWatched > 50) {
      reasoning.push("💡 Recommending external addon aggregation for maximum coverage");
      externalAddons.push(
        "Torrentio (for debrid streaming)",
        "Comet (for additional debrid sources)",
        "MediaFusion (for live TV if you watch sports)"
      );
    }

    // Final preset selection logic
    if (!suggestedPreset) {
      if (analysis.animeRatio > 0.6) {
        suggestedPreset = "anime-specialist";
      } else if (analysis.movieRatio > 0.7) {
        suggestedPreset = analysis.qualityPreference === "4k" 
          ? "4k-hdr-enthusiast" 
          : "quality-over-quantity";
      } else if (analysis.showRatio > 0.7) {
        suggestedPreset = "speed-demon";
      } else {
        suggestedPreset = "torrentio-replacement";
      }
    }

    reasoning.push(`🎯 Final recommendation: "${suggestedPreset}" preset`);
    reasoning.push(`📊 Confidence: ${confidence.toFixed(0)}% (based on ${totalWatched} items)`);

    return {
      suggestedPreset,
      suggestedProviders: Array.from(new Set(suggestedProviders)),
      suggestedLanguage,
      suggestedQuality,
      suggestedFormatter,
      suggestedSortMode,
      suggestedMinSeeders,
      suggestedMaxResults,
      enabledFeatures: {
        enableRTN: true,
        searchByTitle: true,
        enableAggregation: totalWatched > 50,
        externalAddons,
      },
      reasoning,
      confidence,
      analysis: {
        totalMovies: analysis.totalMovies,
        totalShows: analysis.totalShows,
        totalAnime: analysis.totalAnime,
        movieRatio: analysis.movieRatio,
        showRatio: analysis.showRatio,
        animeRatio: analysis.animeRatio,
        topGenres: analysis.topGenres,
        averageYear: analysis.averageYear,
        recentYears: analysis.recentYears,
        popularityLevel: analysis.popularityLevel,
        qualityPreference: analysis.qualityPreference,
        languages: analysis.languages,
        dominantLanguage: analysis.dominantLanguage,
      },
    };
  } catch (error) {
    console.error("Smart recommendation error:", error);
    reasoning.push("❌ Error analyzing history - using default recommendations");
    return getDefaultRecommendation();
  }
}


function getDefaultRecommendation(): SmartRecommendation {
  return {
    suggestedPreset: "torrentio-replacement",
    suggestedProviders: [
      "enableYts",
      "enableEztv",
      "enableRarbg",
      "enable1337x",
      "enableThePirateBay",
      "enableTorrentGalaxy",
      "enableNyaaSi",
    ],
    suggestedLanguage: "None",
    suggestedQuality: "1080p",
    suggestedFormatter: "google-light",
    suggestedSortMode: "Quality then Seeders",
    suggestedMinSeeders: 5,
    suggestedMaxResults: 5,
    enabledFeatures: {
      enableRTN: true,
      searchByTitle: true,
      enableAggregation: false,
      externalAddons: [],
    },
    reasoning: ["No history available - recommending balanced configuration"],
    confidence: 0,
    analysis: {
      totalMovies: 0,
      totalShows: 0,
      totalAnime: 0,
      movieRatio: 0.5,
      showRatio: 0.5,
      animeRatio: 0,
      topGenres: [],
      averageYear: new Date().getFullYear() - 5,
      recentYears: 0,
      popularityLevel: "mixed",
      qualityPreference: "1080p",
      languages: new Map([["English", 0]]),
      dominantLanguage: "English",
    },
  };
}

/**
 * Generate full config from recommendations
 */
export function recommendationsToConfig(
  recommendations: SmartRecommendation
): any {
  const config: any = {};

  // Disable all providers first (clean slate)
  const allProviderKeys = [
    "enableYts", "enableEztv", "enable1337x", "enableThePirateBay",
    "enableRarbg", "enableKickassTorrents", "enableTorrentGalaxy",
    "enableMagnetDL", "enableNyaaSi", "enableTokyoTosho", "enableAniDex",
    "enableRutor", "enableComando", "enableBluDV", "enableTorrent9",
    "enableIlCorSaRoNeRo", "enableMejorTorrent", "enableWolfmax4k",
    "enableCinecalidad", "enableBestTorrents", "enableMicoLeaoDublado",
    "enableLimeTorrents", "enableZooqle", "enableETTV",
    "enableTorrentDownloads", "enableBTDB", "enableTorrentz2",
    "enableSkyTorrents", "enableGloTorrents", "enableTorLock",
    "enableYIFY", "enableSolidTorrents", "enableTorrentProject",
    "enableTPBClean", "enableTorrentFunk", "enableHorribleSubs",
    "enableSubsPlease", "enableAniLibria", "enableErai",
  ];

  // Disable all first
  for (const key of allProviderKeys) {
    config[key] = "";
  }

  // Enable only suggested providers
  for (const provider of recommendations.suggestedProviders) {
    config[provider] = "on";
  }

  // Set language priority
  config.priorityLanguage = recommendations.suggestedLanguage || "None";

  // Set formatter
  config.formatter = recommendations.suggestedFormatter;

  // Set sort mode
  config.sortBy = recommendations.suggestedSortMode;
  config.sortCached = "Same as above";

  // Set limits
  config.maxResults = recommendations.suggestedMaxResults.toString();
  config.minSeeders = recommendations.suggestedMinSeeders.toString();

  // Quality-based filters
  if (recommendations.suggestedQuality === "4k" || recommendations.suggestedQuality === "4K") {
    // Only show 4K
    config.disable1080p = "";
    config.disable720p = "";
    config.disable480p = "";
    config.disable4k = ""; // Keep 4K
  } else if (recommendations.suggestedQuality === "1080p") {
    // 1080p focus but allow 4K and 720p as fallbacks
    config.disable4k = ""; 
    config.disable1080p = "";
    config.disable720p = "";
    config.disable480p = "on"; // Disable low quality
  } else {
    // Accept all qualities
    config.disable4k = "";
    config.disable1080p = "";
    config.disable720p = "";
  }

  // Always disable these
  config.disableCam = "on";
  config.disable3d = "on";
  config.removeAdultContent = "on";

  // Enable recommended features
  config.enableRTN = recommendations.enabledFeatures.enableRTN ? "on" : "";
  config.enableML = "on"; // Always enable ML
  config.searchByTitle = recommendations.enabledFeatures.searchByTitle ? "on" : "";
  config.showStatistics = "on";
  config.showExternalDownloads = "";

  // Aggregation recommendations
  config.enableAggregation = recommendations.enabledFeatures.enableAggregation ? "on" : "";

  if (recommendations.enabledFeatures.externalAddons.length > 0) {
    // Suggest external addons in the config (user needs to add URLs)
    config._suggestedExternalAddons = recommendations.enabledFeatures.externalAddons;
  }

  return config;
}

