/**
 * Stream statistics generator - Inspired by AIOStreams
 * Provides summary information about search results
 */

export interface StreamStatistics {
  totalResults: number;
  cachedResults: number;
  uncachedResults: number;
  providerCounts: Map<string, number>;
  qualityCounts: Map<string, number>;
  averageSeeds: number;
  totalSize: number;
  topProvider: string;
  topQuality: string;
}

export function calculateStatistics(streams: any[]): StreamStatistics {
  const providerCounts = new Map<string, number>();
  const qualityCounts = new Map<string, number>();
  let cachedResults = 0;
  let totalSeeds = 0;
  let totalSize = 0;

  for (const stream of streams) {
    // Count by tracker
    const tracker = stream.torrentTracker || stream.tracker || "Unknown";
    providerCounts.set(tracker, (providerCounts.get(tracker) || 0) + 1);

    // Count by quality
    const quality = stream.quality || "Unknown";
    qualityCounts.set(quality, (qualityCounts.get(quality) || 0) + 1);

    // Count cached
    if (stream.cached) cachedResults++;

    // Aggregate stats
    totalSeeds += stream.torrentSeeds || stream.seeds || 0;
    totalSize += stream.fileSize || stream.size || 0;
  }

  // Find top provider and quality
  const topProvider = Array.from(providerCounts.entries())
    .sort((a, b) => b[1] - a[1])[0]?.[0] || "None";

  const topQuality = Array.from(qualityCounts.entries())
    .sort((a, b) => b[1] - a[1])[0]?.[0] || "None";

  return {
    totalResults: streams.length,
    cachedResults,
    uncachedResults: streams.length - cachedResults,
    providerCounts,
    qualityCounts,
    averageSeeds: streams.length > 0 ? totalSeeds / streams.length : 0,
    totalSize,
    topProvider,
    topQuality,
  };
}

export function formatStatisticsStream(stats: StreamStatistics): {
  name: string;
  description: string;
} {
  const cachedPercent = stats.totalResults > 0 
    ? ((stats.cachedResults / stats.totalResults) * 100).toFixed(0)
    : "0";

  const name = "📊 YARR! Statistics";

  const description = [
    `Found ${stats.totalResults} streams`,
    stats.cachedResults > 0 ? `⚡ ${stats.cachedResults} cached (${cachedPercent}%)` : undefined,
    `🏆 Top Provider: ${stats.topProvider} (${stats.providerCounts.get(stats.topProvider) || 0} results)`,
    `🎬 Top Quality: ${stats.topQuality} (${stats.qualityCounts.get(stats.topQuality) || 0} results)`,
    `👥 Average Seeds: ${Math.round(stats.averageSeeds)}`,
    `💾 Total Size: ${formatBytes(stats.totalSize)}`,
  ].filter(Boolean).join("\n");

  return { name, description };
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

