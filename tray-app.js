const { app, Tray, Menu, shell } = require('electron');
const { spawn } = require('child_process');
const path = require('path');

let tray = null;
let serverProcess = null;
let isServerRunning = false;

const SERVER_DIR = path.join(__dirname, 'server');
const SERVER_URL = 'http://localhost:3001';

function createTray() {
    tray = new Tray(path.join(__dirname, 'icon16.png'));
    
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Local Resource Manager',
            enabled: false
        },
        {
            type: 'separator'
        },
        {
            label: isServerRunning ? '✅ Server Running' : '❌ Server Stopped',
            enabled: false
        },
        {
            label: isServerRunning ? 'Stop Server' : 'Start Server',
            click: () => {
                isServerRunning ? stopServer() : startServer();
                updateTrayMenu();
            }
        },
        {
            type: 'separator'
        },
        {
            label: 'Open Extension',
            click: () => {
                shell.openExternal('chrome://extensions');
            }
        },
        {
            label: 'Test Server',
            click: () => {
                shell.openExternal(SERVER_URL);
            }
        },
        {
            type: 'separator'
        },
        {
            label: 'Quit',
            click: () => {
                stopServer();
                app.quit();
            }
        }
    ]);
    
    tray.setToolTip('Local Resource Manager Server');
    tray.setContextMenu(contextMenu);
    
    tray.on('double-click', () => {
        shell.openExternal(SERVER_URL);
    });
}

function updateTrayMenu() {
    if (tray) {
        createTray();
    }
}

function startServer() {
    if (serverProcess) {
        console.log('Server already running');
        return;
    }
    
    console.log('🚀 Starting server...');
    serverProcess = spawn('npm', ['start'], {
        cwd: SERVER_DIR,
        stdio: 'pipe',
        shell: true,
        windowsHide: true
    });
    
    serverProcess.stdout.on('data', (data) => {
        console.log(`📡 ${data.toString().trim()}`);
        if (data.toString().includes('Server running')) {
            isServerRunning = true;
            updateTrayMenu();
        }
    });
    
    serverProcess.stderr.on('data', (data) => {
        console.error(`❌ ${data.toString().trim()}`);
    });
    
    serverProcess.on('exit', (code) => {
        console.log(`⚠️  Server exited with code ${code}`);
        isServerRunning = false;
        serverProcess = null;
        updateTrayMenu();
    });
}

function stopServer() {
    if (serverProcess) {
        console.log('🛑 Stopping server...');
        serverProcess.kill();
        serverProcess = null;
        isServerRunning = false;
    }
}

app.whenReady().then(() => {
    createTray();
    startServer(); // Auto-start on launch
});

app.on('window-all-closed', (e) => {
    e.preventDefault(); // Keep app running in tray
});

app.on('before-quit', () => {
    stopServer();
});

console.log('🎯 Local Resource Manager Tray App Started');