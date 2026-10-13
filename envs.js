// Shared helpers: storage of environments and URL switching.

const STORAGE_KEY = "environments";

export const DEFAULT_ENVS = [
  { id: "prod", name: "Production", url: "https://www.exemple.fr", short: "PROD", color: "#d92d20" },
  { id: "preprod", name: "Preprod", url: "https://preprod.exemple.fr", short: "PP", color: "#16a34a" },
];

export function newId() {
  return Math.random().toString(36).slice(2, 10);
}

// Accepts "host", "host:port", "https://host/whatever" and returns a clean origin, or null.
export function normalizeOrigin(input) {
  const value = (input || "").trim();
  if (!value) return null;
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value}`);
    if (!/^https?:$/.test(url.protocol) || !url.hostname) return null;
    return url.origin;
  } catch {
    return null;
  }
}

export async function getEnvs() {
  const data = await chrome.storage.sync.get(STORAGE_KEY);
  return Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : DEFAULT_ENVS;
}

export async function saveEnvs(envs) {
  await chrome.storage.sync.set({ [STORAGE_KEY]: envs });
}

const SETTINGS_KEY = "settings";
export const DEFAULT_SETTINGS = { openInNewTab: false };

export async function getSettings() {
  const data = await chrome.storage.sync.get(SETTINGS_KEY);
  return { ...DEFAULT_SETTINGS, ...data[SETTINGS_KEY] };
}

export async function saveSettings(settings) {
  await chrome.storage.sync.set({ [SETTINGS_KEY]: settings });
}

export function onEnvsChanged(callback) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && changes[STORAGE_KEY]) callback(changes[STORAGE_KEY].newValue || DEFAULT_ENVS);
  });
}

// Environment types: the URL is built from the type, an optional number and the OCP.
//   ap2     -> https://ap2.www.apps.ocp-1.pin.prd.mlb.nbyt.fr
//   dev1    -> https://dev1.www.apps.ocp-1.pin.prd.mlb.nbyt.fr
//   preprod -> https://preprod.www.apps.ocp-3.ocp.euw3r53.nbyt.fr
// "autre" keeps a free URL.
export const ENV_TYPES = {
  ap:      { label: "ap",      number: "required", ocp: 1, domain: "pin.prd.mlb.nbyt.fr" },
  dev:     { label: "dev",     number: "optional", ocp: 1, domain: "pin.prd.mlb.nbyt.fr" },
  preprod: { label: "preprod", number: "none",     ocp: 3, domain: "ocp.euw3r53.nbyt.fr" },
  staging: { label: "staging", number: "none",     ocp: 3, domain: "ocp.euw3r53.nbyt.fr" },
  autre:   { label: "Autre (URL libre)" },
};

// Returns the origin for a typed env, or null if the type is "autre"/unknown or incomplete.
export function buildEnvUrl({ type, num, ocp }) {
  const t = ENV_TYPES[type];
  if (!t || !t.domain) return null;
  const n = t.number === "none" ? "" : String(num ?? "").trim();
  if (t.number === "required" && !n) return null;
  const o = String(ocp ?? "").trim() || t.ocp;
  return `https://${type}${n}.www.apps.ocp-${o}.${t.domain}`;
}

// Reachability check: any HTTP response (even opaque/no-cors) means the server
// is up; a network error (DNS, refused, TLS) or timeout means it is down.
export async function checkStatus(url, timeout = 5000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    await fetch(url, { method: "HEAD", mode: "no-cors", cache: "no-store", credentials: "omit", signal: ctrl.signal });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

// Matches on host (hostname + port), so http/https variants of the same env are recognised.
export function findEnv(envs, pageUrl) {
  let host;
  try {
    host = new URL(pageUrl).host;
  } catch {
    return null;
  }
  return envs.find((env) => {
    try {
      return new URL(env.url).host === host;
    } catch {
      return false;
    }
  }) || null;
}

// Same path, query string and hash, on the target environment.
export function buildTargetUrl(pageUrl, env) {
  const current = new URL(pageUrl);
  const target = new URL(env.url);
  target.pathname = current.pathname;
  target.search = current.search;
  target.hash = current.hash;
  return target.toString();
}

// Picks black or white text, whichever contrasts best with the background (WCAG luminance).
export function textColorFor(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
  if (!m) return "#ffffff";
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(m[1].slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  // Contrast with white: 1.05 / (L + 0.05); with black: (L + 0.05) / 0.05.
  return 1.05 / (luminance + 0.05) >= (luminance + 0.05) / 0.05 ? "#ffffff" : "#111111";
}

export function badgeLabel(env) {
  return (env.short || env.name || "").slice(0, 4);
}
