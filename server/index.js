const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// API to list files
app.get('/api/files', async (req, res) => {
    // Default to C:/ if no path provided, or some safe default
    const dirPath = req.query.path || 'C:\\'; 
    
    try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        const files = entries.map(entry => ({
            name: entry.name,
            isDirectory: entry.isDirectory(),
            path: path.join(dirPath, entry.name)
        }));
        
        // Move directories to top
        files.sort((a, b) => {
            if (a.isDirectory === b.isDirectory) {
                return a.name.localeCompare(b.name);
            }
            return a.isDirectory ? -1 : 1;
        });

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


app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
