const LEVELS = {
  1080: 'hd1080',
  720: 'hd720',
  480: 'large',
  360: 'medium',
  240: 'small',
};

/** Map a settings preference to a YouTube quality level (`auto` → null). */
export function qualityLevel(preference) {
  return LEVELS[preference] ?? null;
}
