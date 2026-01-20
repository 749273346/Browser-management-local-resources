const { app, BrowserWindow, Tray, Menu, shell, nativeImage, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

let mainWindow;
let tray;
const settingsPath = path.join(__dirname, 'settings.json');

app.setAppUserModelId('com.qc.localresourcemanager');

try {
  const userDataPath = path.join(app.getPath('appData'), 'LocalResourceManager', 'electron');
  app.setPath('userData', userDataPath);
} catch (err) {
  try {
    logger.warn('Failed to set userData', err);
  } catch {}
}

try {
  logger.info('Main starting', { cwd: process.cwd(), userData: app.getPath('userData') });
} catch {}

let gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  try {
    const userData = app.getPath('userData');
    const lockFiles = ['SingletonLock', 'SingletonCookie', 'SingletonSocket'];
    for (const f of lockFiles) {
      try {
        fs.unlinkSync(path.join(userData, f));
      } catch {}
    }
  } catch {}
  gotTheLock = app.requestSingleInstanceLock();
}

if (!gotTheLock) {
  try {
    logger.warn('Single instance lock failed; quitting');
  } catch {}
  app.exit(202);
  return;
}

function requestExit(code) {
  try {
    logger.warn('App exit requested', { code });
  } catch {}
  try {
    app.isQuiting = true;
  } catch {}
  try {
    app.exit(code);
  } catch {
    try {
      app.quit();
    } catch {}
  }
}

function requestRestart(reason) {
  try {
    logger.warn('App restart requested', { reason });
  } catch {}
  requestExit(102);
}

ipcMain.on('hide-window', () => {
  if (mainWindow) mainWindow.hide();
});

ipcMain.on('restart-app', () => {
  requestRestart('ipc');
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 600,
    show: false,
    frame: true,
    autoHideMenuBar: true,
    title: '浏览器资源管理 - 服务控制台',
    icon: getIconPath(),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Explicitly remove menu bar to ensure it's hidden
  mainWindow.setMenu(null);

  mainWindow.loadFile(path.join(__dirname, 'public/dashboard.html'));

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    }
    return false;
  });
}

function showMainWindow() {
  try {
    if (!mainWindow) {
      createWindow();
    }
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  } catch (err) {
    try {
      logger.error('Failed to show main window', err);
    } catch {}
  }
}

function getIconPath() {
  const possiblePaths = [
    path.join(__dirname, 'assets/icon16.png'),
    path.join(__dirname, 'assets/icon.png'),
    path.join(__dirname, '../extension/public/icon.svg'),
    path.join(__dirname, '../extension/public/icon.png'),
    path.join(__dirname, '../extension/dist/icon.png')
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      logger.info('Found icon at:', p);
      return p;
    }
  }
  logger.warn('Icon not found in any of the paths:', possiblePaths);
  return null;
}

function readSettingsSafe() {
  try {
    if (!fs.existsSync(settingsPath)) return {};
    const raw = fs.readFileSync(settingsPath, 'utf8');
    return JSON.parse(raw || '{}') || {};
  } catch (e) {
    try {
      logger.warn('Failed to read settings', e);
    } catch {}
    return {};
  }
}

function writeSettingsSafe(settings) {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings || {}, null, 2), 'utf8');
    return true;
  } catch (e) {
    try {
      logger.warn('Failed to write settings', e);
    } catch {}
    return false;
  }
}

function getAutoStartEffective() {
  try {
    const state = app.getLoginItemSettings();
    return !!state.openAtLogin;
  } catch {
    return false;
  }
}

function setAutoStartEnabled(enabled) {
  const nextEnabled = !!enabled;
  let ok = true;
  try {
    app.setLoginItemSettings({ openAtLogin: nextEnabled });
  } catch (e) {
    ok = false;
    try {
      logger.warn('Failed to set login item settings', e);
    } catch {}
  }
  const current = readSettingsSafe();
  current.autoStart = nextEnabled;
  writeSettingsSafe(current);
  return ok;
}

function buildTrayMenu(autoStartEnabled) {
  return Menu.buildFromTemplate([
    { 
      label: '打开控制台', 
      click: () => {
        showMainWindow();
      } 
    },
    { type: 'separator' },
    {
      label: '开机自启（静默托盘运行）',
      type: 'checkbox',
      checked: !!autoStartEnabled,
      click: (menuItem) => {
        const desired = !!menuItem.checked;
        const ok = setAutoStartEnabled(desired);
        const effective = getAutoStartEffective();
        try {
          if (tray) tray.setContextMenu(buildTrayMenu(effective));
        } catch {}
        if (!ok) {
          try {
            logger.warn('AutoStart update failed', { desired, effective });
          } catch {}
        }
      }
    },
    { type: 'separator' },
    { 
      label: '重启服务', 
      click: () => {
        requestRestart('tray');
      } 
    },
    { 
      label: '退出', 
      click: () => {
        requestExit(100);
      } 
    }
  ]);
}

function createTray(autoStartEnabled) {
  const iconPath = getIconPath();
  let trayImage;
  
  try {
    if (iconPath) {
      logger.info('Loading icon from:', iconPath);
      // Read file and convert to data URL to avoid path encoding issues
      const buffer = fs.readFileSync(iconPath);
      const base64Icon = buffer.toString('base64');
      const dataUrl = `data:image/png;base64,${base64Icon}`;
      const icon = nativeImage.createFromDataURL(dataUrl);
      
      if (icon.isEmpty()) {
         logger.warn('Icon is empty after loading from Data URL');
         trayImage = nativeImage.createEmpty();
      } else {
         // Resize to 16x16 for best tray appearance on Windows
         trayImage = icon.resize({ width: 16, height: 16 });
      }
    } else {
      logger.warn('No icon path found, creating empty Tray');
      trayImage = nativeImage.createEmpty();
    }
  } catch (err) {
    logger.error('Error creating Tray icon:', err);
    trayImage = nativeImage.createEmpty();
  }

  tray = new Tray(trayImage);
  tray.setToolTip('浏览器资源管理服务');
  tray.setContextMenu(buildTrayMenu(autoStartEnabled));

  tray.on('double-click', () => {
    showMainWindow();
  });
}

function startServer() {
  try {
    logger.info('Starting Express Server...');
    const serverModule = require('./index.js');
    if (serverModule && typeof serverModule.start === 'function') {
      serverModule.start();
    }
  } catch (err) {
    logger.error('Failed to start server:', err);
  }
}

app.whenReady().then(() => {
  logger.info('App ready');
  const settings = readSettingsSafe();
  if (typeof settings.autoStart === 'boolean') {
    try {
      app.setLoginItemSettings({ openAtLogin: settings.autoStart });
    } catch (e) {
      try {
        logger.warn('Failed to apply autoStart on boot', e);
      } catch {}
    }
  }
  const initialAutoStart = typeof settings.autoStart === 'boolean' ? settings.autoStart : getAutoStartEffective();
  startServer();
  createTray(initialAutoStart);

  app.on('activate', () => {
    return;
  });
  
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Log the attempt for debugging
    try {
      logger.info('Second instance detected - showing main window', { commandLine, workingDirectory });
    } catch {}

    // Always show window when second instance is detected
    // Removed restriction that required --show/--open flags
    showMainWindow();
  });
});

app.on('before-quit', () => {
  app.isQuiting = true;
});

app.on('window-all-closed', () => {
  return;
});

app.on('render-process-gone', (event, webContents, details) => {
  logger.error('render-process-gone', details);
  requestRestart('render-process-gone');
});

app.on('child-process-gone', (event, details) => {
  logger.error('child-process-gone', details);
  requestRestart('child-process-gone');
});

process.on('unhandledRejection', (reason) => {
  logger.error('unhandledRejection', reason);
});

process.on('uncaughtException', (err) => {
  logger.error('uncaughtException', err);
  setTimeout(() => requestExit(1), 50);
});
