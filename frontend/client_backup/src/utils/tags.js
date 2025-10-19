// parseTags: extract hashtags from text and return unique normalized tags (lowercase, no leading #)
export function parseTags(text = '') {
  if (!text) return [];
  // match words that start with #, allow unicode letters, numbers, underscores and hyphens
  // NOTE: uses unicode flag
  const matches = Array.from(text.matchAll(/#([\p{L}\p{N}_-]+)/giu)).map(m => m[1]);
  const normalized = matches.map(t => t.trim().toLowerCase());
  const seen = new Set();
  const uniq = [];
  for (const t of normalized) {
    if (t && !seen.has(t)) {
      seen.add(t);
      uniq.push(t);
    }
  }
  return uniq;
}