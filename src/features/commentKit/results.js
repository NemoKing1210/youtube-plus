export function paginate(items, pageSize, page = 0) {
  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  const index = Math.min(Math.max(0, page), pages - 1);
  return { items: items.slice(index * pageSize, (index + 1) * pageSize), page: index, pages, total: items.length };
}

export function actionsFor(item, translate) {
  return { copy: Boolean(item.text), permalink: Boolean(item.permalink), author: Boolean(item.authorUrl), translate: Boolean(translate) };
}
