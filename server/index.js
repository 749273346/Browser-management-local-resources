const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const http = require('http');
const path = require('path');
const { exec, execFile } = require('child_process');
const logger = require('./logger');

const app = express();
const PORT = Number(process.env.PORT || 3001);

app.use(cors());
app.use(express.json());

const isElectronRuntime = () => Boolean(process.versions && process.versions.electron);

const escapePowerShellSingleQuotedString = (value) => String(value).replace(/'/g, "''");

const toPowerShellEncodedCommand = (script) => {
    const base64 = Buffer.from(String(script), 'utf16le').toString('base64');
    return `powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -EncodedCommand ${base64}`;
};

const buildWindowsOpenMaximizedScript = (targetPath) => {
    const escapedPath = escapePowerShellSingleQuotedString(targetPath);
    return `
$ErrorActionPreference = 'SilentlyContinue'
$path = '${escapedPath}'
$ws = New-Object -ComObject WScript.Shell
function ActivateAndMaximize([string]$title) {
  for ($i = 0; $i -lt 25; $i++) {
    if ($ws.AppActivate($title)) {
      Start-Sleep -Milliseconds 80
      $ws.SendKeys('%{SPACE}')
      Start-Sleep -Milliseconds 80
      $ws.SendKeys('x')
      return $true
    }
    Start-Sleep -Milliseconds 120
  }
  return $false
}
if (Test-Path -LiteralPath $path) {
  if ((Get-Item -LiteralPath $path).PSIsContainer) {
    Start-Process -FilePath 'explorer.exe' -ArgumentList @($path) | Out-Null
    Start-Sleep -Milliseconds 150
    $folder = Split-Path -Leaf $path
    [void](ActivateAndMaximize($folder))
  } else {
    Start-Process -FilePath $path -WindowStyle Maximized | Out-Null
    Start-Sleep -Milliseconds 150
    $name = [System.IO.Path]::GetFileName($path)
    if (-not (ActivateAndMaximize($name))) {
      $base = [System.IO.Path]::GetFileNameWithoutExtension($path)
      [void](ActivateAndMaximize($base))
    }
  }
}
    `.trim();
};

try {
    logger.info('Boot', {
        node: process.version,
        platform: process.platform,
        arch: process.arch,
        cwd: process.cwd(),
        electron: process.versions && process.versions.electron ? process.versions.electron : null
    });
} catch {}

// Serve static files from the extension build directory
const extensionDistPath = path.join(__dirname, '../extension/dist');
app.use(express.static(extensionDistPath));

app.get('/health', (req, res) => {
    res.json({
        ok: true,
        pid: process.pid,
        uptimeMs: Math.floor(process.uptime() * 1000),
        timestamp: new Date().toISOString(),
        port: PORT
    });
});

const getRemovableDriveRoots = async () => {
    if (process.platform !== 'win32') return [];

    const psArgs = [
        '-NoProfile',
        '-ExecutionPolicy',
        'Bypass',
        '-Command',
        'Get-CimInstance Win32_LogicalDisk -Filter "DriveType=2" | Select-Object -ExpandProperty DeviceID | ConvertTo-Json -Compress'
    ];

    const output = await new Promise((resolve) => {
        execFile('powershell', psArgs, { windowsHide: true, maxBuffer: 1024 * 1024 }, (error, stdout) => {
            if (error) return resolve('');
            resolve(String(stdout || '').trim());
        });
    });

    if (!output) return [];

    let deviceIds;
    try {
        const parsed = JSON.parse(output);
        deviceIds = Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];
    } catch {
        deviceIds = output
            .split(/\r?\n/g)
            .map(s => s.trim())
            .filter(Boolean);
    }

    const roots = deviceIds
        .map(id => String(id || '').trim())
        .filter(Boolean)
        .map(id => (/^[a-zA-Z]:$/.test(id) ? `${id}\\` : id))
        .map(id => (/^[a-zA-Z]:\\$/.test(id) ? id : id))
        .filter(id => /^[a-zA-Z]:\\?$/.test(id))
        .map(id => (id.endsWith('\\') ? id : `${id}\\`));

    return Array.from(new Set(roots));
};

app.get('/api/removable-drives', async (req, res) => {
    try {
        const drives = await getRemovableDriveRoots();
        res.json({ drives });
    } catch (error) {
        logger.error('Error getting removable drives:', error);
        res.status(500).json({ error: error.message });
    }
});

// Recursive function to get files
const getFilesRecursive = async (dir, currentDepth, maxDepth) => {
    if (currentDepth > maxDepth) return [];
    
    try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        const files = await Promise.all(entries.map(async entry => {
            const fullPath = path.join(dir, entry.name);
            const isDirectory = entry.isDirectory();
            let isEmpty = false;
            let children = [];
            let stats = {};
            
            try {
                stats = await fs.stat(fullPath);
            } catch (e) {
                // Ignore stat errors
            }

            if (isDirectory) {
                try {
                    // Check if empty
                    const childEntries = await fs.readdir(fullPath);
                    isEmpty = childEntries.length === 0;
                    
                    // Recursively get children if within depth
                    if (currentDepth < maxDepth) {
                        children = await getFilesRecursive(fullPath, currentDepth + 1, maxDepth);
                    }
                } catch (e) {
                    // Ignore errors
                }
            }

            return {
                name: entry.name,
                isDirectory,
                path: fullPath,
                isEmpty,
                children,
                size: stats.size || 0,
                mtimeMs: stats.mtimeMs || 0
            };
        }));
        
        // Sort: Directories first
        files.sort((a, b) => {
            if (a.isDirectory === b.isDirectory) {
                return a.name.localeCompare(b.name);
            }
            return a.isDirectory ? -1 : 1;
        });

        return files;
    } catch (error) {
        logger.warn(`Error reading directory ${dir}:`, error);
        return [];
    }
};

// File Type Definitions
const FILE_TYPES = {
    doc: ['.txt', '.md', '.doc', '.docx', '.pdf', '.rtf', '.odt', '.ppt', '.pptx'],
    sheet: ['.xls', '.xlsx', '.csv', '.ods'],
    image: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico', '.tiff'],
    video: ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm'],
    audio: ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a']
};

const SEARCH_LIMIT = 100; // Limit results
const SEARCH_DEPTH = 6;   // Limit depth

const searchFilesRecursive = async (dir, query, type, currentDepth, results) => {
    if (currentDepth > SEARCH_DEPTH || results.length >= SEARCH_LIMIT) return;

    try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
            if (results.length >= SEARCH_LIMIT) break;

            const fullPath = path.join(dir, entry.name);
            const isDirectory = entry.isDirectory();
            
            // Skip hidden files/dirs and system dirs
            if (entry.name.startsWith('.') || entry.name.startsWith('$') || entry.name === 'System Volume Information') continue;

            const lowerName = entry.name.toLowerCase();
            const lowerQuery = query.toLowerCase();
            
            // Check match
            if (lowerName.includes(lowerQuery)) {
                let typeMatch = true;
                
                if (type && type !== 'all') {
                    if (isDirectory) {
                        typeMatch = false; // Don't show folders when filtering by type
                    } else {
                        const ext = path.extname(entry.name).toLowerCase();
                        const allowedExts = FILE_TYPES[type] || [];
                        if (!allowedExts.includes(ext)) {
                            typeMatch = false;
                        }
                    }
                }

                if (typeMatch) {
                    results.push({
                        name: entry.name,
                        path: fullPath,
                        isDirectory,
                        // Add parent dir for display context
                        parentPath: dir
                    });
                }
            }

            // Recurse
            if (isDirectory) {
                // If searching specific type, we still need to recurse into folders
                await searchFilesRecursive(fullPath, query, type, currentDepth + 1, results);
            }
        }
    } catch (e) {
        // Ignore errors
    }
};

// API to search files
app.get('/api/search', async (req, res) => {
    const { query, path: searchPath, type } = req.query;
    
    logger.info(`Search request: query="${query}", path="${searchPath}", type="${type}"`);

    if (!query) return res.json({ results: [] });
    
    // Default to C:\ if no path, but practically frontend should send current path
    const rootPath = searchPath || 'C:\\';
    const results = [];
    
    try {
        await searchFilesRecursive(rootPath, query, type || 'all', 1, results);
        logger.info(`Search completed. Found ${results.length} results.`);
        res.json({ results });
    } catch (error) {
        logger.error('Search error:', error);
        res.status(500).json({ error: error.message });
    }
});

// API to list files
app.get('/api/files', async (req, res) => {
    // Default to C:/ if no path provided, or some safe default
    const dirPath = req.query.path || 'C:\\';
    const depth = parseInt(req.query.depth) || 1;
    
    try {
        const files = await getFilesRecursive(dirPath, 1, depth);
        res.json({ currentPath: dirPath, files });
    } catch (error) {
        logger.error('Error reading directory:', error);
        res.status(500).json({ error: error.message });
    }
});

// API to open explorer
app.post('/api/open', async (req, res) => {
    const { path: targetPath } = req.body;
    
    if (!targetPath) {
        return res.status(400).json({ error: 'Path is required' });
    }

    logger.info(`Opening: ${targetPath}`);

    let stats;
    try {
        stats = await fs.stat(targetPath);
    } catch (err) {
        logger.error(`File not found: ${targetPath}`);
        return res.status(404).json({ error: 'File does not exist' });
    }

    const cleanPath = path.normalize(targetPath);

    if (process.platform === 'win32') {
        // Try shell.openPath first if in Electron
        if (isElectronRuntime()) {
            try {
                const { shell } = require('electron');
                const result = await shell.openPath(cleanPath);
                if (result) {
                    logger.warn(`Electron shell.openPath failed: ${result}. Falling back to start command.`);
                    // Fallback to start command below
                } else {
                    return res.json({ success: true, message: `Opened ${targetPath}` });
                }
            } catch (error) {
                logger.error('Electron openPath error:', error);
                // Fallback to start command below
            }
        }

        // Use PowerShell script with P/Invoke for robust window activation
        const scriptPath = path.join(__dirname, 'scripts', 'open-file.ps1');
        let psCommand;
        
        if (stats.isDirectory()) {
             // For directories, explorer.exe handles it well enough usually
             psCommand = `powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath 'explorer.exe' -ArgumentList \\"${cleanPath}\\" -WindowStyle Maximized"`;
        } else {
             // For files, use our custom script
             // Escape single quotes for PowerShell argument
             const escapedPath = cleanPath.replace(/'/g, "''");
             psCommand = `powershell -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}" -FilePath '${escapedPath}'`;
        }
        
        return exec(psCommand, { encoding: 'utf8' }, (error) => {
            if (error) {
                logger.error(`PowerShell error: ${error}`);
                logger.error(`Error details - message: ${error.message}, code: ${error.code}, signal: ${error.signal}`);
                
                // Fallback 1: try cmd start
                logger.info('Attempting fallback with cmd start...');
                // start "" /MAX "path" - empty string is title, required when path is quoted
                const command = `chcp 65001 >NUL && start "" /MAX "${cleanPath}"`;
                
                return exec(command, { encoding: 'utf8' }, (cmdError) => {
                    if (cmdError) {
                        logger.error(`CMD start fallback error: ${cmdError}`);
                        
                        // Fallback 2: try rundll32 if CMD fails
                        logger.info('Attempting fallback with rundll32...');
                        return execFile('rundll32.exe', ['url.dll,FileProtocolHandler', cleanPath], (err2) => {
                            if (err2) {
                                logger.error(`Fallback rundll32 error: ${err2}`);
                                return res.status(500).json({ 
                                    error: `All open methods failed: ${error.message} | CMD: ${cmdError.message} | rundll32: ${err2.message}`,
                                    details: {
                                        originalError: error.message,
                                        cmdError: cmdError.message,
                                        rundll32Error: err2.message,
                                        attemptedPath: cleanPath
                                    }
                                });
                            }
                            return res.json({ success: true, message: `Opened ${targetPath} (rundll32 fallback)` });
                        });
                    }
                    return res.json({ success: true, message: `Opened ${targetPath} (CMD fallback)` });
                });
            }
            res.json({ success: true, message: `Opened ${targetPath}` });
        });
    }

    const command = `xdg-open "${cleanPath.replace(/"/g, '\\"')}"`;
    exec(command, (error) => {
        if (error) {
            logger.error(`exec error: ${error}`);
            return res.status(500).json({ error: error.message });
        }
        res.json({ success: true, message: `Opened ${targetPath}` });
    });
});

// API to open folder picker dialog
app.post('/api/pick-folder', async (req, res) => {
    if (isElectronRuntime()) {
        try {
            const { dialog, BrowserWindow } = require('electron');
            const tempWindow = new BrowserWindow({
                width: 0,
                height: 0,
                show: false,
                frame: false,
                transparent: true,
                skipTaskbar: true,
                alwaysOnTop: true, // Force window to be on top
                webPreferences: {
                    sandbox: true
                }
            });

            // Ensure the temp window is focused to bring dialog to front
            tempWindow.setAlwaysOnTop(true, 'screen-saver');
            
            const result = await dialog.showOpenDialog(tempWindow, {
                title: '选择根目录',
                properties: ['openDirectory'],
                defaultPath: req.body.currentPath || undefined // Optional: start at current path if provided
            });

            tempWindow.destroy();

            if (result.canceled) {
                return res.json({ path: '' });
            }

            const selectedPath = (result.filePaths && result.filePaths[0]) ? result.filePaths[0] : '';
            return res.json({ path: selectedPath || '' });
        } catch (error) {
            logger.error('Electron folder picker failed:', error);
            return res.status(500).json({ error: 'Failed to open folder picker', details: error.message });
        }
    }

    // PowerShell command to open FolderBrowserDialog
    // Force UTF-8 encoding for output to handle non-ASCII paths correctly
    const psCommand = `
        [Console]::OutputEncoding = [System.Text.Encoding]::UTF8;
        Add-Type -AssemblyName System.Windows.Forms;
        $f = New-Object System.Windows.Forms.FolderBrowserDialog;
        $f.Description = 'Select Root Directory';
        $result = $f.ShowDialog();
        if ($result -eq 'OK') {
            Write-Output $f.SelectedPath
        }
    `;

    // Encode command to avoid quoting issues
    const command = `powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -Command "${psCommand.replace(/\n/g, ' ')}"`;

    exec(command, { encoding: 'utf8' }, (error, stdout, stderr) => {
        if (error) {
            logger.error(`exec error: ${error}`, { stderr });
            return res.status(500).json({ error: 'Failed to open folder picker', details: error.message });
        }
        
        const selectedPath = stdout.trim();
        if (!selectedPath) {
             return res.json({ path: '' }); // User cancelled
        }
        res.json({ path: selectedPath });
    });
});

// API to check if path exists and is a directory
app.post('/api/check-path', async (req, res) => {
    const { path: targetPath } = req.body;
    
    if (!targetPath) {
        return res.status(400).json({ valid: false, error: 'Path is required' });
    }

    try {
        const stats = await fs.stat(targetPath);
        if (stats.isDirectory()) {
            res.json({ valid: true });
        } else {
            res.json({ valid: false, error: 'Path is not a directory' });
        }
    } catch (error) {
        res.json({ valid: false, error: 'Path does not exist' });
    }
});

// CRUD APIs

// Create Directory
app.post('/api/mkdir', async (req, res) => {
    const { path: targetPath } = req.body;
    if (!targetPath) return res.status(400).json({ error: 'Path is required' });

    try {
        await fs.mkdir(targetPath);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create File (Empty)
app.post('/api/mkfile', async (req, res) => {
    const { path: targetPath } = req.body;
    if (!targetPath) return res.status(400).json({ error: 'Path is required' });

    try {
        // Check if file exists to prevent overwrite? 
        // For "New File" logic, we usually ensure unique name on client side or handle EEXIST here.
        // For now, let's just use 'wx' flag (fail if exists) or just standard write (overwrite).
        // Standard "New" behavior usually implies we found a unique name first.
        await fs.writeFile(targetPath, '', { flag: 'wx' }); 
        res.json({ success: true });
    } catch (error) {
        if (error.code === 'EEXIST') {
            return res.status(400).json({ error: 'File already exists' });
        }
        res.status(500).json({ error: error.message });
    }
});

// Rename
app.post('/api/rename', async (req, res) => {
    const { oldPath, newPath } = req.body;
    if (!oldPath || !newPath) return res.status(400).json({ error: 'Old and new paths are required' });

    try {
        await fs.rename(oldPath, newPath);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete
app.post('/api/delete', async (req, res) => {
    const { path: targetPath } = req.body;
    if (!targetPath) return res.status(400).json({ error: 'Path is required' });

    try {
        const stats = await fs.stat(targetPath);
        if (stats.isDirectory()) {
            await fs.rm(targetPath, { recursive: true, force: true });
        } else {
            await fs.unlink(targetPath);
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Copy
app.post('/api/copy', async (req, res) => {
    const { source, destination } = req.body;
    if (!source || !destination) return res.status(400).json({ error: 'Source and destination paths are required' });

    try {
        // Node.js 16.7.0+ supports fs.cp
        await fs.cp(source, destination, { recursive: true });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// System Clipboard API
app.post('/api/system-clipboard/copy', async (req, res) => {
    const { paths } = req.body;
    if (!paths || !Array.isArray(paths) || paths.length === 0) {
        return res.status(400).json({ error: 'Paths array is required' });
    }

    try {
        // Construct PowerShell command to set clipboard
        const escapedPaths = paths.map(p => `'${p.replace(/'/g, "''")}'`).join(',');
        const psScript = `
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Set-Clipboard -Path ${escapedPaths}
        `.trim();
        const command = toPowerShellEncodedCommand(psScript);

        exec(command, { encoding: 'utf8' }, (error, stdout, stderr) => {
            if (error) {
                logger.error('Clipboard copy error:', error);
                return res.status(500).json({ error: error.message });
            }
            res.json({ success: true });
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/system-clipboard/paste', async (req, res) => {
    try {
        // Get files from clipboard with metadata
        // Format: FullPath|Name|IsDirectory
        const psScript = `
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$files = Get-Clipboard -Format FileDropList -ErrorAction SilentlyContinue
if ($files) {
  foreach ($f in $files) {
    $full = if ($f -is [string]) { $f } elseif ($null -ne $f.FullName) { $f.FullName } else { [string]$f }
    $info = Get-Item -LiteralPath $full -ErrorAction SilentlyContinue
    $name = if ($info) { $info.Name } else { Split-Path -Leaf $full }
    $isDir = if ($info) { [bool]$info.PSIsContainer } else { $false }
    Write-Output "$full|$name|$isDir"
  }
}
        `.trim();
        const command = toPowerShellEncodedCommand(psScript);

        exec(command, { encoding: 'utf8' }, (error, stdout, stderr) => {
            if (error) {
                // If Get-Clipboard fails (e.g. no files), just return empty
                // But typically it just returns nothing if empty
                logger.error('Clipboard paste error:', error);
                return res.json({ files: [] });
            }

            const files = stdout.trim().split('\r\n')
                .filter(line => line.trim())
                .map(line => {
                    const parts = line.split('|');
                    if (parts.length >= 3) {
                        return {
                            path: parts[0],
                            name: parts[1],
                            isDirectory: parts[2].toLowerCase() === 'true'
                        };
                    }
                    return null;
                })
                .filter(item => item !== null);

            res.json({ files });
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Settings API
const settingsPath = path.join(__dirname, 'settings.json');

app.get('/api/settings', async (req, res) => {
    try {
        const data = await fs.readFile(settingsPath, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        if (error.code === 'ENOENT') {
            res.json({}); // Return empty object if no settings file
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

app.post('/api/settings', async (req, res) => {
    try {
        const settings = req.body;
        await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


let server;

function checkHealth(port) {
    return new Promise((resolve) => {
        const req = http.get(
            { hostname: '127.0.0.1', port, path: '/health', timeout: 1000 },
            (res) => {
                resolve(res.statusCode === 200);
                res.resume();
            }
        );
        req.on('timeout', () => {
            try { req.destroy(); } catch {}
            resolve(false);
        });
        req.on('error', () => resolve(false));
    });
}

const start = (port = PORT) => {
    if (server) return server;
    server = app.listen(port, () => {
        logger.info(`Server running at http://localhost:${port}`);
    });
    server.on('error', (err) => {
        if (err && err.code === 'EADDRINUSE') {
            Promise.resolve()
                .then(() => checkHealth(port))
                .then((ok) => {
                    if (ok) {
                        logger.warn(`Port ${port} is already in use. Existing server is healthy.`);
                        server = undefined;
                        process.exit(202);
                        return;
                    }
                    logger.error(`Port ${port} is already in use, and existing server is not healthy.`);
                    server = undefined;
                    process.exit(101);
                })
                .catch(() => {
                    logger.error(`Port ${port} is already in use, and health check failed.`);
                    server = undefined;
                    process.exit(101);
                });
            return;
        }
        logger.error('Server error:', err);
        server = undefined;
    });
    return server;
};

module.exports = { start, app, PORT };

if (require.main === module) {
    start();
}

process.on('unhandledRejection', (reason) => {
    logger.error('unhandledRejection', reason);
});

process.on('uncaughtException', (err) => {
    logger.error('uncaughtException', err);
    setTimeout(() => process.exit(1), 50);
});

function shutdown(signal) {
    try {
        logger.warn(`shutdown ${signal}`);
    } catch {}
    try {
        if (server && typeof server.close === 'function') {
            server.close(() => process.exit(0));
            setTimeout(() => process.exit(0), 1500);
            return;
        }
    } catch {}
    process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
