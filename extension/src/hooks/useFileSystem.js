import { useState, useCallback } from 'react';

const API_BASE = 'http://localhost:3001/api';

export function useFileSystem() {
  const [files, setFiles] = useState([]);
  const [currentPath, setCurrentPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFiles = useCallback(async (path = '', depth = 1) => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL(`${API_BASE}/files`);
      if (path) url.searchParams.set('path', path);
      if (depth > 1) url.searchParams.set('depth', depth);
      
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error('Failed to fetch files');
      const data = await res.json();
      setFiles(data.files);
      setCurrentPath(data.currentPath);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const openInExplorer = useCallback(async (path) => {
    try {
      await fetch(`${API_BASE}/open`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path })
      });
    } catch (err) {
      console.error('Failed to open:', err);
    }
  }, []);

  const checkPath = useCallback(async (path) => {
    try {
      const res = await fetch(`${API_BASE}/check-path`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path })
      });
      const data = await res.json();
      return data;
    } catch (err) {
      return { valid: false, error: err.message };
    }
  }, []);

  // CRUD Operations
  const createFolder = useCallback(async (path) => {
      await fetch(`${API_BASE}/mkdir`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path })
      });
  }, []);

  const createFile = useCallback(async (path) => {
      const res = await fetch(`${API_BASE}/mkfile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path })
      });
      if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to create file');
      }
  }, []);

  const renameItem = useCallback(async (oldPath, newPath) => {
      await fetch(`${API_BASE}/rename`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ oldPath, newPath })
      });
  }, []);

  const deleteItem = useCallback(async (path) => {
      await fetch(`${API_BASE}/delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path })
      });
  }, []);

  const copyItem = useCallback(async (source, destination) => {
      const res = await fetch(`${API_BASE}/copy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source, destination })
      });
      if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to copy item');
      }
  }, []);

  const copyToClipboard = useCallback(async (paths) => {
      const res = await fetch(`${API_BASE}/system-clipboard/copy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paths })
      });
      if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to copy to clipboard');
      }
  }, []);

  const getClipboardFiles = useCallback(async () => {
      const res = await fetch(`${API_BASE}/system-clipboard/paste`);
      if (!res.ok) {
          throw new Error('Failed to get clipboard content');
      }
      const data = await res.json();
      return data.files || [];
  }, []);

  return {
    files,
    currentPath,
    loading,
    error,
    fetchFiles,
    openInExplorer,
    checkPath,
    createFolder,
    createFile,
    renameItem,
    deleteItem,
    copyItem,
    copyToClipboard,
    getClipboardFiles
  };
}
