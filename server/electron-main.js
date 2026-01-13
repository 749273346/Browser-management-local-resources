const { app, BrowserWindow, Tray, Menu, shell, nativeImage, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

let mainWindow;
let tray;

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

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  try {
    logger.warn('Single instance lock failed; quitting');
  } catch {}
  // Exit with 202 to indicate to the wrapper script that an instance is already running
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

function createTray() {
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
  
  const contextMenu = Menu.buildFromTemplate([
    { 
      label: '打开控制台', 
      click: () => {
        showMainWindow();
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

  tray.setContextMenu(contextMenu);

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
  startServer();
  createTray();

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
