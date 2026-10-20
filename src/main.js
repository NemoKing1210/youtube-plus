import { ROOT_ATTR } from './core/constants.js';
import { whenReady } from './utils/dom.js';

function boot() {
  const root = document.documentElement;
  if (root.hasAttribute(ROOT_ATTR)) return;
  root.setAttribute(ROOT_ATTR, '1');
}

whenReady(boot);
