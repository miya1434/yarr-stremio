import titleParser from "parse-torrent-title";

export interface ParsedTorrentInfo {
  title?: string;
  season?: number;
  episode?: number;
  resolution?: string;
  quality?: string;
  codec?: string;
  audio?: string;
  group?: string;
  hdr?: string[];
  source?: string;
  language?: string[];
  dubbed?: boolean;
  threeD?: boolean;
  proper?: boolean;
  repack?: boolean;
  bitDepth?: string;
}

/**
 * Enhanced torrent name parsing using parse-torrent-title
 * This is what Torrentio uses for accurate quality detection
 */
export function parseTorrentName(name: string): ParsedTorrentInfo {
  try {
    const parsed = titleParser.parse(name);
    
    // Detect HDR from the torrent name manually
    const hdrTypes: string[] = [];
    const nameLower = name.toLowerCase();
    if (nameLower.includes('hdr10+')) hdrTypes.push('HDR10+');
    else if (nameLower.includes('hdr10')) hdrTypes.push('HDR10');
    if (nameLower.includes('dolby vision') || nameLower.includes('dv ') || nameLower.includes('.dv.')) hdrTypes.push('DV');
    if (nameLower.includes('hlg')) hdrTypes.push('HLG');
    
    return {
      title: parsed.title,
      season: parsed.season,
      episode: parsed.episode,
      resolution: parsed.resolution,
      quality: parsed.resolution, // parse-torrent-title doesn't have separate 'quality' field
      codec: parsed.codec,
      audio: parsed.audio,
      group: parsed.group,
      hdr: hdrTypes.length > 0 ? hdrTypes : undefined,
      source: parsed.source,
      language: parsed.language ? [parsed.language] : undefined,
      dubbed: false, // parse-torrent-title doesn't have this
      threeD: nameLower.includes('3d'), // Detect 3D manually
      proper: parsed.proper,
      repack: parsed.repack,
      bitDepth: parsed.bitdepth?.toString(),
    };
  } catch (error) {
    console.error("Error parsing torrent name:", error);
    return { title: name };
  }
}

/**
 * Get quality string from parsed info (Torrentio-style)
 */
export function getQualityFromParsed(
  parsed: ParsedTorrentInfo,
  fileParsed?: ParsedTorrentInfo
): string {
  const CAM_SOURCES = ["CAM", "TeleSync", "TeleCine", "SCR"];

  // Check for CAM sources first
  if (fileParsed?.source && CAM_SOURCES.includes(fileParsed.source)) {
    return fileParsed.source;
  }
  if (parsed.source && CAM_SOURCES.includes(parsed.source)) {
    return parsed.source;
  }

  // Use resolution or source
  const resolution =
    fileParsed?.resolution || parsed.resolution || parsed.quality;
  const source = fileParsed?.source || parsed.source;

  return resolution || source || "Unknown";
}

/**
 * Format quality with HDR profiles (Torrentio-style)
 */
export function formatQualityName(
  quality: string,
  hdrProfiles: string[] = [],
  threeD: boolean = false
): string {
  const parts = [quality];

  if (hdrProfiles.length > 0) {
    parts.push(hdrProfiles.join(" | "));
  }

  if (threeD) {
    parts.push("3D");
  }

  return parts.join(" ");
}

/**
 * Get binge group identifier for episode grouping (Torrentio-style)
 */
export function getBingeGroup(
  infoHash: string,
  torrentParsed: ParsedTorrentInfo,
  fileParsed: ParsedTorrentInfo,
  quality: string,
  type: "movie" | "series",
  sameInfo: boolean
): string {
  if (type === "movie") {
    // For movies, group by quality and source
    const parts = [quality];
    const source = torrentParsed.source || fileParsed.source;
    if (source && source !== quality) {
      parts.push(source);
    }
    if (torrentParsed.codec || fileParsed.codec) {
      parts.push(torrentParsed.codec || fileParsed.codec);
    }
    if (torrentParsed.bitDepth || fileParsed.bitDepth) {
      parts.push(torrentParsed.bitDepth || fileParsed.bitDepth);
    }
    if (torrentParsed.hdr || fileParsed.hdr) {
      parts.push(...(torrentParsed.hdr || fileParsed.hdr || []));
    }
    return `yarr|${parts.filter(Boolean).join("|")}`;
  } else if (sameInfo) {
    // For series with same info, group by quality and group
    const parts = [quality];
    if (fileParsed.hdr) {
      parts.push(...fileParsed.hdr);
    }
    if (fileParsed.group) {
      parts.push(fileParsed.group);
    }
    return `yarr|${parts.filter(Boolean).join("|")}`;
  }

  // Default: use info hash
  return `yarr|${infoHash}`;
}

/**
 * Check if file info is same as torrent info
 */
export function isSameInfo(
  fileName: string,
  torrentName: string,
  fileSize: number,
  torrentSize: number,
  fileIndex?: number
): boolean {
  const SIZE_DELTA = 0.05;

  return (
    !Number.isInteger(fileIndex) ||
    Math.abs(fileSize / torrentSize - 1) < SIZE_DELTA ||
    fileName.includes(torrentName)
  );
}

