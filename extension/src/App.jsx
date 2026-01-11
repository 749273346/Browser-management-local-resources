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

  // Try to get path from URL params first (for multi-tab nav), then localStorage
  const getInitialPath = () => {
    const params = new URLSearchParams(window.location.search);
    const pathFromUrl = params.get('path');
    if (pathFromUrl) return pathFromUrl;
    
    return localStorage.getItem('rootPath') || '';
  };

  const [path, setPath] = useState(getInitialPath());
  
  // Is this the root view? (Used for UI state, not just logic)
  const isRoot = path === localStorage.getItem('rootPath');
  // Determine "depth" based on path segments relative to root is tricky without full path history
  // For now, we simplify: If URL has path, it's > Level 0. If it matches root, it's Level 0.
  const depth = isRoot ? 0 : 1; // Simplified depth for UI

  // Initial Load
  useEffect(() => {
    if (path) {
      fetchFiles(path);
    }
  }, [path, fetchFiles]);

  const handleSetRoot = (newPath) => {
    localStorage.setItem('rootPath', newPath);
    setPath(newPath);
    // Reload to clean state
    window.location.href = 'index.html'; 
  };

  const handleNavigate = (file) => {
    if (file.isDirectory) {
      // Logic: 
      // Level 0 (Root) -> Grid View. Click -> Open New Tab (Level 1 List)
      // Level 1 (List) -> List View. Click -> Open New Tab (Level 2 List) ?? 
      // Wait, user said: "Level 1 expands... Level 2 expands... Level 3 opens explorer"
      
      // Let's refine depth logic.
      // If we are at Root (Level 0), clicking a folder opens Level 1.
      // If we are at Level 1, clicking a folder opens Level 2.
      // If we are at Level 2, clicking a folder calls Explorer (Level 3 action).
      
      // We need to know the real depth relative to Root.
      const root = localStorage.getItem('rootPath');
      let currentDepth = 0;
      if (currentPath && root && currentPath.startsWith(root) && currentPath !== root) {
          // Naive depth calc
          const rel = currentPath.substring(root.length);
          currentDepth = rel.split(/[\\/]/).filter(Boolean).length;
      }

      if (currentDepth >= 2) {
          // Level 2 -> Level 3 (Open Explorer)
          openInExplorer(file.path);
      } else {
          // Open new tab for next level
          const targetUrl = `index.html?path=${encodeURIComponent(file.path)}`;
          
          // Use chrome.tabs.create if available (in extension context)
          if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
              chrome.tabs.create({ url: targetUrl });
          } else {
              // Fallback for local dev
              window.open(targetUrl, '_blank');
          }
      }
    } else {
      openInExplorer(file.path);
    }
  };
  
  const handleReset = () => {
      // Just go to root URL
      if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.update) {
           chrome.tabs.update({ url: 'index.html' });
      } else {
          window.location.href = 'index.html';
      }
  };

  // If no root path is set in storage, show Welcome (Login) Screen
  // BUT if we have a path in URL, we assume it's valid access (maybe shared link? unlikely in local)
  // Strict mode: If no rootPath in localStorage, always show Welcome.
  if (!localStorage.getItem('rootPath') && !path) {
    return <WelcomeScreen onComplete={handleSetRoot} />;
  }

  return (
    <div className="flex flex-col h-screen bg-surface-50 text-gray-800 font-sans selection:bg-primary-100 selection:text-primary-700">
      <TopBar 
        currentPath={currentPath} 
        onNavigate={fetchFiles}
        onReset={handleReset}
        depth={depth} 
      />

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
             <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
             <span className="text-lg text-gray-400 font-medium">Loading resources...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="text-red-500 mb-2 font-medium text-lg">Access Error</div>
            <div className="text-gray-500 bg-red-50 p-4 rounded-xl mb-4 max-w-lg">{error}</div>
            <button 
                onClick={() => fetchFiles(currentPath)}
                className="px-6 py-2 bg-white border border-gray-200 rounded-full font-medium hover:bg-gray-50 transition-colors shadow-sm"
            >
                Try Again
            </button>
          </div>
        ) : (
          <>
            {/* Always use Grid for Root (Level 0) and Level 1? Or just Root? 
                User said "Level 1 ... unfolds ... Level 2 ... unfolds".
                Let's keep Grid for Root, and List for deeper levels to show more info.
            */}
            {isRoot ? (
              <FileGrid files={files} onNavigate={handleNavigate} />
            ) : (
              // For Level 1+, we might want a different view or reuse Grid/List.
              // Let's stick to List for sub-levels as per original plan, 
              // BUT user said "Level 2 style is same as Level 1". 
              // If Level 1 is Grid, Level 2 should be Grid? 
              // "二级菜单的这个样式啊，也是跟一级菜单一样，也是这个完美的啊"
              // OK, let's use FileGrid for ALL levels for consistency and beauty!
              <FileGrid files={files} onNavigate={handleNavigate} />
            )}
            
            {files.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <span className="text-lg">This folder is empty</span>
                </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default App
