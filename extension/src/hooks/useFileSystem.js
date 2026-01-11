import { useState, useCallback } from 'react';

const API_BASE = 'http://localhost:3001/api';

export function useFileSystem() {
  const [files, setFiles] = useState([]);
  const [currentPath, setCurrentPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFiles = useCallback(async (path = '') => {
    setLoading(true);
    setError(null);
    try {
      const url = path ? `${API_BASE}/files?path=${encodeURIComponent(path)}` : `${API_BASE}/files`;
      const res = await fetch(url);
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

  return {
    files,
    currentPath,
    loading,
    error,
    fetchFiles,
    openInExplorer,
    checkPath,
    createFolder,
    renameItem,
    deleteItem
  };
}
