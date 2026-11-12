import { REPO_URL, SCRIPT_NAME, SCRIPT_VERSION } from '../../../core/constants.js';
import { t } from '../../../i18n/index.js';
import { el } from '../../../utils/dom.js';

/** About tab: identity, version, repository and the non-affiliation note. */
export const aboutTab = {
  id: 'about',
  titleKey: 'about.title',
  icon: 'info',
  render() {
    const root = el('div', 'yp-tab');
    const section = el('section', 'yp-section');

    section.append(
      el('h3', 'yp-section__title', SCRIPT_NAME),
      el('p', 'yp-section__desc', t('about.description')),
    );

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

    section.append(version, repo, license, el('p', 'yp-hint', t('about.disclaimer')));
    root.append(section);
    return root;
  },
};
