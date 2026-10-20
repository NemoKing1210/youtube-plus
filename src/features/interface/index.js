import { on } from '../../core/bus.js';
import { registerFeature } from '../../core/features.js';
import { applyInterface, previewRule, runFind } from './engine.js';
import { interfaceFields, interfaceTab } from './settings.js';

/**
 * Interface clean-up: declarative rules rendered as switches, applied as one
 * generated stylesheet. Previewing a rule (hover in settings) temporarily
 * un-hides its targets and outlines them.
 */
registerFeature({
  id: 'interface',
  order: 20,
  fields: interfaceFields(),
  tabs: [interfaceTab()],

  init() {
    on('interface:preview', previewRule);
  },

  apply(cfg) {
    applyInterface(cfg);
  },

  scan(root) {
    runFind(root);
  },

  navigate() {
    runFind(document);
  },
});
