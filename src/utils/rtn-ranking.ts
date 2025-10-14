/**
 * RTN (Rank Torrent Name) - Smart torrent ranking system
 Working on this
 */

export interface ParsedTorrent {
  title: string;
  resolution?: string;
  quality?: string;
  codec?: string;
  audio?: string;
  hdr?: string[];
  source?: string;
  releaseGroup?: string;
  repack?: boolean;
  proper?: boolean;
  dubbed?: boolean;
  subbed?: boolean;
  seasons?: number[];
  episodes?: number[];
}

export interface TorrentScore {
  baseScore: number;
  qualityScore: number;
  sourceScore: number;
  audioScore: number;
  groupScore: number;
  totalScore: number;
}

const QUALITY_SCORES: Record<string, number> = {
  "2160p": 100,
  "4K": 100,
  "1080p": 80,
  "720p": 60,
  "576p": 40,
  "480p": 30,
  "SD": 20,
};

const SOURCE_SCORES: Record<string, number> = {
  "BluRay": 100,
  "REMUX": 95,
  "BRRip": 85,
  "WEB-DL": 80,
  "WEBRip": 75,
  "HDTV": 60,
  "DVDRip": 50,
  "DVD": 45,
  "CAM": 10,
  "TS": 15,
  "TC": 20,
  "SCR": 25,
};

const CODEC_SCORES: Record<string, number> = {
  "H.265": 10,
  "HEVC": 10,
  "x265": 10,
  "H.264": 8,
  "x264": 8,
  "AV1": 12,
  "XVID": 5,
};

const AUDIO_SCORES: Record<string, number> = {
  "ATMOS": 15,
  "TrueHD": 12,
  "DTS-HD": 10,
  "DTS": 8,
  "DD5.1": 6,
  "DD+": 6,
  "AAC": 4,
  "MP3": 2,
};

const HDR_SCORES: Record<string, number> = {
  "DV": 15, // Dolby Vision
  "HDR10+": 12,
  "HDR10": 10,
  "HDR": 8,
};


const QUALITY_GROUPS = [
  "SPARKS",
  "RARBG",
  "YTS",
  "YIFY",
  "ETRG",
  "PSA",
  "FGT",
  "MeGusta",
  "ROVERS",
  "TGx",
  "GalaxyRG",
  "UTR",
  "EVO",
  "CMRG",
  "NTb",
  "DEFLATE",
  "FLUX",
];

export function parseTorrentName(name: string): ParsedTorrent {
  const parsed: ParsedTorrent = { title: name };

  // Extract resolution
  const resolutionMatch = name.match(/(\d{3,4}p|4K|2160p|1080p|720p|576p|480p)/i);
  if (resolutionMatch) {
    parsed.resolution = resolutionMatch[1].toUpperCase();
    if (parsed.resolution === "4K") parsed.resolution = "2160p";
  }

  // Extract source
  const sourceMatch = name.match(/(BluRay|REMUX|BRRip|WEB-DL|WEBRip|HDTV|DVDRip|DVD|CAM|TS|TC|SCR)/i);
  if (sourceMatch) {
    parsed.source = sourceMatch[1];
  }

  // Extract codec
  const codecMatch = name.match(/(H\.?265|HEVC|x265|H\.?264|x264|AV1|XVID)/i);
  if (codecMatch) {
    parsed.codec = codecMatch[1].toUpperCase().replace(".", "");
  }

  // Extract audio
  const audioMatch = name.match(/(ATMOS|TrueHD|DTS-HD|DTS|DD5\.1|DD\+|AAC|MP3)/i);
  if (audioMatch) {
    parsed.audio = audioMatch[1].toUpperCase();
  }

  // Extract HDR info
  const hdrTypes: string[] = [];
  if (/DV|Dolby\s*Vision/i.test(name)) hdrTypes.push("DV");
  if (/HDR10\+/i.test(name)) hdrTypes.push("HDR10+");
  else if (/HDR10/i.test(name)) hdrTypes.push("HDR10");
  else if (/HDR/i.test(name)) hdrTypes.push("HDR");
  if (hdrTypes.length) parsed.hdr = hdrTypes;

  // Extract release group
  const groupMatch = name.match(/[-\[]([A-Z0-9]+)[\]\s]*$/i);
  if (groupMatch) {
    parsed.releaseGroup = groupMatch[1];
  }

  // Check for repack/proper
  parsed.repack = /REPACK/i.test(name);
  parsed.proper = /PROPER/i.test(name);

  // Check for dubbed/subbed
  parsed.dubbed = /DUBBED/i.test(name);
  parsed.subbed = /SUBBED/i.test(name);

  // Extract seasons/episodes
  const seasonMatch = name.match(/S(\d{1,2})/i);
  const episodeMatch = name.match(/E(\d{1,2})/i);
  if (seasonMatch) parsed.seasons = [parseInt(seasonMatch[1])];
  if (episodeMatch) parsed.episodes = [parseInt(episodeMatch[1])];

  return parsed;
}

export function calculateTorrentScore(
  torrentName: string,
  fileSize?: number,
  seeders?: number
): TorrentScore {
  const parsed = parseTorrentName(torrentName);

  // Quality score (resolution)
  const qualityScore = parsed.resolution
    ? QUALITY_SCORES[parsed.resolution] || 0
    : 0;

  // Source score
  const sourceScore = parsed.source
    ? SOURCE_SCORES[parsed.source] || 0
    : 0;

  // Audio score
  let audioScore = parsed.audio
    ? AUDIO_SCORES[parsed.audio] || 0
    : 0;

  // Add HDR bonus
  if (parsed.hdr) {
    for (const hdrType of parsed.hdr) {
      audioScore += HDR_SCORES[hdrType] || 0;
    }
  }

  // Codec bonus
  if (parsed.codec) {
    audioScore += CODEC_SCORES[parsed.codec] || 0;
  }

  // Release group score
  let groupScore = 0;
  if (parsed.releaseGroup) {
    if (QUALITY_GROUPS.includes(parsed.releaseGroup.toUpperCase())) {
      groupScore = 10;
    }
  }

  // Repack/Proper bonus
  if (parsed.repack || parsed.proper) {
    groupScore += 5;
  }

  // Seeders bonus (logarithmic scale)
  const seedersBonus = seeders ? Math.log10(seeders + 1) * 5 : 0;

  // Size penalty for overly large files (>50GB) or bonus for reasonable sizes
  let sizeScore = 0;
  if (fileSize) {
    const sizeGB = fileSize / (1024 ** 3);
    if (sizeGB > 50) {
      sizeScore = -10; // Penalty for very large files
    } else if (sizeGB >= 2 && sizeGB <= 15) {
      sizeScore = 5; // Bonus for reasonable size
    }
  }

  const baseScore = qualityScore + sourceScore;
  const totalScore = baseScore + audioScore + groupScore + seedersBonus + sizeScore;

  return {
    baseScore,
    qualityScore,
    sourceScore,
    audioScore,
    groupScore,
    totalScore,
  };
}

export function rankTorrents(
  torrents: Array<{
    name: string;
    size?: number;
    seeds?: number;
  }>
): Array<{
  torrent: any;
  score: TorrentScore;
  rank: number;
}> {
  const scored = torrents.map((torrent) => ({
    torrent,
    score: calculateTorrentScore(torrent.name, torrent.size, torrent.seeds),
    rank: 0,
  }));

  // Sort by total score
  scored.sort((a, b) => b.score.totalScore - a.score.totalScore);

  // Assign ranks
  scored.forEach((item, index) => {
    item.rank = index + 1;
  });

  return scored;
}

export function getBestTorrents(
  torrents: Array<{
    name: string;
    size?: number;
    seeds?: number;
  }>,
  limit: number = 10
): any[] {
  const ranked = rankTorrents(torrents);
  return ranked.slice(0, limit).map((item) => item.torrent);
}

