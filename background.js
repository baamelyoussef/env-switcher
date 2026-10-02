import { getEnvs, findEnv, badgeLabel, onEnvsChanged, textColorFor } from "./envs.js";

const ICONS = (state) => ({
  16: `icons/${state}-16.png`,
  32: `icons/${state}-32.png`,
  48: `icons/${state}-48.png`,
  128: `icons/${state}-128.png`,
});

async function refreshTab(tab, envs) {
  if (!tab || tab.id === undefined || tab.id < 0) return;
  const env = tab.url ? findEnv(envs, tab.url) : null;
  try {
    if (env) {
      await chrome.action.setIcon({ tabId: tab.id, path: ICONS("active") });
      await chrome.action.setBadgeText({ tabId: tab.id, text: badgeLabel(env) });
      await chrome.action.setBadgeBackgroundColor({ tabId: tab.id, color: env.color || "#006dc8" });
      await chrome.action.setBadgeTextColor?.({ tabId: tab.id, color: textColorFor(env.color) });
      await chrome.action.setTitle({ tabId: tab.id, title: `Env Switcher — ${env.name}` });
    } else {
      await chrome.action.setIcon({ tabId: tab.id, path: ICONS("inactive") });
      await chrome.action.setBadgeText({ tabId: tab.id, text: "" });
      await chrome.action.setTitle({ tabId: tab.id, title: "Env Switcher — aucun environnement reconnu" });
    }
  } catch {
    // The tab may have been closed in the meantime.
  }
}

async function refreshAllTabs(envs) {
  envs = envs || (await getEnvs());
  const tabs = await chrome.tabs.query({});
  await Promise.all(tabs.map((tab) => refreshTab(tab, envs)));
}

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url || changeInfo.status) refreshTab(tab, await getEnvs());
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    refreshTab(await chrome.tabs.get(tabId), await getEnvs());
  } catch {}
});

chrome.runtime.onInstalled.addListener(() => refreshAllTabs());
chrome.runtime.onStartup.addListener(() => refreshAllTabs());
onEnvsChanged((envs) => refreshAllTabs(envs));
