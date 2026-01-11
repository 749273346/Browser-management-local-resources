import { useState, useEffect } from 'react'
import { useFileSystem } from './hooks/useFileSystem'
import WelcomeScreen from './components/WelcomeScreen'
import TopBar from './components/TopBar'
import FileGrid from './components/FileGrid'
import FileList from './components/FileList'

function App() {
  const { 
    files, 
    currentPath, 
    loading, 
    error, 
    fetchFiles, 
    openInExplorer 
  } = useFileSystem();

  const [rootPath, setRootPath] = useState(localStorage.getItem('rootPath') || '');
  const [history, setHistory] = useState([]); // Stack of paths, excluding root

  // Initial Load
  useEffect(() => {
    if (rootPath) {
      fetchFiles(rootPath);
    }
  }, [rootPath, fetchFiles]);

  const handleSetRoot = (path) => {
    localStorage.setItem('rootPath', path);
    setRootPath(path);
    setHistory([]);
  };

  const handleNavigate = (file) => {
    if (file.isDirectory) {
      const nextDepth = history.length + 1;
      
      // Level 0 (Grid) -> Level 1 (List) -> Level 2 (List) -> Level 3 (Open)
      // Wait, user requirement was:
      // Level 1 (Root) -> Grid
      // Level 2 (Subfolder) -> List
      // Level 3 (Sub-Subfolder) -> Open directly
      
      // Current depth: 
      // 0 = Root (Grid)
      // 1 = Level 2 (List)
      // 2 = Level 3 (Should Open?)
      
      if (history.length >= 2) { // Already at depth 2, going to 3
         openInExplorer(file.path);
         return;
      }

      setHistory([...history, currentPath]);
      fetchFiles(file.path);
    } else {
      openInExplorer(file.path);
    }
  };

  const handleBack = () => {
    if (history.length === 0) return;
    const prevPath = history[history.length - 1];
    setHistory(history.slice(0, -1));
    fetchFiles(prevPath);
  };
  
  const handleReset = () => {
      setHistory([]);
      fetchFiles(rootPath);
  };

  const depth = history.length;

  if (!rootPath) {
    return <WelcomeScreen onComplete={handleSetRoot} />;
  }

  return (
    <div className="flex flex-col h-full bg-surface-50 text-gray-800 font-sans selection:bg-primary-100 selection:text-primary-700">
      <TopBar 
        currentPath={currentPath} 
        onNavigate={fetchFiles}
        onReset={handleReset}
        depth={depth} 
      />

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-40 space-y-3">
             <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
             <span className="text-sm text-gray-400 font-medium">Loading resources...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="text-red-500 mb-2 font-medium">Access Error</div>
            <div className="text-sm text-gray-500 bg-red-50 p-3 rounded-lg">{error}</div>
            <button 
                onClick={() => fetchFiles(currentPath)}
                className="mt-4 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors"
            >
                Try Again
            </button>
          </div>
        ) : (
          <>
            {depth === 0 ? (
              <FileGrid files={files} onNavigate={handleNavigate} />
            ) : (
              <FileList files={files} onNavigate={handleNavigate} depth={depth} />
            )}
            
            {files.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                    <span className="text-sm">This folder is empty</span>
                </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default App
