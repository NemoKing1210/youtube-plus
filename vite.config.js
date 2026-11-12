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
          '': 'Interface clean-up and player improvements for YouTube',
          ru: 'Чистка интерфейса и улучшения плеера для YouTube',
          'zh-CN': '为 YouTube 提供界面清理和播放器增强',
          es: 'Limpieza de interfaz y mejoras del reproductor para YouTube',
          'pt-BR': 'Limpeza da interface e melhorias do player para o YouTube',
          de: 'Aufgeräumte Oberfläche und Player-Verbesserungen für YouTube',
          fr: 'Nettoyage de l’interface et améliorations du lecteur pour YouTube',
          ja: 'YouTube の画面整理とプレーヤー改善',
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
        // fourth grant; build the style node instead.
        cssSideEffects: () => (css) => {
          const style = document.createElement('style');
          style.setAttribute('data-yp-ui', '');
          style.textContent = css;
          (document.head || document.documentElement).append(style);
        },
      },
    }),
  ],
});
