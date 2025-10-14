import {
  checkRealDebridCached,
  getRealDebridStream,
} from "./realdebrid.js";
import {
  checkPremiumizeCached,
  getPremiumizeStream,
} from "./premiumize.js";
import {
  checkAllDebridCached,
  getAllDebridStream,
} from "./alldebrid.js";
import {
  checkDebridLinkCached,
  getDebridLinkStream,
} from "./debridlink.js";
import {
  checkTorBoxCached,
  getTorBoxStream,
} from "./torbox.js";
import {
  checkPikPakCached,
  getPikPakStream,
} from "./pikpak.js";

export interface DebridService {
  name: string;
  checkCached: (magnetLink: string, apiKey: string) => Promise<boolean>;
  getStream: (magnetLink: string, apiKey: string) => Promise<string | null>;
}

export const debridServices: Record<string, DebridService> = {
  RealDebrid: {
    name: "RealDebrid",
    checkCached: checkRealDebridCached,
    getStream: getRealDebridStream,
  },
  Premiumize: {
    name: "Premiumize",
    checkCached: checkPremiumizeCached,
    getStream: getPremiumizeStream,
  },
  AllDebrid: {
    name: "AllDebrid",
    checkCached: checkAllDebridCached,
    getStream: getAllDebridStream,
  },
  DebridLink: {
    name: "DebridLink",
    checkCached: checkDebridLinkCached,
    getStream: getDebridLinkStream,
  },
  TorBox: {
    name: "TorBox",
    checkCached: checkTorBoxCached,
    getStream: getTorBoxStream,
  },
  PikPak: {
    name: "PikPak",
    checkCached: checkPikPakCached,
    getStream: getPikPakStream,
  },
  // TODO: Implement remaining services
  Offcloud: {
    name: "Offcloud",
    checkCached: async () => false,
    getStream: async () => null,
  },
  "Put.io": {
    name: "Put.io",
    checkCached: async () => false,
    getStream: async () => null,
  },
};

export const getDebridService = (serviceName: string): DebridService | null => {
  return debridServices[serviceName] || null;
};

