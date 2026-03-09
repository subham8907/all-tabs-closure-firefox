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
const CLOSE_MODE_KEY = "closeMode";
const CLOSE_MODES = {
  OPEN_NEW_AFTER_CLOSE_EXCEPT_PINNED: "open_new_after_close_except_pinned",
  CLOSE_ALL_INCLUDING_BROWSER: "close_all_including_browser",
  CLOSE_ALL_KEEP_BROWSER: "close_all_including_pinned_keep_browser",
  EXCEPT_CURRENT_AND_PINNED: "except_current_and_pinned",
  EXCEPT_CURRENT: "except_current",
  CLOSE_IN_OTHER_WINDOWS: "close_tabs_in_other_windows",
  EXCEPT_CURRENT_PINNED_GROUPED: "except_current_pinned_grouped",
  CLOSE_OTHERS_CURRENT_KEEP_ACTIVE_PINNED_GROUPED: "close_others_current_keep_active_pinned_grouped"
};
const DEFAULT_CLOSE_MODE = CLOSE_MODES.EXCEPT_CURRENT;

function isGroupedTab(tab) {
  return typeof tab.groupId === "number" && tab.groupId >= 0;
}

async function getCloseMode() {
  const stored = await browser.storage.local.get(CLOSE_MODE_KEY);
  const selectedMode = stored[CLOSE_MODE_KEY];
  const validModes = new Set(Object.values(CLOSE_MODES));
  return validModes.has(selectedMode) ? selectedMode : DEFAULT_CLOSE_MODE;
}

async function getContext() {
  const [activeTab] = await browser.tabs.query({ active: true, currentWindow: true });
  const allTabs = await browser.tabs.query({});
  const currentWindowId = activeTab ? activeTab.windowId : (allTabs[0] ? allTabs[0].windowId : undefined);
  return { activeTab, allTabs, currentWindowId };
}

async function removeTabs(tabs) {
  const tabIds = tabs.map(tab => tab.id).filter(id => typeof id === "number");
  if (tabIds.length > 0) {
    await browser.tabs.remove(tabIds);
  }
}

async function closeAllTabsIncludingPinnedKeepBrowser(currentWindowId) {
  const createdTab = currentWindowId
    ? await browser.tabs.create({ windowId: currentWindowId })
    : await browser.tabs.create({});
  const allTabs = await browser.tabs.query({});
  await removeTabs(allTabs.filter(tab => tab.id !== createdTab.id));
}

async function closeAllTabsByMode(overrideMode) {
  const validModes = new Set(Object.values(CLOSE_MODES));
  const closeMode = validModes.has(overrideMode) ? overrideMode : await getCloseMode();
  const { activeTab, allTabs, currentWindowId } = await getContext();
  const tabsInCurrentWindow = typeof currentWindowId === "number"
    ? allTabs.filter(tab => tab.windowId === currentWindowId)
    : [];

  switch (closeMode) {
    case CLOSE_MODES.OPEN_NEW_AFTER_CLOSE_EXCEPT_PINNED: {
      const createdTab = currentWindowId
        ? await browser.tabs.create({ windowId: currentWindowId })
        : await browser.tabs.create({});
      await removeTabs(
        tabsInCurrentWindow.filter(tab => !tab.pinned && tab.id !== createdTab.id)
      );
      break;
    }
    case CLOSE_MODES.CLOSE_ALL_INCLUDING_BROWSER: {
      const windows = await browser.windows.getAll({ windowTypes: ["normal"] });
      for (const windowInfo of windows) {
        try {
          await browser.windows.remove(windowInfo.id);
        } catch (error) {
          console.error("Failed closing window:", windowInfo.id, error);
        }
      }
      break;
    }
    case CLOSE_MODES.CLOSE_ALL_KEEP_BROWSER: {
      await closeAllTabsIncludingPinnedKeepBrowser(currentWindowId);
      break;
    }
    case CLOSE_MODES.EXCEPT_CURRENT_AND_PINNED: {
      await removeTabs(
        tabsInCurrentWindow.filter(tab => !(activeTab && tab.id === activeTab.id) && !tab.pinned)
      );
      break;
    }
    case CLOSE_MODES.EXCEPT_CURRENT: {
      await removeTabs(
        tabsInCurrentWindow.filter(tab => !(activeTab && tab.id === activeTab.id))
      );
      break;
    }
    case CLOSE_MODES.CLOSE_IN_OTHER_WINDOWS: {
      await removeTabs(
        allTabs.filter(tab => typeof currentWindowId === "number" && tab.windowId !== currentWindowId)
      );
      break;
    }
    case CLOSE_MODES.EXCEPT_CURRENT_PINNED_GROUPED: {
      await removeTabs(
        allTabs.filter(tab => {
          if (activeTab && tab.id === activeTab.id) {
            return false;
          }
          if (tab.pinned || isGroupedTab(tab)) {
            return false;
          }
          return true;
        })
      );
      break;
    }
    case CLOSE_MODES.CLOSE_OTHERS_CURRENT_KEEP_ACTIVE_PINNED_GROUPED: {
      const currentWindowTabsToClose = tabsInCurrentWindow.filter(tab => {
        if (activeTab && tab.id === activeTab.id) {
          return false;
        }
        if (tab.pinned || isGroupedTab(tab)) {
          return false;
        }
        return true;
      });
      const otherWindowsTabsToClose = allTabs.filter(
        tab => typeof currentWindowId === "number" && tab.windowId !== currentWindowId
      );
      await removeTabs([...currentWindowTabsToClose, ...otherWindowsTabsToClose]);
      break;
    }
    default: {
      await removeTabs(
        tabsInCurrentWindow.filter(tab => !(activeTab && tab.id === activeTab.id))
      );
      break;
    }
  }

  console.log("Executed close mode:", closeMode);
}

browser.runtime.onMessage.addListener(async function(request) {
  if (request.action === "closeTabs") {
    try {
      await closeAllTabsByMode(request.closeMode);
      return { status: "Closing tabs completed" };
    } catch (error) {
      console.error("Error in closeAllTabs:", error);
      return { status: "Error", message: String(error) };
    }
  }

  if (request.action === "openOptionsPage") {
    await browser.runtime.openOptionsPage();
    return { status: "Opened options page" };
  }

  if (request.action === "openLicensePage") {
    await browser.tabs.create({ url: browser.runtime.getURL("options/license.html") });
    return { status: "Opened license page" };
  }

  return { status: "Unknown action" };
});

console.log('Background script loaded');
