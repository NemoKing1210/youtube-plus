import { Codes, logError } from '../../core/debug.js';
import { registerFeature } from '../../core/features.js';
import { t } from '../../i18n/index.js';
import { showToast } from '../../ui/toast.js';
import { createShortsEngine } from './engine.js';
import { shortsFields, shortsTab } from './settings.js';

const { applyShortsSettings, shortsScan, shortsNavigate } = createShortsEngine((error, advancing) => {
  logError(Codes.SHORTS_APPLY, 'Shorts auto-scroll failed', { error });
  if (advancing) showToast(t('shorts.error'), { type: 'error' });
});

registerFeature({
  id: 'shorts',
  order: 35,
  fields: shortsFields(),
  tabs: [shortsTab()],
  apply: applyShortsSettings,
  scan: shortsScan,
  navigate: shortsNavigate,
});
