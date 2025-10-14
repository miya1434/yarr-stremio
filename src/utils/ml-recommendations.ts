/**
 * ML-based recommendation system for YARR!
 * 
 * WORK IN PROGRESS STILL I AM WORKING ON IT!!
 * 
 */

export interface UserPreferences {
  preferredQuality?: string[];
  preferredTrackers?: string[];
  averageFileSize?: number;
  watchHistory?: string[];
}

export interface StreamScore {
  baseScore: number;
  mlScore?: number;
  finalScore: number;
}

/**
 * Calculate ML-enhanced score for a stream
 * Currently uses simple heuristics will be changed in future
 */
export const calculateMLScore = (
  stream: any,
  userPreferences?: UserPreferences
): StreamScore => {
  const baseScore = stream.score || 0;

  // If no user preferences, return base score
  if (!userPreferences) {
    return {
      baseScore,
      finalScore: baseScore,
    };
  }

  let mlBoost = 0;

  // Boost for preferred quality
  if (userPreferences.preferredQuality?.includes(stream.quality)) {
    mlBoost += 10;
  }

  // Boost for preferred trackers
  if (userPreferences.preferredTrackers?.includes(stream.torrentTracker)) {
    mlBoost += 5;
  }

  // Penalize if file size is far from user's average preference
  if (userPreferences.averageFileSize && stream.fileSize) {
    const sizeDiff = Math.abs(stream.fileSize - userPreferences.averageFileSize);
    const sizeRatio = sizeDiff / userPreferences.averageFileSize;
    if (sizeRatio > 2) {
      mlBoost -= 5; 
    }
  }

  const mlScore = baseScore + mlBoost;

  return {
    baseScore,
    mlScore: mlBoost,
    finalScore: mlScore,
  };
};

/**
 * Track user interaction (for future ML training)
 */
export const trackStreamSelection = (
  streamId: string,
  quality: string,
  tracker: string,
  fileSize: number
): void => {
  //NEED TO ADD PERSISTENT STORAGE FOR THIS IN FUTURE
  console.log(`Stream selected: ${streamId} (${quality}, ${tracker})`);
};

/**
 * Build user preferences from history
 */
export const buildUserPreferences = (
  history: any[]
): UserPreferences => {
  if (!history || history.length === 0) {
    return {};
  }

  // Count quality preferences
  const qualityCounts: Record<string, number> = {};
  const trackerCounts: Record<string, number> = {};
  let totalSize = 0;

  for (const item of history) {
    qualityCounts[item.quality] = (qualityCounts[item.quality] || 0) + 1;
    trackerCounts[item.tracker] = (trackerCounts[item.tracker] || 0) + 1;
    totalSize += item.fileSize || 0;
  }

  // Get top preferences
  const preferredQuality = Object.entries(qualityCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([quality]) => quality);

  const preferredTrackers = Object.entries(trackerCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([tracker]) => tracker);

  const averageFileSize = totalSize / history.length;

  return {
    preferredQuality,
    preferredTrackers,
    averageFileSize,
    watchHistory: history.map((item) => item.id),
  };
};


export const loadMLModel = async (): Promise<any> => {

  console.log("ML model loading not yet implemented");
  return null;
};

