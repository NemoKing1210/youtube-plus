const LEVELS = {
  4320: 'highres',
  2160: 'hd2160',
  1440: 'hd1440',
  1080: 'hd1080',
  720: 'hd720',
  480: 'large',
  360: 'medium',
  240: 'small',
  144: 'tiny',
};

/** Map a settings preference to a YouTube quality level (`auto` → null). */
export function qualityLevel(preference) {
  return LEVELS[preference] ?? null;
}
