/**
 * Stream formatters for torrent display
 * Multiple styles for different user preferences
 */

export type FormatterType = "yarr" | "google" | "google-light" | "torrentio" | "minimal" | "detailed" | "prism" | "compact" | "pro" | "ultra-clean" | string;

export interface StreamFormatData {
  torrentName: string;
  fileName: string;
  quality: string;
  size: number;
  seeds: number;
  peers: number;
  tracker: string;
  language: string;
  hdr?: string[];
  codec?: string;
  audio?: string;
  source?: string;
  releaseGroup?: string;
  cached?: boolean;
  debridService?: string;
}

/**
 * YARR! Default Format
 */
export function yarrFormatter(data: StreamFormatData): { name: string; description: string } {
  const { quality, hdr, cached, debridService } = data;
  
  const cachedBadge = cached ? "⚡ " : "";
  const hdrText = hdr && hdr.length > 0 ? ` ${hdr.join(" | ")}` : "";
  
  const name = `${cachedBadge}YARR!\n${quality}${hdrText}`;
  
  const description = [
    data.torrentName.replace(/[, ]+/g, " "),
    data.fileName !== data.torrentName ? data.fileName : undefined,
    [
      `👤 ${data.seeds}`,
      `💾 ${formatBytes(data.size)}`,
      `⚙️ ${data.tracker}`,
    ].filter(Boolean).join(" "),
    data.language !== "English" ? `🔊 ${data.language}` : undefined,
    cached ? `🟢 ${debridService} Cached` : undefined,
  ].filter(Boolean).join("\n");

  return { name, description };
}

/**
 * Google Drive Style - Clean metadata layout
 */
export function googleFormatter(data: StreamFormatData): { name: string; description: string } {
  const { cached, debridService, quality, codec, hdr } = data;
  
  const serviceTag = debridService ? `[${debridService.slice(0, 2).toUpperCase()}]` : "";
  const cachedIcon = cached ? "⚡" : "⏳";
  const qualityText = quality || "Unknown";
  const codecText = codec ? ` ${codec}` : "";
  const hdrText = hdr && hdr.length > 0 ? ` ${hdr.join(" ")}` : "";
  
  const name = `${serviceTag}${cachedIcon} ${qualityText}${codecText}${hdrText}`;
  
  const description = [
    `📁 ${data.torrentName}`,
    data.fileName !== data.torrentName ? `📄 ${data.fileName}` : undefined,
    [
      data.source ? `🎥 ${data.source}` : undefined,
      data.audio ? `🎧 ${data.audio}` : undefined,
      data.releaseGroup ? `🏷️ ${data.releaseGroup}` : undefined,
    ].filter(Boolean).join(" "),
    [
      `📦 ${formatBytes(data.size)}`,
      `👥 ${data.seeds} seeds`,
      `🔍 ${data.tracker}`,
    ].join(" "),
    data.language !== "English" ? `🌐 ${data.language}` : undefined,
  ].filter(Boolean).join("\n");

  return { name, description };
}

/**
 * Google Light Style - Minimal and clean 
 */
export function googleLightFormatter(data: StreamFormatData): { name: string; description: string } {
  const { cached, debridService, quality, hdr, codec, audio, releaseGroup } = data;
  
  // Name format: [RD⚡] YARR! 2160p (HDR10)
  const serviceTag = debridService ? `[${debridService.slice(0, 2).toUpperCase()}` : "";
  const cachedIcon = cached ? "⚡] " : "⏳] ";
  const hdrText = hdr && hdr.length > 0 ? ` (${hdr.join(" • ")})` : "";
  
  const name = serviceTag ? `${serviceTag}${cachedIcon}YARR! ${quality}${hdrText}` : `YARR! ${quality}${hdrText}`;
  
  // Description format (AIOStreams style)
  const qualityLine = [
    quality ? `🎥 ${quality}` : undefined,
    codec ? `🎞️ ${codec}` : undefined,
    releaseGroup ? `🏷️ ${releaseGroup}` : undefined,
  ].filter(Boolean).join(" ");
  
  const audioLine = audio ? `🎧 ${audio}` : undefined;
  
  const detailsLine = [
    `📦 ${formatBytes(data.size)}`,
    `👥 ${data.seeds} seeds`,
    `🔍 ${data.tracker}`,
  ].join(" ");
  
  const languageLine = data.language !== "English" ? `🌐 ${data.language}` : undefined;
  
  const description = [
    qualityLine,
    audioLine,
    detailsLine,
    languageLine,
  ].filter(Boolean).join("\n");

  return { name, description };
}

/**
 * Torrentio Style 
 */
export function torrentioFormatter(data: StreamFormatData): { name: string; description: string } {
  const { quality, hdr, cached } = data;
  const hdrText = hdr && hdr.length > 0 ? ` ${hdr.join(" | ")}` : "";
  const cachedIcon = cached ? "⚡ " : "";
  
  // Just show quality on the left side 
  const name = `${cachedIcon}${quality}${hdrText}`;
  
  const description = [
    data.torrentName,
    [
      `👤 ${data.seeds}`,
      `💾 ${formatBytes(data.size)}`,
      `⚙️ ${data.tracker}`,
    ].join(" "),
    data.language !== "English" ? `${data.language}` : undefined,
  ].filter(Boolean).join("\n");

  return { name, description };
}

/**
 * Minimal Style - Just the essentials
 */
export function minimalFormatter(data: StreamFormatData): { name: string; description: string } {
  const { quality, cached } = data;
  const cachedIcon = cached ? "⚡ " : "";
  
  const name = `${cachedIcon}${quality}`;
  
  const parts = [
    formatBytes(data.size),
    `${data.seeds} seeds`,
    data.tracker,
    data.language !== "English" ? data.language : undefined,
  ].filter(Boolean);
  
  const description = parts.join(" • ");

  return { name, description };
}

/**
 * Detailed Style - Everything
 */
export function detailedFormatter(data: StreamFormatData): { name: string; description: string } {
  const { quality, hdr, codec, audio, source, releaseGroup, cached, debridService } = data;
  
  const cachedBadge = cached ? "⚡ " : "";
  const hdrText = hdr && hdr.length > 0 ? ` [${hdr.join("+")}]` : "";
  const name = `${cachedBadge}${quality}${hdrText}`;
  
  const description = [
    `📁 ${data.torrentName}`,
    data.fileName !== data.torrentName ? `└─ ${data.fileName}` : undefined,
    "",
    "Video:",
    [
      quality ? `  Resolution: ${quality}` : undefined,
      source ? `  Source: ${source}` : undefined,
      codec ? `  Codec: ${codec}` : undefined,
      hdr && hdr.length > 0 ? `  HDR: ${hdr.join(", ")}` : undefined,
    ].filter(Boolean).join("\n"),
    "",
    "Audio:",
    [
      audio ? `  Format: ${audio}` : undefined,
      data.language ? `  Language: ${data.language}` : undefined,
    ].filter(Boolean).join("\n"),
    "",
    "Details:",
    [
      `  Size: ${formatBytes(data.size)}`,
      `  Seeds: ${data.seeds} / Peers: ${data.peers}`,
      `  Tracker: ${data.tracker}`,
      releaseGroup ? `  Group: ${releaseGroup}` : undefined,
      cached ? `  Debrid: ${debridService} (Cached)` : undefined,
    ].filter(Boolean).join("\n"),
  ].filter(Boolean).join("\n");

  return { name, description };
}

/**
 * Prism Style - Visual quality indicators
 */
export function prismFormatter(data: StreamFormatData): { name: string; description: string } {
  const { quality, hdr, cached } = data;
  
  // Quality icons
  const qualityIcon = {
    "4K": "🔥",
    "2160p": "🔥",
    "1440p": "✨",
    "1080p": "🚀",
    "720p": "💿",
    "480p": "📀",
  }[quality] || "❓";
  
  const qualityText = quality.replace("2160p", "4K UHD")
    .replace("1440p", "QHD")
    .replace("1080p", "FHD")
    .replace("720p", "HD");
  
  const cachedIcon = cached ? "⚡" : "⬇️";
  const hdrText = hdr && hdr.length > 0 ? ` ${hdr.join(" ")}` : "";
  
  const name = `${qualityIcon} ${qualityText}${hdrText}`;
  
  const description = [
    `🎬 ${data.torrentName}`,
    [
      data.source ? `🎥 ${data.source}` : undefined,
      data.codec ? `🎞️ ${data.codec}` : undefined,
      data.audio ? `🎧 ${data.audio}` : undefined,
    ].filter(Boolean).join(" "),
    [
      `📦 ${formatBytes(data.size)}`,
      `🌱 ${data.seeds} seeds`,
      data.releaseGroup ? `🏷️ ${data.releaseGroup}` : undefined,
    ].filter(Boolean).join(" • "),
    [
      `${cachedIcon} ${data.tracker}`,
      data.language !== "English" ? `🗣️ ${data.language}` : undefined,
    ].filter(Boolean).join(" • "),
  ].filter(Boolean).join("\n");

  return { name, description };
}

/**
 * Compact Style - Dense but organized
 */
export function compactFormatter(data: StreamFormatData): { name: string; description: string } {
  const { quality, cached, debridService, hdr } = data;
  
  const badge = cached ? `[${debridService?.slice(0,2)}⚡]` : `[${data.tracker.slice(0,3)}]`;
  const hdrBadge = hdr && hdr.length > 0 ? `[${hdr.join("+")}]` : "";
  
  const name = `${badge} ${quality}${hdrBadge}`;
  
  const specs = [
    data.codec,
    data.audio,
    data.source,
    data.language !== "English" ? data.language : undefined,
  ].filter(Boolean).join(" • ");
  
  const description = `${formatBytes(data.size)} • ${data.seeds}↑ ${data.peers}↓${specs ? " • " + specs : ""}`;

  return { name, description };
}

/**
 * Pro Style - Professional layout with organized sections
 */
export function proFormatter(data: StreamFormatData): { name: string; description: string } {
  const { quality, hdr, cached, debridService } = data;
  
  const statusIcon = cached ? "⚡ INSTANT" : "⬇️ DOWNLOAD";
  const hdrText = hdr && hdr.length > 0 ? ` + ${hdr.join("+")}` : "";
  
  const name = `${quality}${hdrText}`;
  
  const videoLine = [
    data.source || quality,
    data.codec,
    hdr && hdr.length > 0 ? hdr.join("+") : undefined,
  ].filter(Boolean).join(" • ");
  
  const audioLine = [
    data.audio,
    data.language !== "English" ? data.language : undefined,
  ].filter(Boolean).join(" • ");
  
  const statsLine = `${formatBytes(data.size)} • ${data.seeds} seeds • ${data.tracker}`;
  const statusLine = cached ? `${statusIcon} via ${debridService}` : `${statusIcon} from ${data.tracker}`;
  
  const description = [
    `📹 ${videoLine}`,
    audioLine ? `🔊 ${audioLine}` : undefined,
    `📊 ${statsLine}`,
    statusLine,
    data.releaseGroup ? `🎭 ${data.releaseGroup}` : undefined,
  ].filter(Boolean).join("\n");

  return { name, description };
}

/**
 * Ultra-Clean Style - YARR! 
 */
export function ultraCleanFormatter(data: StreamFormatData): { name: string; description: string } {
  const { quality, cached } = data;
  
  // Just show the essentials, nothing more
  const icon = cached ? "⚡" : "";
  const name = `${icon} ${quality}`.trim();
  
  // One clean line with pipe separators
  const parts = [
    formatBytes(data.size),
    `${data.seeds} seeds`,
    data.tracker,
    data.language !== "English" ? data.language : undefined,
  ].filter(Boolean);
  
  const description = parts.join(" | ");

  return { name, description };
}

/**
 * Get formatter function by type
 */
export function getFormatter(type: FormatterType): (data: StreamFormatData) => { name: string; description: string } {
  switch (type) {
    case "google":
      return googleFormatter;
    case "google-light":
      return googleLightFormatter;
    case "torrentio":
      return torrentioFormatter;
    case "minimal":
      return minimalFormatter;
    case "detailed":
      return detailedFormatter;
    case "prism":
      return prismFormatter;
    case "compact":
      return compactFormatter;
    case "pro":
      return proFormatter;
    case "ultra-clean":
      return ultraCleanFormatter;
    default:
      return yarrFormatter;
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

