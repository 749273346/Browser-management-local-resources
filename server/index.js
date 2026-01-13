const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const logger = require('./logger');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const isElectronRuntime = () => Boolean(process.versions && process.versions.electron);

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
                children
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
app.post('/api/open', (req, res) => {
    const { path: targetPath } = req.body;
    
    if (!targetPath) {
        return res.status(400).json({ error: 'Path is required' });
    }

    logger.info(`Opening: ${targetPath}`);

    // Use 'start' command on Windows with /MAX to open maximized and bring to front
    // standardizing path separators
    const cleanPath = path.normalize(targetPath);
    // start "" /MAX "path" - empty string is title, required when path is quoted
    const command = `start "" /MAX "${cleanPath}"`;
    
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

const start = (port = PORT) => {
    if (server) return server;
    server = app.listen(port, () => {
        logger.info(`Server running at http://localhost:${port}`);
    });
    server.on('error', (err) => {
        if (err && err.code === 'EADDRINUSE') {
            logger.warn(`Port ${port} is already in use. Assuming server already running.`);
            server = undefined;
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
