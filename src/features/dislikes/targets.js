const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const SHORTS_PATH = /^\/shorts\/([A-Za-z0-9_-]{11})\/?$/;

export function visibleChild(scope, selector) {
  return scope && [...scope.querySelectorAll(selector)].find((node) => !node.closest('[hidden]'));
}

function validId(value) {
  return typeof value === 'string' && VIDEO_ID.test(value) ? value : null;
}

/** YouTube may update the URL, player, and watch metadata in separate steps. */
export function watchVideoId(url, playerId, metadataId) {
  if (url.pathname !== '/watch') return null;
  const urlId = url.searchParams.get('v');
  const fromUrl = validId(urlId);
  if (urlId !== null && !fromUrl) return null;
  const fromPlayer = validId(playerId);
  const fromMetadata = validId(metadataId);
  const id = fromPlayer ?? fromUrl;
  if (fromUrl && id !== fromUrl) return null;
  if (fromMetadata && id !== fromMetadata) return null;
  return id;
}

export function shortsVideoId(url, reelLink, reelId) {
  const urlId = SHORTS_PATH.exec(url.pathname)?.[1];
  if (!urlId) return null;
  const loadedId = validId(reelId);
  if (reelLink) {
    try {
      const link = new URL(reelLink, url);
      const linkedId = link.origin === url.origin && SHORTS_PATH.exec(link.pathname)?.[1];
      if (linkedId) return loadedId && loadedId !== linkedId ? null : linkedId;
    } catch {
      // Fall back to the current Shorts URL if the reel link is incomplete.
    }
  }
  return loadedId ?? urlId;
}

export function countPlacement(native, shortsBar) {
  if (native) return { host: native, readOnly: false };
  return shortsBar ? { host: shortsBar, readOnly: true } : null;
}
