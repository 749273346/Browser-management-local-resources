const { app, BrowserWindow, Tray, Menu, shell, nativeImage, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
  return;
}

let mainWindow;
let tray;

app.setAppUserModelId('com.qc.localresourcemanager');

ipcMain.on('hide-window', () => {
  if (mainWindow) mainWindow.hide();
});

ipcMain.on('restart-app', () => {
  app.relaunch();
  app.exit();
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 600,
    show: false,
    frame: true,
    title: '浏览器资源管理 - 服务控制台',
    icon: getIconPath(),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

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

function getIconPath() {
  const possiblePaths = [
    path.join(__dirname, 'assets/icon16.png'),
    path.join(__dirname, 'assets/icon.png'),
    path.join(__dirname, '../extension/public/icon.png'),
    path.join(__dirname, '../extension/dist/icon.png')
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      console.log('Found icon at:', p);
      return p;
    }
  }
  console.error('Icon not found in any of the paths:', possiblePaths);
  return null;
}

function createTray() {
  const iconPath = getIconPath();
  let trayImage;
  
  try {
    if (iconPath) {
      console.log('Loading icon from:', iconPath);
      // Read file and convert to data URL to avoid path encoding issues
      const buffer = fs.readFileSync(iconPath);
      const base64Icon = buffer.toString('base64');
      const dataUrl = `data:image/png;base64,${base64Icon}`;
      const icon = nativeImage.createFromDataURL(dataUrl);
      
      if (icon.isEmpty()) {
         console.error('Icon is empty after loading from Data URL');
         trayImage = nativeImage.createEmpty();
      } else {
         // Resize to 16x16 for best tray appearance on Windows
         trayImage = icon.resize({ width: 16, height: 16 });
      }
    } else {
      console.warn('No icon path found, creating empty Tray');
      trayImage = nativeImage.createEmpty();
    }
  } catch (err) {
    console.error('Error creating Tray icon:', err);
    trayImage = nativeImage.createEmpty();
  }

  tray = new Tray(trayImage);
  tray.setToolTip('浏览器资源管理服务');
  
  const contextMenu = Menu.buildFromTemplate([
    { 
      label: '打开控制台', 
      click: () => {
        mainWindow.show();
        mainWindow.focus();
      } 
    },
    { type: 'separator' },
    { 
      label: '重启服务', 
      click: () => {
        app.relaunch();
        app.exit();
      } 
    },
    { 
      label: '退出', 
      click: () => {
        app.isQuiting = true;
        app.quit();
      } 
    }
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    mainWindow.show();
    mainWindow.focus();
  });
  
  tray.on('click', () => {
    mainWindow.show();
    mainWindow.focus();
  });
}

function startServer() {
  try {
    console.log('Starting Express Server...');
    const serverModule = require('./index.js');
    if (serverModule && typeof serverModule.start === 'function') {
      serverModule.start();
    }
  } catch (err) {
    console.error('Failed to start server:', err);
  }
}

app.whenReady().then(() => {
  startServer();
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
  
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
});

app.on('window-all-closed', () => {
  return;
});
