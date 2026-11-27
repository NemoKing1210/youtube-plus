import { on } from '../../core/bus.js';
import { Codes, logError } from '../../core/debug.js';
import { registerFeature } from '../../core/features.js';
import { getValue, setValue } from '../../core/storage.js';
import { t } from '../../i18n/index.js';
import { showToast } from '../../ui/toast.js';
import { createCommentCache } from './cache.js';
import { createCommentPage, resolvePage } from './page.js';
import { createPanelState } from './panel-state.js';
import { commentKitFields, commentKitTab } from './settings.js';
import { createTranscriptCache } from './transcript.js';

const OPEN_KEY = 'yp_comment_panel_open';
const CACHE_KEY = 'yp_comment_cache_v1';

let settings;
let panelState;
let session;
let identity;
let reported = false;
const cache = createCommentCache(() => getValue(CACHE_KEY), (value) => setValue(CACHE_KEY, value));
const transcripts = createTranscriptCache();

function release(persist = false) {
  session?.destroy(persist);
  session = null;
  identity = null;
}

function scan(root = document) {
  if (!settings?.enabled) return;
  try {
    const next = resolvePage(root, location.href);
    if (!next || next.page !== identity?.page || next.id !== identity?.id) {
      release(true);
      if (next) {
        panelState ||= createPanelState(() => getValue(OPEN_KEY, false), (open) => setValue(OPEN_KEY, open));
        session = createCommentPage(next, panelState, cache, transcripts);
        identity = next;
      }
    }
    session?.scan(settings);
    reported = false;
  } catch (error) {
    if (reported) return;
    reported = true;
    logError(Codes.COMMENTKIT_RENDER, 'comment kit render failed', { error });
    showToast(t('commentKit.renderFailed'), { type: 'error' });
  }
}

registerFeature({
  id: 'commentKit',
  order: 40,
  fields: commentKitFields(),
  tabs: [commentKitTab()],
  init() {
    on('settings:general', (next, prev) => {
      if (next.language !== prev?.language) session?.relocalize();
    });
    on('settings:interface', () => scan());
  },
  apply(next) {
    const previous = settings;
    settings = next;
    if (!settings.enabled || previous?.cache !== next.cache) release();
    if (settings.enabled) scan();
  },
  scan,
  navigate() { scan(); },
});
