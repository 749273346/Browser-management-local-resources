import { useState, useEffect } from 'react'
import { useFileSystem } from './hooks/useFileSystem'
import { useHiddenFiles } from './hooks/useHiddenFiles'
import WelcomeScreen from './components/WelcomeScreen'
import TopBar from './components/TopBar'
import FileGrid from './components/FileGrid'
import FileList from './components/FileList'
import SettingsModal from './components/SettingsModal'
import ContextMenu from './components/ContextMenu'
import Toast from './components/Toast'
import { applyTheme, applyColorMode } from './theme'

function App() {
  const { 
    files, 
    currentPath, 
    loading, 
    error, 
    fetchFiles, 
    openInExplorer,
    createFolder,
    createFile,
    renameItem,
    deleteItem
  } = useFileSystem();

  const { toggleHidden, isHidden, showHidden, toggleShowHidden } = useHiddenFiles();

  // Filter files based on hidden status
  const visibleFiles = files.filter(file => showHidden || !isHidden(file.path));

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  
  // Toast State
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
      setToast({ message, type });
      setTimeout(() => setToast({ message: '', type: 'success' }), 3000);
  };
  
  // Context Menu State
  const [contextMenu, setContextMenu] = useState({ x: null, y: null, file: null });

  // Try to get path from URL params first (for multi-tab nav), then localStorage
  const getInitialPath = () => {
    const params = new URLSearchParams(window.location.search);
    const pathFromUrl = params.get('path');
    if (pathFromUrl) return pathFromUrl;
    
    return localStorage.getItem('rootPath') || '';
  };

  const [path, setPath] = useState(getInitialPath());
  
  // Initialize Theme and Background
  useEffect(() => {
      const savedMode = localStorage.getItem('colorMode') || 'day';
      applyColorMode(savedMode);
      const savedTheme = localStorage.getItem('appTheme') || 'high-speed';
      applyTheme(savedTheme);
      
      const bgImage = localStorage.getItem('bgImage');
      const glassOpacity = localStorage.getItem('glassOpacity');
      const glassBlur = localStorage.getItem('glassBlur');
      
      const root = document.documentElement;
      if (bgImage) root.style.setProperty('--bg-image', `url("${bgImage}")`);
      if (glassOpacity) root.style.setProperty('--glass-opacity', glassOpacity);
      if (glassBlur) root.style.setProperty('--glass-blur', `${glassBlur}px`);
  }, []);
  
  const isRoot = path === localStorage.getItem('rootPath');
  const depth = isRoot ? 0 : 1;

  // Initial Load
  useEffect(() => {
    if (path) {
      fetchFiles(path);
    }
  }, [path, fetchFiles]);

  const handleSetRoot = (newPath) => {
    localStorage.setItem('rootPath', newPath);
    setPath(newPath);
    window.location.href = 'index.html'; 
  };

  const handleNavigate = (file) => {
    if (file.isDirectory) {
      // If folder is empty, open in system explorer directly
      if (file.isEmpty) {
        openInExplorer(file.path);
        return;
      }

      // Update URL for persistence (supports refresh)
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('path', file.path);
      window.history.pushState({}, '', newUrl.toString());

      // Navigate within the app
      fetchFiles(file.path);
    } else {
      openInExplorer(file.path);
    }
  };
  
  const handleReset = () => {
      if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.update) {
           chrome.tabs.update({ url: 'index.html' });
      } else {
          window.location.href = 'index.html';
      }
  };

  // Context Menu Handlers
  const handleContextMenu = (e, file = null) => {
      e.preventDefault();
      setContextMenu({
          x: e.clientX,
          y: e.clientY,
          file: file
      });
  };

  const handleMenuAction = async (action, file) => {
      try {
          if (action === 'open') {
              handleNavigate(file);
          } else if (action === 'rename') {
              const newName = prompt('请输入新名称 (New Name):', file.name);
              if (newName && newName !== file.name) {
                  const newPath = file.path.replace(file.name, newName);
                  await renameItem(file.path, newPath);
                  fetchFiles(currentPath);
                  showToast('重命名成功');
              }
          } else if (action === 'delete') {
              if (confirm(`确定要删除 "${file.name}" 吗? 此操作无法撤销。`)) {
                  await deleteItem(file.path);
                  fetchFiles(currentPath);
                  showToast('删除成功');
              }
          } else if (action === 'hide') {
              toggleHidden(file.path);
              showToast('已更新显示状态');
          } else if (action === 'new-folder') {
              const name = prompt('请输入文件夹名称 (Folder Name):', '新建文件夹');
              if (name) {
                  // Construct path. Note: Windows uses backslash, but Node handles it. 
                  // We need to append to currentPath.
                  // Need to handle trailing slash logic safely
                  const separator = currentPath.includes('/') ? '/' : '\\';
                  const newPath = `${currentPath}${separator}${name}`;
                  await createFolder(newPath);
                  fetchFiles(currentPath);
                  showToast('文件夹创建成功');
              }
          } else if (action.startsWith('new-file-')) {
              const type = action.replace('new-file-', '');
              const extMap = {
                  'txt': '.txt',
                  'doc': '.doc',
                  'docx': '.docx',
                  'xls': '.xls',
                  'xlsx': '.xlsx',
                  'ppt': '.ppt',
                  'pptx': '.pptx'
              };
              const ext = extMap[type] || '';
              const defaultName = `新建文件${ext}`;
              
              const name = prompt(`请输入文件名 (File Name):`, defaultName);
              if (name) {
                  let finalName = name;
                  // Only append extension if not present
                  if (!finalName.toLowerCase().endsWith(ext)) {
                      finalName += ext;
                  }
                  
                  // Basic validation
                  const invalidChars = /[<>:"/\\|?*]/;
                  if (invalidChars.test(finalName)) {
                      showToast('文件名包含非法字符', 'error');
                      return;
                  }

                  const separator = currentPath.includes('/') ? '/' : '\\';
                  const newPath = `${currentPath}${separator}${finalName}`;
                  await createFile(newPath);
                  fetchFiles(currentPath);
                  showToast('文件创建成功');
              }
          } else if (action === 'properties') {
              alert(`名称: ${file.name}\n路径: ${file.path}\n类型: ${file.isDirectory ? '文件夹' : '文件'}`);
          } else if (action === 'refresh') {
              fetchFiles(currentPath);
              showToast('已刷新');
          }
      } catch (err) {
          showToast('操作失败: ' + err.message, 'error');
      }
  };

  if (!localStorage.getItem('rootPath') && !path) {
    return <WelcomeScreen onComplete={handleSetRoot} />;
  }

  return (
    <div 
        className="flex flex-col h-screen bg-transparent text-gray-800 font-sans selection:bg-primary-100 selection:text-primary-700"
        onContextMenu={(e) => handleContextMenu(e, null)}
        onClick={() => setContextMenu({ x: null, y: null, file: null })} // Close menu on click
    >
      <TopBar 
        currentPath={currentPath} 
        onNavigate={fetchFiles}
        onReset={handleReset}
        depth={depth}
        onOpenSettings={() => setIsSettingsOpen(true)}
        viewMode={viewMode}
        onToggleView={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')}
        showHidden={showHidden}
        onToggleHidden={toggleShowHidden}
      />

      <div className="flex-1 overflow-y-auto custom-scrollbar relative z-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
             <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
             <span className="text-lg text-gray-500 font-medium">正在调度资源...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="text-red-500 mb-2 font-medium text-lg">连接异常</div>
            <div className="text-gray-600 bg-white/50 backdrop-blur-sm p-4 rounded-xl mb-4 max-w-lg shadow-sm">{error}</div>
            <button 
                onClick={() => fetchFiles(currentPath)}
                className="px-6 py-2 bg-white/80 hover:bg-white border border-white/40 rounded-full font-medium transition-colors shadow-sm backdrop-blur-sm text-primary-700"
            >
                重试
            </button>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
                <FileGrid 
                    files={visibleFiles} 
                    onNavigate={handleNavigate} 
                    onContextMenu={handleContextMenu}
                    isHidden={isHidden}
                />
            ) : (
                <FileList 
                    files={visibleFiles} 
                    onNavigate={handleNavigate} 
                    onContextMenu={handleContextMenu}
                    depth={depth}
                    isHidden={isHidden}
                />
            )}
            
            {visibleFiles.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500 bg-white/30 backdrop-blur-sm rounded-2xl mx-8 mt-8 border border-white/20">
                    <span className="text-lg">暂无物资</span>
                </div>
            )}
          </>
        )}
      </div>
      
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />

      <ContextMenu 
        x={contextMenu.x} 
        y={contextMenu.y} 
        file={contextMenu.file} 
        fileHidden={contextMenu.file ? isHidden(contextMenu.file.path) : false}
        onAction={handleMenuAction}
        onClose={() => setContextMenu({ x: null, y: null, file: null })}
      />

      <Toast 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ message: '', type: 'success' })} 
      />
    </div>
  )
}

export default App
