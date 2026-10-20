/**
 * Declarative settings schema.
 *
 * A feature describes its settings once with these field builders; the same
 * description yields the defaults and the normalizer applied on every load /
 * save / import. Unknown keys are dropped and invalid values fall back to the
 * default, so a stored or imported blob can never put the script into an
 * invalid state.
 */

export const field = {
  /** @param {boolean} [def] */
  bool: (def = false) => ({ type: 'bool', default: def }),

  /**
   * @param {readonly string[] | (() => readonly string[])} values
   * @param {string} def
   */
  enum: (values, def) => ({ type: 'enum', values, default: def }),

  /** @param {number} def @param {{min?: number, max?: number}} [range] */
  int: (def, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) => ({
    type: 'int',
    default: def,
    min,
    max,
  }),

  /** Nested object with its own field map. */
  record: (fields) => ({ type: 'record', fields }),
};

function enumValues(spec) {
  return typeof spec.values === 'function' ? spec.values() : spec.values;
}

/** Default value of one field (deep-cloned). */
export function defaultOf(spec) {
  if (spec.type === 'record') return defaultsOf(spec.fields);
  return Array.isArray(spec.default) ? [...spec.default] : spec.default;
}

/** Default values of a field map. */
export function defaultsOf(fields) {
  const out = {};
  for (const [key, spec] of Object.entries(fields)) out[key] = defaultOf(spec);
  return out;
}

/** Normalize one raw value against its field spec. */
export function normalizeField(spec, raw) {
  switch (spec.type) {
    case 'bool':
      return typeof raw === 'boolean' ? raw : spec.default;
    case 'enum':
      return enumValues(spec).includes(raw) ? raw : spec.default;
    case 'int': {
      const value = Math.round(Number(raw));
      return Number.isFinite(value)
        ? Math.min(spec.max, Math.max(spec.min, value))
        : spec.default;
    }
    case 'record':
      return normalizeFields(spec.fields, raw);
    default:
      return raw;
  }
}

/** Normalize a raw object against a field map (unknown keys are dropped). */
export function normalizeFields(fields, raw) {
  const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const out = {};
  for (const [key, spec] of Object.entries(fields)) {
    out[key] = normalizeField(spec, source[key]);
  }
  return out;
}

/** Read a dotted path (`someNested.value`) from an object. */
export function getPath(object, path) {
  let current = object;
  for (const part of String(path).split('.')) {
    if (current == null) return undefined;
    current = current[part];
  }
  return current;
}

/** Write a dotted path, creating intermediate objects when missing. */
export function setPath(object, path, value) {
  const parts = String(path).split('.');
  let current = object;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const part = parts[i];
    if (current[part] == null || typeof current[part] !== 'object') current[part] = {};
    current = current[part];
  }
  current[parts[parts.length - 1]] = value;
  return object;
}
