import { JackettCategory } from "ts-jackett-api/lib/types/JackettCategory.js";
import { searchEztv } from "./eztv.js";
import {
  ItorrentCategory,
  ItorrentQuality,
  searchItorrent,
} from "./itorrent.js";
import { searchJackett } from "./jackett.js";
import { NcoreCategory, searchNcore } from "./ncore.js";
import { searchYts } from "./yts.js";
import { InsaneCategory, searchInsane } from "./insane.js";
import { search1337x } from "./1337x.js";
import { searchThePirateBay } from "./thepiratebay.js";
import { searchRarbg } from "./rarbg.js";
import { searchKickassTorrents } from "./kickasstorrents.js";
import { searchTorrentGalaxy } from "./torrentgalaxy.js";
import { searchMagnetDL } from "./magnetdl.js";
import { searchNyaaSi } from "./nyaasi.js";
import { searchTokyoTosho } from "./tokyotosho.js";
import { searchAniDex } from "./anidex.js";
import { searchCinecalidad } from "./cinecalidad.js";
import { searchRutracker } from "./rutracker.js";
import { searchProwlarr } from "./prowlarr.js";
import { searchZilean } from "./zilean.js";
import { searchRutor } from "./rutor.js";
import { searchComando } from "./comando.js";
import { searchBluDV } from "./bludv.js";
import { searchTorrent9 } from "./torrent9.js";
import { searchIlCorSaRoNeRo } from "./ilcorsaronero.js";
import { searchMejorTorrent } from "./mejortorrent.js";
import { searchWolfmax4k } from "./wolfmax4k.js";
import { searchBestTorrents } from "./besttorrents.js";
import { searchMicoLeaoDublado } from "./micoleaodublado.js";
import { searchLimeTorrents } from "./limetorrents.js";
import { searchZooqle } from "./zooqle.js";
import { searchETTV } from "./ettv.js";
import { searchTorrentDownloads } from "./torrentdownloads.js";
import { searchBTDB } from "./btdb.js";
import { searchTorrentz2 } from "./torrentz2.js";
import { searchHorribleSubs } from "./horriblesubs.js";
import { searchSubsPlease } from "./subsplease.js";
import { searchSkyTorrents } from "./skytorrents.js";
import { searchGloTorrents } from "./glodls.js";
import { searchTorLock } from "./torlock.js";
import { searchYIFY } from "./yify.js";
import { searchSolidTorrents } from "./solidtorrents.js";
import { searchTorrentProject } from "./torrentproject.js";
import { searchTPBClean } from "./tpbclean.js";
import { searchTorrentFunk } from "./torrentfunk.js";
import { searchAniLibria } from "./anilibria.js";
import { searchEraiRaws } from "./erai.js";
import { providerHealth } from "../utils/provider-health.js";

export type TorrentCategory = "movie" | "show";

export type TorrentSource =
  | "jackett"
  | "ncore"
  | "insane"
  | "itorrent"
  | "yts"
  | "eztv"
  | "1337x"
  | "thepiratebay"
  | "rarbg"
  | "kickasstorrents"
  | "torrentgalaxy"
  | "magnetdl"
  | "nyaasi"
  | "tokyotosho"
  | "anidex"
  | "cinecalidad"
  | "rutracker"
  | "prowlarr"
  | "zilean"
  | "rutor"
  | "comando"
  | "bludv"
  | "torrent9"
  | "ilcorsaronero"
  | "mejortorrent"
  | "wolfmax4k"
  | "besttorrents"
  | "micoleaodublado"
  | "limetorrents"
  | "zooqle"
  | "ettv"
  | "torrentdownloads"
  | "btdb"
  | "torrentz2"
  | "horriblesubs"
  | "subsplease"
  | "skytorrents"
  | "glotorrents"
  | "torlock"
  | "yify"
  | "solidtorrents"
  | "torrentproject"
  | "tpbclean"
  | "torrentfunk"
  | "anilibria"
  | "erai";

export interface TorrentSearchOptions {
  categories?: TorrentCategory[];
  sources?: TorrentSource[];
  jackett?: {
    url?: string;
    apiKey?: string;
  };
  prowlarr?: {
    url?: string;
    apiKey?: string;
  };
  zilean?: {
    url?: string;
  };
  ncore?: {
    user?: string;
    password?: string;
  };
  insane?: {
    user?: string;
    password?: string;
  };
}

export interface TorrentSearchResult {
  name: string;
  tracker: string;
  category?: string;
  size?: number;
  seeds?: number;
  peers?: number;
  torrent?: string;
  magnet?: string;
  infohash?: string;
}

export const searchTorrents = async (
  query: string,
  options?: TorrentSearchOptions
) => {
  const searchAllCategories = !options?.categories?.length;
  const searchAllSources = !options?.sources?.length;

  const promises: Promise<TorrentSearchResult[]>[] = [];

  if (options?.sources?.includes("jackett") || searchAllSources) {
    const categories = new Set<JackettCategory>();

    if (options?.categories?.includes("movie") || searchAllCategories) {
      categories.add(JackettCategory.Movies);
    }

    if (options?.categories?.includes("show") || searchAllCategories) {
      categories.add(JackettCategory.TV);
    }

    promises.push(
      searchJackett(
        query,
        Array.from(categories),
        options?.jackett?.url,
        options?.jackett?.apiKey
      )
    );
  }

  if (options?.sources?.includes("ncore") || searchAllSources) {
    const categories = new Set<NcoreCategory>();

    if (options?.categories?.includes("movie") || searchAllCategories) {
      categories.add(NcoreCategory.Film_HD_HU);
      categories.add(NcoreCategory.Film_HD_EN);
      categories.add(NcoreCategory.Film_SD_HU);
      categories.add(NcoreCategory.Film_SD_EN);
    }

    if (options?.categories?.includes("show") || searchAllCategories) {
      categories.add(NcoreCategory.Sorozat_HD_HU);
      categories.add(NcoreCategory.Sorozat_HD_EN);
      categories.add(NcoreCategory.Sorozat_SD_HU);
      categories.add(NcoreCategory.Sorozat_SD_EN);
    }

    promises.push(
      searchNcore(
        query,
        Array.from(categories),
        options?.ncore?.user,
        options?.ncore?.password
      )
    );
  }

  if (options?.sources?.includes("insane") || searchAllSources) {
    const categories = new Set<InsaneCategory>();

    if (options?.categories?.includes("movie") || searchAllCategories) {
      categories.add(InsaneCategory.Film_Hun_SD);
      categories.add(InsaneCategory.Film_Hun_HD);
      categories.add(InsaneCategory.Film_Hun_UHD);
      categories.add(InsaneCategory.Film_Eng_SD);
      categories.add(InsaneCategory.Film_Eng_HD);
      categories.add(InsaneCategory.Film_Eng_UHD);
    }

    if (options?.categories?.includes("show") || searchAllCategories) {
      categories.add(InsaneCategory.Sorozat_Hun);
      categories.add(InsaneCategory.Sorozat_Hun_HD);
      categories.add(InsaneCategory.Sorozat_Hun_UHD);
      categories.add(InsaneCategory.Sorozat_Eng);
      categories.add(InsaneCategory.Sorozat_Eng_HD);
      categories.add(InsaneCategory.Sorozat_Eng_UHD);
    }

    promises.push(
      searchInsane(
        query,
        Array.from(categories),
        options?.insane?.user,
        options?.insane?.password
      )
    );
  }

  if (options?.sources?.includes("itorrent") || searchAllSources) {
    const categories = new Set<ItorrentCategory>();

    if (options?.categories?.includes("movie") || searchAllCategories) {
      categories.add(ItorrentCategory.Film);
    }

    if (options?.categories?.includes("show") || searchAllCategories) {
      categories.add(ItorrentCategory.Sorozat);
    }

    const qualities = [
      ItorrentQuality.HD,
      ItorrentQuality.SD,
      ItorrentQuality.CAM,
    ];

    promises.push(searchItorrent(query, Array.from(categories), qualities));
  }

  if (options?.sources?.includes("yts") || searchAllSources) {
    if (options?.categories?.includes("movie") || searchAllCategories) {
      promises.push(searchYts(query));
    }
  }

  if (options?.sources?.includes("eztv") || searchAllSources) {
    if (options?.categories?.includes("show") || searchAllCategories) {
      promises.push(searchEztv(query));
    }
  }

  // New YARR! providers
  if (options?.sources?.includes("1337x") || searchAllSources) {
    promises.push(search1337x(query));
  }

  if (options?.sources?.includes("thepiratebay") || searchAllSources) {
    promises.push(searchThePirateBay(query));
  }

  if (options?.sources?.includes("rarbg") || searchAllSources) {
    promises.push(searchRarbg(query));
  }

  if (options?.sources?.includes("kickasstorrents") || searchAllSources) {
    promises.push(searchKickassTorrents(query));
  }

  if (options?.sources?.includes("torrentgalaxy") || searchAllSources) {
    promises.push(searchTorrentGalaxy(query));
  }

  if (options?.sources?.includes("magnetdl") || searchAllSources) {
    promises.push(searchMagnetDL(query));
  }

  // Anime trackers
  if (options?.sources?.includes("nyaasi") || searchAllSources) {
    promises.push(searchNyaaSi(query));
  }

  if (options?.sources?.includes("tokyotosho") || searchAllSources) {
    promises.push(searchTokyoTosho(query));
  }

  if (options?.sources?.includes("anidex") || searchAllSources) {
    promises.push(searchAniDex(query));
  }

  // International trackers
  if (options?.sources?.includes("cinecalidad") || searchAllSources) {
    if (options?.categories?.includes("movie") || searchAllCategories) {
      promises.push(searchCinecalidad(query));
    }
  }

  if (options?.sources?.includes("rutracker") || searchAllSources) {
    promises.push(
      searchRutracker(query, options?.ncore?.user, options?.ncore?.password)
    );
  }

  // Prowlarr and Zilean
  if (options?.sources?.includes("prowlarr") || searchAllSources) {
    promises.push(
      searchProwlarr(query, options?.prowlarr?.url, options?.prowlarr?.apiKey)
    );
  }

  if (options?.sources?.includes("zilean") || searchAllSources) {
    promises.push(searchZilean(query, options?.zilean?.url));
  }

  // More international trackers
  if (options?.sources?.includes("rutor") || searchAllSources) {
    promises.push(searchRutor(query));
  }

  if (options?.sources?.includes("comando") || searchAllSources) {
    if (options?.categories?.includes("movie") || searchAllCategories) {
      promises.push(searchComando(query));
    }
  }

  if (options?.sources?.includes("bludv") || searchAllSources) {
    promises.push(searchBluDV(query));
  }

  if (options?.sources?.includes("torrent9") || searchAllSources) {
    promises.push(searchTorrent9(query));
  }

  if (options?.sources?.includes("ilcorsaronero") || searchAllSources) {
    promises.push(searchIlCorSaRoNeRo(query));
  }

  if (options?.sources?.includes("mejortorrent") || searchAllSources) {
    promises.push(searchMejorTorrent(query));
  }

  if (options?.sources?.includes("wolfmax4k") || searchAllSources) {
    promises.push(searchWolfmax4k(query));
  }

  if (options?.sources?.includes("besttorrents") || searchAllSources) {
    promises.push(searchBestTorrents(query));
  }

  if (options?.sources?.includes("micoleaodublado") || searchAllSources) {
    if (options?.categories?.includes("movie") || searchAllCategories) {
      promises.push(searchMicoLeaoDublado(query));
    }
  }

  // Additional general trackers
  if (options?.sources?.includes("limetorrents") || searchAllSources) {
    promises.push(searchLimeTorrents(query));
  }

  if (options?.sources?.includes("zooqle") || searchAllSources) {
    promises.push(searchZooqle(query));
  }

  if (options?.sources?.includes("ettv") || searchAllSources) {
    if (options?.categories?.includes("show") || searchAllCategories) {
      promises.push(searchETTV(query));
    }
  }

  if (options?.sources?.includes("torrentdownloads") || searchAllSources) {
    promises.push(searchTorrentDownloads(query));
  }

  if (options?.sources?.includes("btdb") || searchAllSources) {
    promises.push(searchBTDB(query));
  }

  if (options?.sources?.includes("torrentz2") || searchAllSources) {
    promises.push(searchTorrentz2(query));
  }

  if (options?.sources?.includes("skytorrents") || searchAllSources) {
    promises.push(searchSkyTorrents(query));
  }

  if (options?.sources?.includes("glotorrents") || searchAllSources) {
    promises.push(searchGloTorrents(query));
  }

  if (options?.sources?.includes("torlock") || searchAllSources) {
    promises.push(searchTorLock(query));
  }

  if (options?.sources?.includes("yify") || searchAllSources) {
    if (options?.categories?.includes("movie") || searchAllCategories) {
      promises.push(searchYIFY(query));
    }
  }

  if (options?.sources?.includes("solidtorrents") || searchAllSources) {
    promises.push(searchSolidTorrents(query));
  }

  if (options?.sources?.includes("torrentproject") || searchAllSources) {
    promises.push(searchTorrentProject(query));
  }

  if (options?.sources?.includes("tpbclean") || searchAllSources) {
    promises.push(searchTPBClean(query));
  }

  if (options?.sources?.includes("torrentfunk") || searchAllSources) {
    promises.push(searchTorrentFunk(query));
  }

  // Additional anime trackers
  if (options?.sources?.includes("horriblesubs") || searchAllSources) {
    promises.push(searchHorribleSubs(query));
  }

  if (options?.sources?.includes("subsplease") || searchAllSources) {
    promises.push(searchSubsPlease(query));
  }

  if (options?.sources?.includes("anilibria") || searchAllSources) {
    promises.push(searchAniLibria(query));
  }

  if (options?.sources?.includes("erai") || searchAllSources) {
    promises.push(searchEraiRaws(query));
  }

  // Execute all promises with proper error handling AND track provider health
  const startTime = Date.now();
  const results = await Promise.allSettled(promises);
  
  // Extract successful results and log failures + track health
  const successfulResults: TorrentSearchResult[] = [];
  let failedCount = 0;
  const providerNames = options?.sources || [];
  
  results.forEach((result, index) => {
    const providerName = providerNames[index] || `provider-${index}`;
    const responseTime = Date.now() - startTime;

    if (result.status === "fulfilled" && result.value) {
      const resultCount = result.value.length;
      successfulResults.push(...result.value);
      
      // Record success with health monitor
      providerHealth.recordResult(providerName, true, responseTime);
      
      if (resultCount > 0) {
        console.log(`✅ ${providerName}: ${resultCount} results (${responseTime}ms)`);
      }
    } else if (result.status === "rejected") {
      failedCount++;
      
      // Record failure with health monitor
      providerHealth.recordResult(providerName, false, responseTime);
      
      console.warn(`❌ ${providerName} failed:`, result.reason);
    }
  });

  console.log(`Search: got ${successfulResults.length} results for ${query} (${failedCount}/${results.length} providers failed)`);

  return successfulResults;
};
