import { REPO_URL, SCRIPT_NAME, SCRIPT_VERSION } from '../../../core/constants.js';
import { t } from '../../../i18n/index.js';
import { iconNode } from '../../../ui/icons.js';
import { el } from '../../../utils/dom.js';
import { createHint } from '../controls.js';
import { createSection } from '../renderer.js';

/** About tab: identity, version, repository and the non-affiliation note. */
export const aboutTab = {
  id: 'about',
  titleKey: 'about.title',
  icon: 'info',
  render() {
    const root = el('div', 'yp-tab');

    const hero = el('section', 'yp-about');
    const mark = el('div', 'yp-about__mark');
    mark.append(iconNode('settings', 28));
    const text = el('div', 'yp-about__text');
    text.append(
      el('h3', 'yp-about__name', SCRIPT_NAME),
      el('p', 'yp-about__desc', t('about.description')),
      el('span', 'yp-about__version', `v${SCRIPT_VERSION}`),
    );
    hero.append(mark, text);

    const card = createSection(t('about.section.details'));

    const version = el('div', 'yp-row');
    version.append(
      el('span', 'yp-row__label', t('about.version')),
      el('span', 'yp-row__value', `v${SCRIPT_VERSION}`),
    );

    const repo = el('div', 'yp-row');
    const link = el('a', 'yp-link', REPO_URL.replace('https://', ''));
    link.href = REPO_URL;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    repo.append(el('span', 'yp-row__label', t('about.repo')), link);

    const license = el('div', 'yp-row');
    license.append(
      el('span', 'yp-row__label', t('about.license')),
      el('span', 'yp-row__value', 'MIT'),
    );

    card.append(version, repo, license, createHint(t('about.disclaimer')));
    root.append(hero, card);
    return root;
  },
};
