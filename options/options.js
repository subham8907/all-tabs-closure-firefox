/*
MIT License

Copyright (c) 2024-2026 Subham Mahesh

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
const CLOSE_MODE_KEY = 'closeMode';
const DEFAULT_CLOSE_MODE = 'except_current';
const THEME_KEY = 'uiTheme';
const I18N_STATUS = {
  saved: 'optionsStatusSaved',
  executed: 'optionsStatusExecuted',
  savedExecuted: 'optionsStatusSavedExecuted',
  saveError: 'optionsStatusSaveError',
  executeError: 'optionsStatusExecuteError'
};

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

function getSelectedCloseMode() {
  const checked = document.querySelector('input[name="closeMode"]:checked');
  return checked ? checked.value : DEFAULT_CLOSE_MODE;
}

function setSelectedCloseMode(mode) {
  const selector = `input[name="closeMode"][value="${mode}"]`;
  const input = document.querySelector(selector);
  if (input) {
    input.checked = true;
    return;
  }

  const fallback = document.querySelector(`input[name="closeMode"][value="${DEFAULT_CLOSE_MODE}"]`);
  if (fallback) {
    fallback.checked = true;
  }
}

async function restoreOptions() {
  try {
    const stored = await browser.storage.local.get(CLOSE_MODE_KEY);
    setSelectedCloseMode(stored[CLOSE_MODE_KEY] || DEFAULT_CLOSE_MODE);
  } catch (error) {
    console.error('Failed to restore options:', error);
    setSelectedCloseMode(DEFAULT_CLOSE_MODE);
  }
}

async function saveOptions() {
  const closeMode = getSelectedCloseMode();

  try {
    await browser.storage.local.set({ [CLOSE_MODE_KEY]: closeMode });
    return { ok: true };
  } catch (error) {
    console.error('Failed to save options:', error);
    return { ok: false, error };
  }
}

function showStatus(message, isError = false) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.style.color = isError ? '#c33' : '';
  setTimeout(() => {
    status.textContent = '';
    status.style.color = '';
  }, 1700);
}

async function executeSelectedMode(saveFirst) {
  const closeMode = getSelectedCloseMode();

  if (saveFirst) {
    const saveResult = await saveOptions();
    if (!saveResult.ok) {
      showStatus(t(I18N_STATUS.saveError), true);
      return;
    }
  }

  try {
    await browser.runtime.sendMessage({ action: 'closeTabs', closeMode });
    showStatus(saveFirst ? t(I18N_STATUS.savedExecuted) : t(I18N_STATUS.executed));
  } catch (error) {
    console.error('Failed to execute mode:', error);
    showStatus(t(I18N_STATUS.executeError), true);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  applyI18n();
  restoreTheme();
  restoreOptions();

  browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') {
      return;
    }

    if (changes[THEME_KEY]) {
      const newTheme = changes[THEME_KEY].newValue;
      const resolvedTheme = newTheme === 'dark' ? 'dark' : 'light';
      applyTheme(resolvedTheme);
      updateThemeButtons(resolvedTheme);
    }

    if (changes[CLOSE_MODE_KEY]) {
      setSelectedCloseMode(changes[CLOSE_MODE_KEY].newValue || DEFAULT_CLOSE_MODE);
    }
  });

  document.getElementById('themeLight').addEventListener('click', () => setTheme('light'));
  document.getElementById('themeDark').addEventListener('click', () => setTheme('dark'));
  document.getElementById('openLicenseButton').addEventListener('click', () => {
    browser.runtime.sendMessage({ action: 'openLicensePage' });
  });
  document.getElementById('saveButton').addEventListener('click', async () => {
    const result = await saveOptions();
    showStatus(result.ok ? t(I18N_STATUS.saved) : t(I18N_STATUS.saveError), !result.ok);
  });
  document.getElementById('executeButton').addEventListener('click', () => executeSelectedMode(false));
  document.getElementById('saveExecuteButton').addEventListener('click', () => executeSelectedMode(true));
});
