import { parseTimestamp } from './parse.js';

const TRANSCRIPT = 'ytd-transcript-renderer, ytd-transcript-search-panel-renderer';
const SEGMENT = 'ytd-transcript-segment-renderer, transcript-segment-view-model';
const START = '.segment-timestamp, #segment-timestamp, [class*="transcript-segment-view-model__timestamp"]';
const LINE = '.segment-text, #segment-text, [class*="transcript-segment-view-model__text"]';
const LANGUAGE = 'select, yt-dropdown-menu [aria-selected="true"], ytd-menu-popup-renderer [aria-selected="true"], #footer yt-dropdown-menu';
const OPEN = 'ytd-video-description-transcript-section-renderer button, #show-transcript-button button';

export function normalizeSegment(start, text, order) {
  const seconds = parseTimestamp(start);
  const line = typeof text === 'string' ? text.trim() : '';
  return seconds === null || !line ? null : { start: seconds, text: line, order };
}

export function transcriptRoot(page) {
  return page.querySelector(TRANSCRIPT);
}

export function readTranscript(root) {
  const value = root.querySelector(LANGUAGE);
  const language = value?.value || value?.textContent.trim() || '';
  const segments = Array.from(root.querySelectorAll(SEGMENT), (node, order) =>
    normalizeSegment(node.querySelector(START)?.textContent, node.querySelector(LINE)?.textContent, order))
    .filter(Boolean);
  return { language, segments };
}

export function nativeTranscriptButton(page) {
  return page.querySelector(OPEN);
}

export function createTranscriptCache() {
  const videos = new Map();
  return {
    get(videoId, language) { return videos.get(videoId)?.get(language) || null; },
    put(videoId, language, segments) {
      if (!videos.has(videoId)) {
        videos.set(videoId, new Map());
        if (videos.size > 10) videos.delete(videos.keys().next().value);
      }
      videos.get(videoId).set(language, segments);
    },
  };
}
