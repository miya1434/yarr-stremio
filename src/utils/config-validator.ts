/**
 * Configuration validator for YARR!
 * Ensures user config is valid and provides helpful error messages
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateConfig(config: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate debrid configuration
  if (config.debridService && config.debridService !== "None") {
    if (!config.debridApiKey || config.debridApiKey.trim().length < 10) {
      errors.push(
        `${config.debridService} selected but API key is missing or too short`
      );
    }
  }

  // Validate Prowlarr configuration
  if (config.enableProwlarr === "on") {
    if (!config.prowlarrUrl) {
      warnings.push("Prowlarr enabled but URL not provided");
    }
    if (!config.prowlarrKey) {
      warnings.push("Prowlarr enabled but API key not provided");
    }
  }

  // Validate Zilean configuration
  if (config.enableZilean === "on") {
    if (!config.zileanUrl) {
      warnings.push("Zilean enabled but URL not provided");
    }
  }

  // Validate private tracker credentials
  if (config.enableNcore === "on") {
    if (!config.nCoreUser || !config.nCorePassword) {
      warnings.push("nCore enabled but credentials not provided");
    }
  }

  if (config.enableInsane === "on") {
    if (!config.insaneUser || !config.insanePassword) {
      warnings.push("iNSANE enabled but credentials not provided");
    }
  }

  if (config.enableRutracker === "on") {
    warnings.push("RuTracker requires authentication - feature not fully implemented yet");
  }

  // Validate numeric values
  const minSeeders = parseInt(config.minSeeders || "0");
  if (isNaN(minSeeders) || minSeeders < 0) {
    errors.push("Minimum seeders must be a non-negative number");
  }

  const maxResults = parseInt(config.maxResults || "5");
  if (isNaN(maxResults) || maxResults < 1 || maxResults > 20) {
    errors.push("Maximum results must be between 1 and 20");
  }

  // Check if at least one provider is enabled
  const providerKeys = [
    "enableYts", "enableEztv", "enable1337x", "enableThePirateBay",
    "enableRarbg", "enableKickassTorrents", "enableTorrentGalaxy",
    "enableMagnetDL", "enableNyaaSi", "enableJackett", "enableProwlarr",
  ];

  const hasEnabledProvider = providerKeys.some((key) => config[key] === "on");

  if (!hasEnabledProvider) {
    warnings.push(
      "No providers enabled! Enable at least one provider to get results"
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function getConfigSummary(config: any): string {
  const enabledProviders: string[] = [];
  
  const providerMapping: Record<string, string> = {
    enableYts: "YTS",
    enableEztv: "EZTV",
    enable1337x: "1337x",
    enableThePirateBay: "TPB",
    enableRarbg: "RARBG",
    enableNyaaSi: "NyaaSi",
    enableProwlarr: "Prowlarr",
    enableZilean: "Zilean",
  };

  for (const [key, name] of Object.entries(providerMapping)) {
    if (config[key] === "on") {
      enabledProviders.push(name);
    }
  }

  const debrid = config.debridService !== "None" ? config.debridService : "None";
  const sortMode = config.sortBy || "Quality then Seeders";
  const minSeeders = config.minSeeders || "0";

  return `Providers: ${enabledProviders.join(", ")} | Debrid: ${debrid} | Sort: ${sortMode} | Min Seeds: ${minSeeders}`;
}

