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
const THEME_KEY = 'uiTheme';

function applyI18n() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        element.textContent = browser.i18n.getMessage(element.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-aria-label]').forEach(element => {
        element.setAttribute(
            'aria-label',
            browser.i18n.getMessage(element.getAttribute('data-i18n-aria-label'))
        );
    });
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
}

async function restoreTheme() {
    try {
        const stored = await browser.storage.local.get(THEME_KEY);
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = stored[THEME_KEY] || (prefersDark ? 'dark' : 'light');
        applyTheme(theme);
        return theme;
    } catch (error) {
        console.error('Failed to restore theme:', error);
        applyTheme('light');
        return 'light';
    }
}

function updateThemeButtons(theme) {
    const sunButton = document.getElementById('themeLight');
    const moonButton = document.getElementById('themeDark');
    sunButton.classList.toggle('active', theme === 'light');
    moonButton.classList.toggle('active', theme === 'dark');
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

document.addEventListener('DOMContentLoaded', function() {
    applyI18n();

    const closeButton = document.getElementById('closeAllTabs');
    const optionsButton = document.getElementById('openOptions');
    const licenseButton = document.getElementById('openLicense');
    const lightThemeButton = document.getElementById('themeLight');
    const darkThemeButton = document.getElementById('themeDark');

    restoreTheme().then(updateThemeButtons);

    browser.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== 'local' || !changes[THEME_KEY]) {
            return;
        }
        const newTheme = changes[THEME_KEY].newValue;
        const resolvedTheme = newTheme === 'dark' ? 'dark' : 'light';
        applyTheme(resolvedTheme);
        updateThemeButtons(resolvedTheme);
    });

    lightThemeButton.addEventListener('click', function() {
        setTheme('light');
    });

    darkThemeButton.addEventListener('click', function() {
        setTheme('dark');
    });

    closeButton.addEventListener('click', function() {
        browser.runtime.sendMessage({ action: "closeTabs" }).then(function() {
            window.close();
        });
    });

    optionsButton.addEventListener('click', function() {
        browser.runtime.sendMessage({ action: "openOptionsPage" }).then(function() {
            window.close();
        });
    });

    licenseButton.addEventListener('click', function() {
        browser.runtime.sendMessage({ action: "openLicensePage" }).then(function() {
            window.close();
        });
    });
});
