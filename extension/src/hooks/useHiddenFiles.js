import { useState, useEffect, useCallback } from 'react';

export function useHiddenFiles() {
  const [hiddenFiles, setHiddenFiles] = useState(() => {
    try {
      const saved = localStorage.getItem('hiddenFiles');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [showHidden, setShowHidden] = useState(false);

  useEffect(() => {
    localStorage.setItem('hiddenFiles', JSON.stringify(hiddenFiles));
  }, [hiddenFiles]);

  const toggleHidden = useCallback((filePath) => {
    setHiddenFiles(prev => {
      if (prev.includes(filePath)) {
        return prev.filter(p => p !== filePath);
      }
      return [...prev, filePath];
    });
  }, []);

  const isHidden = useCallback((filePath) => {
    return hiddenFiles.includes(filePath);
  }, [hiddenFiles]);

  const toggleShowHidden = useCallback(() => {
      setShowHidden(prev => !prev);
  }, []);

  const addHiddenFiles = useCallback((paths) => {
    if (!Array.isArray(paths) || paths.length === 0) return;
    setHiddenFiles(prev => {
      const next = new Set(prev);
      paths.forEach(p => next.add(p));
      return Array.from(next);
    });
  }, []);

  const setShowHiddenState = useCallback((value) => {
    setShowHidden(!!value);
  }, []);

  return {
    hiddenFiles,
    showHidden,
    toggleHidden,
    isHidden,
    toggleShowHidden,
    addHiddenFiles,
    setShowHiddenState
  };
}
