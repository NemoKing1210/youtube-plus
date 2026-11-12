import { registerFeature } from '../../core/features.js';
import { applyLayout, layoutNavigate, layoutScan } from './engine.js';
import { layoutFields, layoutTab } from './settings.js';

/**
 * Layout: configurable rich-grid column count and compact card options,
 * rendered as one generated stylesheet alongside the interface clean-up.
 */
registerFeature({
  id: 'layout',
  order: 25,
  fields: layoutFields(),
  tabs: [layoutTab()],
  apply: applyLayout,
  scan: layoutScan,
  navigate: layoutNavigate,
});
