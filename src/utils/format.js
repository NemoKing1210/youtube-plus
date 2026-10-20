/** Replace `{name}` tokens with values from `vars`. */
export function fmt(template, vars = {}) {
  return String(template).replace(/\{(\w+)\}/g, (match, name) =>
    Object.hasOwn(vars, name) ? String(vars[name]) : match,
  );
}
