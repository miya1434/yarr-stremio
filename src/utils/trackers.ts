import axios from "axios";

const TRACKERS_URL = "https://raw.githubusercontent.com/ngosang/trackerslist/master/trackers_best.txt";

const ANIME_TRACKERS = [
  "http://nyaa.tracker.wf:7777/announce",
  "http://anidex.moe:6969/announce",
  "http://tracker.anirena.com:80/announce",
  "udp://tracker.uw0.xyz:6969/announce",
  "http://share.camoe.cn:8080/announce",
  "http://t.nyaatracker.com:80/announce",
  "udp://open.stealth.si:80/announce",
  "udp://tracker.opentrackr.org:1337/announce",
];

const RUSSIAN_TRACKERS = [
  "udp://opentor.net:6969",
  "http://bt.t-ru.org/ann?magnet",
  "http://bt2.t-ru.org/ann?magnet",
  "http://bt3.t-ru.org/ann?magnet",
  "http://bt4.t-ru.org/ann?magnet",
  "http://retracker.local/announce",
];

const INTERNATIONAL_TRACKERS = [
  "udp://tracker.torrent.eu.org:451/announce",
  "udp://tracker.tiny-vps.com:6969/announce",
  "udp://open.demonii.com:1337/announce",
];

let BEST_TRACKERS: string[] = [];
let ALL_ANIME_TRACKERS: string[] = [];
let ALL_RUSSIAN_TRACKERS: string[] = [];
let ALL_GENERAL_TRACKERS: string[] = [];

export const initBestTrackers = async (): Promise<void> => {
  try {
    const response = await axios.get(TRACKERS_URL, {
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    BEST_TRACKERS = response.data
      .trim()
      .split("\n\n")
      .filter((t: string) => t.trim().length > 0);

    ALL_ANIME_TRACKERS = unique([...BEST_TRACKERS, ...ANIME_TRACKERS]);
    ALL_RUSSIAN_TRACKERS = unique([...BEST_TRACKERS, ...RUSSIAN_TRACKERS]);
    ALL_GENERAL_TRACKERS = unique([...BEST_TRACKERS, ...INTERNATIONAL_TRACKERS]);

    console.log(`Retrieved ${BEST_TRACKERS.length} best trackers`);
  } catch (error) {
    console.error("Failed to retrieve best trackers:", error);
    // Fallback to hardcoded trackers
    BEST_TRACKERS = [
      "udp://tracker.opentrackr.org:1337/announce",
      "udp://open.stealth.si:80/announce",
      "udp://tracker.torrent.eu.org:451/announce",
    ];
    ALL_ANIME_TRACKERS = unique([...BEST_TRACKERS, ...ANIME_TRACKERS]);
    ALL_RUSSIAN_TRACKERS = unique([...BEST_TRACKERS, ...RUSSIAN_TRACKERS]);
    ALL_GENERAL_TRACKERS = BEST_TRACKERS;
  }
};

export const enhanceMagnetLink = (
  magnetLink: string,
  torrentName: string,
  trackerType: "anime" | "russian" | "general" = "general"
): string => {
  if (!magnetLink) return magnetLink;

  // Parse existing magnet
  const infoHashMatch = magnetLink.match(/btih:([a-f0-9]{40})/i);
  if (!infoHashMatch) return magnetLink;

  const infoHash = infoHashMatch[1];
  const name = encodeURIComponent(torrentName);

  // Select appropriate tracker list
  let trackers: string[];
  switch (trackerType) {
    case "anime":
      trackers = ALL_ANIME_TRACKERS;
      break;
    case "russian":
      trackers = ALL_RUSSIAN_TRACKERS;
      break;
    default:
      trackers = ALL_GENERAL_TRACKERS;
  }

  // Build enhanced magnet link
  const trackerParams = trackers.map((t) => `&tr=${encodeURIComponent(t)}`).join("");

  return `magnet:?xt=urn:btih:${infoHash}&dn=${name}${trackerParams}`;
};

export const getTrackerSources = (
  infoHash: string,
  trackerType: "anime" | "russian" | "general" = "general"
): string[] => {
  let trackers: string[];
  switch (trackerType) {
    case "anime":
      trackers = ALL_ANIME_TRACKERS;
      break;
    case "russian":
      trackers = ALL_RUSSIAN_TRACKERS;
      break;
    default:
      trackers = ALL_GENERAL_TRACKERS;
  }

  const sources = trackers.map((tracker) => `tracker:${tracker}`);
  sources.push(`dht:${infoHash}`);
  return sources;
};

export const isAnimeTracker = (trackerName: string): boolean => {
  const animeTrackers = [
    "nyaasi",
    "tokyotosho",
    "anidex",
    "horriblesubs",
    "subsplease",
    "anilibria",
    "erai",
  ];
  return animeTrackers.includes(trackerName.toLowerCase());
};

export const isRussianTracker = (trackerName: string): boolean => {
  const russianTrackers = ["rutor", "rutracker", "anilibria"];
  return russianTrackers.includes(trackerName.toLowerCase());
};

function unique(array: string[]): string[] {
  return Array.from(new Set(array));
}

