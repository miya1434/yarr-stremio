/**
 * Machine Learning Recommendation Engine for YARR!
 * Uses user history and preferences to learn and recommend better streams
 * THIS IS A WORK IN PROGRESS STILL I AM WORKING ON IT!!
 */

interface UserPreferences {
  preferredQualities: Map<string, number>; // quality -> count
  preferredTrackers: Map<string, number>; // tracker -> count
  preferredSizes: number[]; // file sizes user selected
  preferredCodecs: Map<string, number>; // codec -> count
  preferredSources: Map<string, number>; // source type -> count
  totalSelections: number;
  lastUpdated: Date;
}

interface StreamFeatures {
  quality: string;
  tracker: string;
  size: number;
  seeds: number;
  codec?: string;
  source?: string;
  hasHDR: boolean;
  hasDolbyVision: boolean;
  hasATMOS: boolean;
}

interface MLScore {
  baseScore: number;
  qualityScore: number;
  trackerScore: number;
  sizeScore: number;
  codecScore: number;
  sourceScore: number;
  popularityScore: number;
  finalScore: number;
  confidence: number;
}

export class MLRecommendationEngine {
  private userPrefs: UserPreferences;
  private readonly STORAGE_FILE = "./data/ml-preferences.json";
  private readonly LEARNING_RATE = 0.1;
  private readonly MIN_SAMPLES = 5; // Minimum selections before ML kicks in

  constructor() {
    this.userPrefs = this.loadPreferences();
  }


  private loadPreferences(): UserPreferences {
   
    return {
      preferredQualities: new Map(),
      preferredTrackers: new Map(),
      preferredSizes: [],
      preferredCodecs: new Map(),
      preferredSources: new Map(),
      totalSelections: 0,
      lastUpdated: new Date(),
    };
  }

 
  private savePreferences(): void {
   
    console.log("ML preferences updated (in-memory)");
  }

  /**
   * Extract features from a stream
   */
  private extractFeatures(stream: any): StreamFeatures {
    const name = stream.torrentName || stream.name || "";
    
    return {
      quality: stream.quality || this.extractQuality(name),
      tracker: stream.torrentTracker || stream.tracker || "Unknown",
      size: stream.fileSize || stream.size || 0,
      seeds: stream.torrentSeeds || stream.seeds || 0,
      codec: this.extractCodec(name),
      source: this.extractSource(name),
      hasHDR: /HDR/i.test(name),
      hasDolbyVision: /DV|Dolby\s*Vision/i.test(name),
      hasATMOS: /ATMOS/i.test(name),
    };
  }

  private extractQuality(name: string): string {
    if (/2160p|4K/i.test(name)) return "4K";
    if (/1080p/i.test(name)) return "1080p";
    if (/720p/i.test(name)) return "720p";
    if (/480p/i.test(name)) return "480p";
    return "Unknown";
  }

  private extractCodec(name: string): string {
    if (/H\.?265|HEVC|x265/i.test(name)) return "H.265";
    if (/H\.?264|x264/i.test(name)) return "H.264";
    if (/AV1/i.test(name)) return "AV1";
    return "Unknown";
  }

  private extractSource(name: string): string {
    if (/BluRay|BRRip/i.test(name)) return "BluRay";
    if (/WEB-DL|WEBRip/i.test(name)) return "WEB";
    if (/HDTV/i.test(name)) return "HDTV";
    if (/REMUX/i.test(name)) return "REMUX";
    return "Unknown";
  }

  /**
   * Record a user selection to learn from
   */
  public recordSelection(stream: any): void {
    const features = this.extractFeatures(stream);

    // Update quality preferences
    const qualityCount = this.userPrefs.preferredQualities.get(features.quality) || 0;
    this.userPrefs.preferredQualities.set(features.quality, qualityCount + 1);

    // Update tracker preferences
    const trackerCount = this.userPrefs.preferredTrackers.get(features.tracker) || 0;
    this.userPrefs.preferredTrackers.set(features.tracker, trackerCount + 1);

    // Update size preferences (keep last 50)
    if (features.size > 0) {
      this.userPrefs.preferredSizes.push(features.size);
      if (this.userPrefs.preferredSizes.length > 50) {
        this.userPrefs.preferredSizes.shift();
      }
    }

    // Update codec preferences
    if (features.codec !== "Unknown") {
      const codecCount = this.userPrefs.preferredCodecs.get(features.codec) || 0;
      this.userPrefs.preferredCodecs.set(features.codec, codecCount + 1);
    }

    // Update source preferences
    if (features.source !== "Unknown") {
      const sourceCount = this.userPrefs.preferredSources.get(features.source) || 0;
      this.userPrefs.preferredSources.set(features.source, sourceCount + 1);
    }

    this.userPrefs.totalSelections++;
    this.userPrefs.lastUpdated = new Date();
    this.savePreferences();
  }

  /**
   * Calculate ML-enhanced score for a stream
   */
  public calculateMLScore(stream: any, baseScore: number): MLScore {
    const features = this.extractFeatures(stream);

   
    if (this.userPrefs.totalSelections < this.MIN_SAMPLES) {
      return {
        baseScore,
        qualityScore: 0,
        trackerScore: 0,
        sizeScore: 0,
        codecScore: 0,
        sourceScore: 0,
        popularityScore: 0,
        finalScore: baseScore,
        confidence: 0,
      };
    }

    // Calculate quality preference score (0-30 points)
    const qualityCount = this.userPrefs.preferredQualities.get(features.quality) || 0;
    const qualityScore = (qualityCount / this.userPrefs.totalSelections) * 30;

    // Calculate tracker preference score (0-15 points)
    const trackerCount = this.userPrefs.preferredTrackers.get(features.tracker) || 0;
    const trackerScore = (trackerCount / this.userPrefs.totalSelections) * 15;

    // Calculate size preference score (0-10 points)
    let sizeScore = 0;
    if (this.userPrefs.preferredSizes.length > 0 && features.size > 0) {
      const avgSize = this.userPrefs.preferredSizes.reduce((a, b) => a + b, 0) / this.userPrefs.preferredSizes.length;
      const sizeDiff = Math.abs(features.size - avgSize);
      const sizeRatio = sizeDiff / avgSize;
      sizeScore = Math.max(0, 10 - sizeRatio * 5); // Penalty for size deviation
    }

    // Calculate codec preference score (0-8 points)
    const codecCount = this.userPrefs.preferredCodecs.get(features.codec || "") || 0;
    const codecScore = features.codec !== "Unknown" 
      ? (codecCount / this.userPrefs.totalSelections) * 8 
      : 0;

    // Calculate source preference score (0-12 points)
    const sourceCount = this.userPrefs.preferredSources.get(features.source || "") || 0;
    const sourceScore = features.source !== "Unknown"
      ? (sourceCount / this.userPrefs.totalSelections) * 12
      : 0;

    // Calculate popularity score based on seeders (0-15 points)
    const popularityScore = Math.min(15, Math.log10(features.seeds + 1) * 3);

    // Bonus points for premium features
    let bonusScore = 0;
    if (features.hasHDR) bonusScore += 3;
    if (features.hasDolbyVision) bonusScore += 5;
    if (features.hasATMOS) bonusScore += 4;

    const mlBoost = qualityScore + trackerScore + sizeScore + codecScore + sourceScore + popularityScore + bonusScore;
    const finalScore = baseScore + mlBoost;

    // Calculate confidence (0-1) based on number of samples
    const confidence = Math.min(1, this.userPrefs.totalSelections / 50);

    return {
      baseScore,
      qualityScore,
      trackerScore,
      sizeScore,
      codecScore,
      sourceScore,
      popularityScore,
      finalScore,
      confidence,
    };
  }

  /**
   * Get recommendation insights
   */
  public getInsights(): any {
    if (this.userPrefs.totalSelections < this.MIN_SAMPLES) {
      return {
        ready: false,
        message: `Need ${this.MIN_SAMPLES - this.userPrefs.totalSelections} more selections to enable ML recommendations`,
      };
    }

    // Get top preferences
    const topQualities = Array.from(this.userPrefs.preferredQualities.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([quality, count]) => ({ quality, percentage: (count / this.userPrefs.totalSelections * 100).toFixed(1) }));

    const topTrackers = Array.from(this.userPrefs.preferredTrackers.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tracker, count]) => ({ tracker, percentage: (count / this.userPrefs.totalSelections * 100).toFixed(1) }));

    const avgSize = this.userPrefs.preferredSizes.length > 0
      ? (this.userPrefs.preferredSizes.reduce((a, b) => a + b, 0) / this.userPrefs.preferredSizes.length / (1024 ** 3)).toFixed(2)
      : 0;

    return {
      ready: true,
      totalSelections: this.userPrefs.totalSelections,
      lastUpdated: this.userPrefs.lastUpdated,
      topQualities,
      topTrackers,
      averageFileSize: `${avgSize} GB`,
      confidence: Math.min(100, this.userPrefs.totalSelections / 50 * 100),
    };
  }

  /**
   * Reset all learned preferences
   */
  public reset(): void {
    this.userPrefs = {
      preferredQualities: new Map(),
      preferredTrackers: new Map(),
      preferredSizes: [],
      preferredCodecs: new Map(),
      preferredSources: new Map(),
      totalSelections: 0,
      lastUpdated: new Date(),
    };
    this.savePreferences();
  }

  /**
   * Export preferences for backup
   */
  public export(): string {
    return JSON.stringify({
      preferredQualities: Array.from(this.userPrefs.preferredQualities.entries()),
      preferredTrackers: Array.from(this.userPrefs.preferredTrackers.entries()),
      preferredSizes: this.userPrefs.preferredSizes,
      preferredCodecs: Array.from(this.userPrefs.preferredCodecs.entries()),
      preferredSources: Array.from(this.userPrefs.preferredSources.entries()),
      totalSelections: this.userPrefs.totalSelections,
      lastUpdated: this.userPrefs.lastUpdated.toISOString(),
    });
  }

  /**
   * Import preferences from backup
   */
  public import(data: string): boolean {
    try {
      const parsed = JSON.parse(data);
      this.userPrefs = {
        preferredQualities: new Map(parsed.preferredQualities),
        preferredTrackers: new Map(parsed.preferredTrackers),
        preferredSizes: parsed.preferredSizes || [],
        preferredCodecs: new Map(parsed.preferredCodecs || []),
        preferredSources: new Map(parsed.preferredSources || []),
        totalSelections: parsed.totalSelections || 0,
        lastUpdated: new Date(parsed.lastUpdated),
      };
      this.savePreferences();
      return true;
    } catch (error) {
      console.error("Failed to import ML preferences:", error);
      return false;
    }
  }
}

// Global singleton instance
export const mlEngine = new MLRecommendationEngine();

