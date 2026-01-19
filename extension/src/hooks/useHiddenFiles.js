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

  const [shownFiles, setShownFiles] = useState(() => {
    try {
      const saved = localStorage.getItem('shownFiles');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [showHidden, setShowHidden] = useState(false);

  useEffect(() => {
    localStorage.setItem('hiddenFiles', JSON.stringify(hiddenFiles));
  }, [hiddenFiles]);

  useEffect(() => {
    localStorage.setItem('shownFiles', JSON.stringify(shownFiles));
  }, [shownFiles]);

  const toggleHidden = useCallback((filePath) => {
    setHiddenFiles(prevHidden => {
      if (prevHidden.includes(filePath)) {
        setShownFiles(prevShown => (prevShown.includes(filePath) ? prevShown : [...prevShown, filePath]));
        return prevHidden.filter(p => p !== filePath);
      }

      setShownFiles(prevShown => prevShown.filter(p => p !== filePath));
      return [...prevHidden, filePath];
    });
  }, []);

  const addHiddenFiles = useCallback((filePaths) => {
    if (!Array.isArray(filePaths) || filePaths.length === 0) return;
    setHiddenFiles(prevHidden => {
      const nextHidden = new Set(prevHidden);
      let changed = false;
      filePaths.forEach(filePath => {
        if (!shownFiles.includes(filePath) && !nextHidden.has(filePath)) {
          nextHidden.add(filePath);
          changed = true;
        }
      });
      return changed ? Array.from(nextHidden) : prevHidden;
    });
  }, [shownFiles]);

  const isHidden = useCallback((filePath) => {
    if (shownFiles.includes(filePath)) return false;
    if (hiddenFiles.includes(filePath)) return true;
    return false;
  }, [hiddenFiles, shownFiles]);

  const toggleShowHidden = useCallback(() => {
      setShowHidden(prev => !prev);
  }, []);

  const setShowHiddenState = useCallback((value) => {
    setShowHidden(Boolean(value));
  }, []);

  return {
    hiddenFiles,
    shownFiles,
    showHidden,
    toggleHidden,
    isHidden,
    toggleShowHidden,
    addHiddenFiles,
    setShowHiddenState
  };
}
