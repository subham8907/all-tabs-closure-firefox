const THEME_KEY = 'uiTheme';
function t(key) {
  return browser.i18n.getMessage(key) || key;
}

function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(element => {
    element.textContent = t(element.getAttribute('data-i18n'));
  });
  document.querySelectorAll('[data-i18n-aria-label]').forEach(element => {
    element.setAttribute('aria-label', t(element.getAttribute('data-i18n-aria-label')));
  });
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
}

function updateThemeButtons(theme) {
  const sunButton = document.getElementById('themeLight');
  const moonButton = document.getElementById('themeDark');
  sunButton.classList.toggle('active', theme === 'light');
  moonButton.classList.toggle('active', theme === 'dark');
}

async function restoreTheme() {
  try {
    const stored = await browser.storage.local.get(THEME_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = stored[THEME_KEY] || (prefersDark ? 'dark' : 'light');
    applyTheme(theme);
    updateThemeButtons(theme);
  } catch (error) {
    console.error('Failed to restore theme:', error);
    applyTheme('light');
    updateThemeButtons('light');
  }
}

async function setTheme(theme) {
  applyTheme(theme);
  updateThemeButtons(theme);
  try {
    await browser.storage.local.set({ [THEME_KEY]: theme });
  } catch (error) {
    console.error('Failed to persist theme:', error);
  }
}

async function loadText(path, targetId) {
  const target = document.getElementById(targetId);
  try {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to load ${path}: ${response.status}`);
    }
    target.textContent = await response.text();
  } catch (error) {
    console.error(error);
    target.textContent = t('licenseLoadError');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  applyI18n();
  restoreTheme();
  loadText('../LICENSE', 'projectLicense');
  loadText('../THIRD_PARTY_LICENSES.md', 'thirdPartyLicenses');

  browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local' || !changes[THEME_KEY]) {
      return;
    }
    const newTheme = changes[THEME_KEY].newValue;
    const resolvedTheme = newTheme === 'dark' ? 'dark' : 'light';
    applyTheme(resolvedTheme);
    updateThemeButtons(resolvedTheme);
  });

  document.getElementById('themeLight').addEventListener('click', () => setTheme('light'));
  document.getElementById('themeDark').addEventListener('click', () => setTheme('dark'));
});
