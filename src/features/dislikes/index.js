import { on } from '../../core/bus.js';
import { Codes, logWarn } from '../../core/debug.js';
import { registerFeature } from '../../core/features.js';
import { gmRequest } from '../../core/http.js';
import { createVoteFetcher } from './api.js';
import { createDislikesEngine } from './engine.js';
import { dislikesFields, dislikesTab } from './settings.js';

const { apply, scan, navigate } = createDislikesEngine({
  fetchVotes: createVoteFetcher(gmRequest),
  onFailure: (error) => logWarn(Codes.DISLIKES_API, 'unable to load vote counts', {
    status: error?.status,
    message: error?.message,
  }),
  onRenderFailure: (error) => logWarn(Codes.DISLIKES_RENDER, 'unable to render vote counts', { error }),
});

registerFeature({
  id: 'dislikes',
  order: 28,
  fields: dislikesFields(),
  tabs: [dislikesTab()],
  init() {
    on('settings:general', scan);
  },
  apply,
  scan,
  navigate,
});
