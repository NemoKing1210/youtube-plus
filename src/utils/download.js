/** Start a local text download from an anchor owned by the caller. */
export function downloadText(anchor, filename, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type: `${type};charset=utf-8` }));
  try {
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
  } finally {
    anchor.removeAttribute('href');
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
