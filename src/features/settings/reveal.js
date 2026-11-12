const timers = new WeakMap();

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Show or hide a settings row/card with a short fade and rise. Rapid toggles
 * cancel the previous timer, so a node can never get stuck mid-transition.
 */
export function setRevealed(node, visible, { duration = 180 } = {}) {
  if (!node) return;

  const pending = timers.get(node);
  if (pending) clearTimeout(pending);
  timers.delete(node);

  if (prefersReducedMotion()) {
    node.hidden = !visible;
    node.classList.remove('is-revealing', 'is-hiding');
    return;
  }

  if (visible) {
    node.hidden = false;
    node.classList.remove('is-hiding');
    node.classList.add('is-revealing');
    timers.set(
      node,
      setTimeout(() => {
        node.classList.remove('is-revealing');
        timers.delete(node);
      }, duration),
    );
    return;
  }

  if (node.hidden) {
    node.classList.remove('is-revealing', 'is-hiding');
    return;
  }

  node.classList.remove('is-revealing');
  node.classList.add('is-hiding');
  timers.set(
    node,
    setTimeout(() => {
      node.hidden = true;
      node.classList.remove('is-hiding');
      timers.delete(node);
    }, duration),
  );
}
