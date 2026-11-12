const bound = new WeakSet();

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Attach a Material-style pointer ripple to a button-like node. Binding is
 * idempotent; the ripple span is removed when its animation ends.
 */
export function attachRipple(node) {
  if (!node || bound.has(node)) return;
  bound.add(node);

  node.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || prefersReducedMotion()) return;
    const rect = node.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2 || 48;
    const ripple = document.createElement('span');
    ripple.className = 'yp-ripple';
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
    ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
    node.append(ripple);
  });
}
