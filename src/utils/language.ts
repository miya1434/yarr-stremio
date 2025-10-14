const LANGUAGE_MAP: Record<string, string[]> = {
  English: ["eng", "english", "en"],
  Spanish: ["spa", "spanish", "es", "español", "castellano", "latino"],
  French: ["fre", "french", "fr", "français", "vff", "vfq"],
  German: ["ger", "german", "de", "deutsch"],
  Italian: ["ita", "italian", "it"],
  Portuguese: ["por", "portuguese", "pt", "portugues", "br"],
  Russian: ["rus", "russian", "ru"],
  Japanese: ["jpn", "japanese", "jp", "jap"],
  Korean: ["kor", "korean", "kr"],
  Chinese: ["chi", "chinese", "cn", "mandarin"],
  Arabic: ["ara", "arabic", "ar"],
  Hindi: ["hin", "hindi", "hi"],
  Polish: ["pol", "polish", "pl"],
  Hungarian: ["hun", "hungarian", "hu", "magyar"],
};

export const guessLanguage = (name: string, category?: string): string => {
  // Check category first
  if (category?.includes("HU")) return "Hungarian";

  const split = name
    .toLowerCase()
    .replace(/\W/g, " ")
    .replace("x", " ")
    .split(" ");

  // Check for multi-language
  if (split.includes("multi") || split.includes("dual")) return "Multi";

  // Check each language
  for (const [language, keywords] of Object.entries(LANGUAGE_MAP)) {
    if (keywords.some((keyword) => split.includes(keyword))) {
      return language;
    }
  }

  return "English";
};

export const prioritizeByLanguage = <T>(
  items: T[],
  preferredLanguage: string,
  getName: (item: T) => string,
  getCategory?: (item: T) => string | undefined
): T[] => {
  if (!preferredLanguage || preferredLanguage === "None") {
    return items;
  }

  const withLanguage = items.map((item) => ({
    item,
    language: guessLanguage(
      getName(item),
      getCategory ? getCategory(item) : undefined
    ),
  }));

  // Sort: preferred language first, then English, then others
  return withLanguage
    .sort((a, b) => {
      if (a.language === preferredLanguage && b.language !== preferredLanguage)
        return -1;
      if (a.language !== preferredLanguage && b.language === preferredLanguage)
        return 1;
      if (a.language === "English" && b.language !== "English") return -1;
      if (a.language !== "English" && b.language === "English") return 1;
      return 0;
    })
    .map((item) => item.item);
};
