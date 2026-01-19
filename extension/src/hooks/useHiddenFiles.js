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

  return {
    hiddenFiles,
    showHidden,
    toggleHidden,
    isHidden,
    toggleShowHidden
  };
}
