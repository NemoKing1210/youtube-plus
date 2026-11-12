import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';
import pkg from './package.json' with { type: 'json' };

const RAW_BASE = 'https://raw.githubusercontent.com/NemoKing1210/youtube-plus/main';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: 'terser',
    terserOptions: {
      compress: { passes: 2, pure_getters: true },
      mangle: true,
      format: { comments: false },
    },
    cssMinify: true,
    target: 'es2020',
    reportCompressedSize: true,
  },
  esbuild: {
    legalComments: 'none',
  },
  plugins: [
    monkey({
      entry: 'src/main.js',
      userscript: {
        name: 'YouTube Plus',
        namespace: 'https://github.com/NemoKing1210/youtube-plus',
        version: pkg.version,
        description: {
          '': 'Interface clean-up, layout controls and player improvements for YouTube',
          ru: 'Чистка интерфейса, настройка сетки и улучшения плеера для YouTube',
          'zh-CN': 'YouTube 界面清理、布局调整与播放器增强',
          es: 'Limpieza de interfaz, ajustes de diseño y mejoras del reproductor para YouTube',
          'pt-BR': 'Limpeza da interface, ajustes de layout e melhorias do player para o YouTube',
          de: 'Aufgeräumte Oberfläche, Layout-Einstellungen und Player-Verbesserungen für YouTube',
          fr: 'Nettoyage de l’interface, réglages de mise en page et améliorations du lecteur pour YouTube',
          ja: 'YouTube の画面整理、レイアウト調整、プレーヤー改善',
        },
        author: 'NemoKing1210',
        tag: ['youtube', 'userscript', 'cleanup', 'player'],
        homepageURL: 'https://github.com/NemoKing1210/youtube-plus',
        supportURL: 'https://github.com/NemoKing1210/youtube-plus/issues',
        updateURL: `${RAW_BASE}/youtube-plus.user.js`,
        downloadURL: `${RAW_BASE}/youtube-plus.user.js`,
        license: 'MIT',
        icon: 'https://www.youtube.com/favicon.ico',
        match: ['https://www.youtube.com/*', 'https://youtube.com/*'],
        grant: ['GM_getValue', 'GM_setValue', 'GM_registerMenuCommand'],
        'run-at': 'document-start',
        noframes: true,
      },
      server: {
        prefix: 'dev:',
      },
      build: {
        fileName: 'youtube-plus.user.js',
        metaFileName: true,
        // The default injector references GM_addStyle, which would add a
        // fourth grant; build the style node instead. This function is
        // stringified into the bundle, so it must stay self-contained. A
        // manager can inject before <html> exists: defer the append to
        // DOMContentLoaded instead of dereferencing a null root.
        cssSideEffects: () => (css) => {
          const style = document.createElement('style');
          style.setAttribute('data-yp-ui', '');
          style.textContent = css;
          const root = document.head || document.documentElement;
          if (root) {
            root.append(style);
            return;
          }
          document.addEventListener('DOMContentLoaded', () => {
            (document.head || document.documentElement).append(style);
          }, { once: true });
        },
      },
    }),
  ],
});
