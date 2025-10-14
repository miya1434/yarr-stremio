/**
 * Reusable sort functions for streams
 */

export function getSortFunction(sortMode: string): (a: any, b: any) => number {
  switch (sortMode) {
    case "Seeders":
      return (a, b) => (b.torrentSeeds || 0) - (a.torrentSeeds || 0);

    case "Size":
      return (a, b) => (b.fileSize || 0) - (a.fileSize || 0);

    case "Quality":
      return (a, b) => b.score - a.score;

    case "Quality then Size":
      return (a, b) => {
        if (a.score !== b.score) return b.score - a.score;
        return (b.fileSize || 0) - (a.fileSize || 0);
      };

    case "Quality then Seeders":
    default:
      return (a, b) => {
        if (a.score !== b.score) return b.score - a.score;
        return (b.torrentSeeds || 0) - (a.torrentSeeds || 0);
      };
  }
}

