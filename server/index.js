const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Serve static files from the extension build directory
const extensionDistPath = path.join(__dirname, '../extension/dist');
app.use(express.static(extensionDistPath));

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
        console.error(`Error reading directory ${dir}:`, error);
        return [];
    }
};

// API to list files
app.get('/api/files', async (req, res) => {
    // Default to C:/ if no path provided, or some safe default
    const dirPath = req.query.path || 'C:\\';
    const depth = parseInt(req.query.depth) || 1;
    
    try {
        const files = await getFilesRecursive(dirPath, 1, depth);
        res.json({ currentPath: dirPath, files });
    } catch (error) {
        console.error('Error reading directory:', error);
        res.status(500).json({ error: error.message });
    }
});

// API to open explorer
app.post('/api/open', (req, res) => {
    const { path: targetPath } = req.body;
    
    if (!targetPath) {
        return res.status(400).json({ error: 'Path is required' });
    }

    console.log(`Opening: ${targetPath}`);

    // Use 'explorer' command on Windows
    // standardizing path separators
    const cleanPath = path.normalize(targetPath);
    const command = `explorer "${cleanPath}"`;
    
    exec(command, (error) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return res.status(500).json({ error: error.message });
        }
        res.json({ success: true, message: `Opened ${targetPath}` });
    });
});

// API to open folder picker dialog
app.post('/api/pick-folder', (req, res) => {
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
    const command = `powershell -Command "${psCommand.replace(/\n/g, ' ')}"`;

    exec(command, { encoding: 'utf8' }, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
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


let server;

const start = (port = PORT) => {
    if (server) return server;
    server = app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
    return server;
};

module.exports = { start, app, PORT };

if (require.main === module) {
    start();
}
