const SERVER_URL = 'http://localhost:3001';

const normalizeWindowsDriveRoot = (value) => {
  const v = String(value || '').trim();
  if (!v) return null;
  if (/^[a-zA-Z]:$/.test(v)) return `${v}\\`;
  if (/^[a-zA-Z]:\\$/.test(v)) return v;
  return null;
};

const buildUiUrl = (pathValue) => {
  const base = chrome.runtime.getURL('index.html');
  if (!pathValue) return base;
  const url = new URL(base);
  url.searchParams.set('path', pathValue);
  url.searchParams.set('source', 'usb');
  return url.toString();
};

const getDriveKey = (driveRoot) => {
  const normalized = normalizeWindowsDriveRoot(driveRoot);
  if (!normalized) return null;
  return normalized[0].toUpperCase();
};

const getDriveKeyFromPath = (pathValue) => {
  const v = String(pathValue || '').trim();
  if (!v) return null;
  const match = v.match(/^([a-zA-Z]):\\/);
  if (!match) return null;
  return match[1].toUpperCase();
};

const getUsbDriveRoots = async () => {
  try {
    const resp = await fetch(`${SERVER_URL}/api/removable-drives`, { cache: 'no-store' });
    if (!resp.ok) return [];
    const data = await resp.json();
    const drives = Array.isArray(data?.drives) ? data.drives : [];
    return drives.map(normalizeWindowsDriveRoot).filter(Boolean);
  } catch {
    return [];
  }
};

const openMainAndUsbTabs = async () => {
  const usbRoots = await getUsbDriveRoots();
  const baseUi = chrome.runtime.getURL('index.html');

  let existingTabs = [];
  try {
    existingTabs = await chrome.tabs.query({});
  } catch {
    existingTabs = [];
  }

  let hasMain = false;
  const existingUsbDriveKeys = new Set();

  for (const tab of existingTabs) {
    if (!tab?.url || !tab.url.startsWith(baseUi)) continue;
    try {
      const u = new URL(tab.url);
      const source = u.searchParams.get('source');
      const p = u.searchParams.get('path');
      if (source === 'usb') {
        const key = getDriveKeyFromPath(p);
        if (key) existingUsbDriveKeys.add(key);
      } else {
        hasMain = true;
      }
    } catch (error) {
      void error;
    }
  }

  if (!hasMain) {
    try {
      await chrome.tabs.create({ url: buildUiUrl(null) });
    } catch (error) {
      void error;
    }
  }

  for (const root of usbRoots) {
    const key = getDriveKey(root);
    if (!key || existingUsbDriveKeys.has(key)) continue;
    try {
      await chrome.tabs.create({ url: buildUiUrl(root) });
    } catch (error) {
      void error;
    }
  }
};

chrome.action.onClicked.addListener(() => {
  openMainAndUsbTabs();
});

chrome.runtime.onStartup.addListener(() => {
  openMainAndUsbTabs();
});

chrome.runtime.onInstalled.addListener(() => {
  openMainAndUsbTabs();
});
