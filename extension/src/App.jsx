import { useState, useEffect, useMemo } from 'react'
import { useFileSystem } from './hooks/useFileSystem'
import { useHiddenFiles } from './hooks/useHiddenFiles'
import WelcomeScreen from './components/WelcomeScreen'
import TopBar from './components/TopBar'
import FileGrid from './components/FileGrid'
import FileList from './components/FileList'
import DashboardView from './components/DashboardView'
import SettingsModal from './components/SettingsModal'
import ContextMenu from './components/ContextMenu'
import Toast from './components/Toast'
import ConfirmDialog from './components/ConfirmDialog'
import { applyTheme, applyColorMode } from './theme'
import { COLUMN_COLORS } from './constants/theme'

const normalizePathKey = (p) => {
  if (!p) return ''
  return p.replace(/\\/g, '/').replace(/\/$/, '').toLowerCase()
}

const getRootKey = () => normalizePathKey(localStorage.getItem('rootPath'))

const getTopLevelFolderKey = (p, rootKey = getRootKey()) => {
  const np = normalizePathKey(p)
  if (!np || !rootKey) return ''
  if (!np.startsWith(rootKey)) return ''
  const relative = np.slice(rootKey.length).replace(/^\/+/, '')
  const first = relative.split('/')[0]
  if (!first) return ''
  return `${rootKey}/${first}`
}

const isTopLevelFolderPath = (p, rootKey = getRootKey()) => {
  const np = normalizePathKey(p)
  const top = getTopLevelFolderKey(np, rootKey)
  return !!top && np === top
}

const sanitizeFolderColors = (raw, rootKey = getRootKey()) => {
  const next = {}
  for (const [k, v] of Object.entries(raw || {})) {
    if (!v) continue
    const nk = normalizePathKey(k)
    if (!nk) continue
    if (rootKey) {
      if (nk === getTopLevelFolderKey(nk, rootKey)) {
        next[nk] = v
      }
    } else {
      next[nk] = v
    }
  }
  return next
}

const sanitizeFolderViewModes = (raw) => {
  const allowed = new Set(['dashboard', 'grid', 'list'])
  const next = {}
  for (const [k, v] of Object.entries(raw || {})) {
    if (!allowed.has(v)) continue
    const nk = normalizePathKey(k)
    if (!nk) continue
    next[nk] = v
  }
  return next
}

function App() {
  const SERVER_URL = 'http://localhost:3001';

  const updateServerSettings = async (overrides = {}) => {
      try {
          const settings = {
              rootPath: localStorage.getItem('rootPath'),
              folderColors: JSON.parse(localStorage.getItem('folderColors') || '{}'),
              folderViewModes: sanitizeFolderViewModes(JSON.parse(localStorage.getItem('folderViewModes') || '{}')),
              appTheme: localStorage.getItem('appTheme'),
              colorMode: localStorage.getItem('colorMode'),
              bgImage: localStorage.getItem('bgImage'),
              glassOpacity: localStorage.getItem('glassOpacity'),
              glassBlur: localStorage.getItem('glassBlur'),
              ...overrides
          };
          await fetch(`${SERVER_URL}/api/settings`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(settings)
          });
      } catch (e) {
          console.error('Failed to save settings:', e);
      }
  };

  // Sync from server on load
  useEffect(() => {
      const loadSettings = async () => {
          try {
              const res = await fetch(`${SERVER_URL}/api/settings`);
              if (res.ok) {
                  const settings = await res.json();
                  // If server has no settings but local has, push local to server
                  if (Object.keys(settings).length === 0) {
                      if (localStorage.getItem('rootPath')) {
                          console.log('Server settings empty, pushing local settings...');
                          await updateServerSettings();
                      }
                      return;
                  }

                  let changed = false;
                  
                  if (settings.rootPath && settings.rootPath !== localStorage.getItem('rootPath')) {
                      localStorage.setItem('rootPath', settings.rootPath);
                      setPath(settings.rootPath);
                      changed = true;
                  }
                  
                  const localAppTheme = localStorage.getItem('appTheme');
                  if (!localAppTheme && settings.appTheme) {
                      localStorage.setItem('appTheme', settings.appTheme);
                      applyTheme(settings.appTheme);
                      changed = true;
                  } else if (localAppTheme && settings.appTheme !== localAppTheme) {
                      updateServerSettings({ appTheme: localAppTheme }).catch(() => {});
                  }
                  
                  const localColorMode = localStorage.getItem('colorMode');
                  if (!localColorMode && settings.colorMode) {
                      localStorage.setItem('colorMode', settings.colorMode);
                      applyColorMode(settings.colorMode);
                      changed = true;
                  } else if (localColorMode && settings.colorMode !== localColorMode) {
                      updateServerSettings({ colorMode: localColorMode }).catch(() => {});
                  }
                  
                  const keys = ['folderColors', 'bgImage', 'glassOpacity', 'glassBlur'];
                  keys.forEach(key => {
                      if (settings[key]) {
                          const val = typeof settings[key] === 'object' ? JSON.stringify(settings[key]) : settings[key];
                          if (val !== localStorage.getItem(key)) {
                              localStorage.setItem(key, val);
                              changed = true;
                          }
                      }
                  });

                  const serverFolderViewModes = sanitizeFolderViewModes(settings.folderViewModes || {});
                  const serverFolderViewModesJson = JSON.stringify(serverFolderViewModes);
                  if (serverFolderViewModesJson !== localStorage.getItem('folderViewModes')) {
                      localStorage.setItem('folderViewModes', serverFolderViewModesJson);
                      changed = true;
                  }

                  if (changed) {
                      setFolderColors(sanitizeFolderColors(settings.folderColors));
                      setFolderViewModes(serverFolderViewModes);
                      
                      // Update CSS variables for visual settings
                      const root = document.documentElement;
                      if (settings.bgImage) root.style.setProperty('--bg-image', `url("${settings.bgImage}")`);
                      if (settings.glassOpacity) root.style.setProperty('--glass-opacity', settings.glassOpacity);
                      if (settings.glassBlur) root.style.setProperty('--glass-blur', `${settings.glassBlur}px`);
                  }
              }
          } catch (e) {
              console.error('Failed to load settings:', e);
          }
      };
      loadSettings();
  }, []);

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
    deleteItem,
    copyItem,
    copyToClipboard,
    getClipboardFiles
  } = useFileSystem();

  const [clipboard, setClipboard] = useState([]);
  const [selectedPaths, setSelectedPaths] = useState(new Set());
  const [lastSelectedPath, setLastSelectedPath] = useState(null);

  const { toggleHidden, isHidden, showHidden, toggleShowHidden, setShowHidden } = useHiddenFiles();

  // Filter files based on hidden status
  // For dashboard view (recursive), we need to filter children too, 
  // but the current structure of 'files' is flat for grid/list and nested for dashboard.
  // Actually, useFileSystem returns nested structure if depth > 1.
  
  // We need a deep filter function
  const filterFiles = (fileList) => {
      return fileList.filter(file => {
          const isFileHidden = isHidden(file.path);
          if (!showHidden && isFileHidden) return false;
          
          // If it's a directory and has children, filter them recursively
          if (file.isDirectory && file.children) {
              file.children = filterFiles(file.children);
          }
          return true;
      });
  };

  // We need to clone the files array to avoid mutating state directly when filtering children
  const visibleFiles = filterFiles(JSON.parse(JSON.stringify(files)));

  // Sorting State
  const [sortConfig, setSortConfig] = useState(() => {
      try {
          return JSON.parse(localStorage.getItem('sortConfig')) || { key: 'name', direction: 'asc' };
      } catch {
          return { key: 'name', direction: 'asc' };
      }
  });

  useEffect(() => {
      localStorage.setItem('sortConfig', JSON.stringify(sortConfig));
  }, [sortConfig]);

  const sortedFiles = useMemo(() => {
      const sortList = (list) => {
          return list.sort((a, b) => {
              // Always put folders first
              if (a.isDirectory && !b.isDirectory) return -1;
              if (!a.isDirectory && b.isDirectory) return 1;
              
              const { key, direction } = sortConfig;
              const multiplier = direction === 'asc' ? 1 : -1;
              
              if (key === 'name') {
                  return a.name.localeCompare(b.name, 'zh-CN') * multiplier;
              } else if (key === 'date') {
                  return ((a.mtimeMs || 0) - (b.mtimeMs || 0)) * multiplier;
              } else if (key === 'size') {
                  return ((a.size || 0) - (b.size || 0)) * multiplier;
              } else if (key === 'type') {
                   const typeA = a.isDirectory ? 'folder' : (a.name.split('.').pop() || '');
                   const typeB = b.isDirectory ? 'folder' : (b.name.split('.').pop() || '');
                   return typeA.localeCompare(typeB) * multiplier;
              }
              return 0;
          }).map(item => {
              if (item.children) {
                  item.children = sortList(item.children);
              }
              return item;
          });
      };
      
      return sortList([...visibleFiles]);
  }, [visibleFiles, sortConfig]);

  const flatFiles = useMemo(() => {
      const flatten = (list) => {
          let res = [];
          list.forEach(item => {
              res.push(item);
              if (item.children) {
                  res = res.concat(flatten(item.children));
              }
          });
          return res;
      };
      return flatten(sortedFiles);
  }, [sortedFiles]);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Try to get path from URL params first (for multi-tab nav), then localStorage
  const getInitialPath = () => {
    const params = new URLSearchParams(window.location.search);
    const pathFromUrl = params.get('path');
    if (pathFromUrl) {
      // If opened with a specific path (e.g. from Dashboard), set it as root if missing
      // This ensures isRoot logic works correctly and skips WelcomeScreen
      if (!localStorage.getItem('rootPath')) {
        localStorage.setItem('rootPath', pathFromUrl);
      }
      return pathFromUrl;
    }
    
    return localStorage.getItem('rootPath') || '';
  };

  const [path, setPath] = useState(getInitialPath());

  // View Mode State (Per folder)
  const [folderViewModes, setFolderViewModes] = useState(() => {
      try {
          return sanitizeFolderViewModes(JSON.parse(localStorage.getItem('folderViewModes') || '{}'));
      } catch {
          return {};
      }
  });

  // Folder Colors State
  const [folderColors, setFolderColors] = useState(() => {
      try {
          const raw = JSON.parse(localStorage.getItem('folderColors') || '{}')
          return sanitizeFolderColors(raw)
      } catch {
          return {};
      }
  });

  // Get view mode for current path (default to 'dashboard')
  // We should use 'path' state which is the source of truth for navigation in App.jsx
  const currentViewMode = folderViewModes[normalizePathKey(path)] || 'dashboard';

  const handleToggleView = (newMode) => {
      setFolderViewModes(prev => {
          // Use 'path' state instead of 'currentPath' to ensure we update the view mode for the currently displayed folder
          // 'currentPath' from useFileSystem might lag slightly or be the parent of what we want to configure
          // But actually, 'path' state in App.jsx is what drives the navigation.
          const targetPathKey = normalizePathKey(path); 
          const next = { ...prev, [targetPathKey]: newMode };
          localStorage.setItem('folderViewModes', JSON.stringify(next));
          updateServerSettings({ folderViewModes: next }).catch(() => {});
          return next;
      });
  };
  
  // Toast State
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
      setToast({ message, type });
      setTimeout(() => setToast({ message: '', type: 'success' }), 3000);
  };
  
  // Context Menu State
  const [contextMenu, setContextMenu] = useState({ x: null, y: null, file: null });
  const [renamingName, setRenamingName] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ 
    isOpen: false, 
    title: '', 
    message: '', 
    onConfirm: null 
  });
  
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
  
  const isRoot = normalizePathKey(path) === normalizePathKey(localStorage.getItem('rootPath'));
  const depth = isRoot ? 0 : 1;

  useEffect(() => {
      try {
          const raw = JSON.parse(localStorage.getItem('folderColors') || '{}')
          const next = sanitizeFolderColors(raw)
          const rawJson = JSON.stringify(raw || {})
          const nextJson = JSON.stringify(next)
          if (rawJson !== nextJson) {
              localStorage.setItem('folderColors', nextJson)
          }
          setFolderColors(prev => {
              const prevJson = JSON.stringify(prev || {})
              return prevJson === nextJson ? prev : next
          })
      } catch {
          setFolderColors(prev => prev)
      }
  }, []);

  useEffect(() => {
      try {
          const raw = JSON.parse(localStorage.getItem('folderViewModes') || '{}')
          const next = sanitizeFolderViewModes(raw)
          const rawJson = JSON.stringify(raw || {})
          const nextJson = JSON.stringify(next)
          if (rawJson !== nextJson) {
              localStorage.setItem('folderViewModes', nextJson)
              updateServerSettings({ folderViewModes: next }).catch(() => {})
          }
          setFolderViewModes(prev => {
              const prevJson = JSON.stringify(prev || {})
              return prevJson === nextJson ? prev : next
          })
      } catch {
          setFolderViewModes(prev => prev)
      }
  }, []);

  // Initial Load
  useEffect(() => {
    if (path) {
      // Determine view mode for the target path to fetch correct depth
      // We need to look up the mode for 'path', not 'currentPath' (which might be stale)
      const mode = folderViewModes[normalizePathKey(path)] || 'dashboard';
      fetchFiles(path, mode === 'dashboard' ? 2 : 1);
    }
  }, [path, fetchFiles, folderViewModes]); // Added folderViewModes dependency to refetch if mode changes

  // Reset showHidden when entering a new folder
  useEffect(() => {
      setShowHidden(false);
  }, [path, setShowHidden]);

  useEffect(() => {
      if (!isRoot || currentViewMode !== 'dashboard') return;
      if (!Array.isArray(visibleFiles) || visibleFiles.length === 0) return;

      const rootFolders = visibleFiles.filter(f => f.isDirectory);
      if (rootFolders.length === 0) return;

      setFolderColors(prev => {
          let changed = false;
          const next = { ...prev };
          const rootKey = getRootKey();
          rootFolders.forEach((folder, index) => {
              const folderKey = getTopLevelFolderKey(folder.path, rootKey) || normalizePathKey(folder.path);
              if (!folderKey) return;
              if (next[folderKey]) return;
              next[folderKey] = COLUMN_COLORS[index % COLUMN_COLORS.length].id;
              changed = true;
          });
          if (changed) {
              localStorage.setItem('folderColors', JSON.stringify(next));
              updateServerSettings();
              return next;
          }
          return prev;
      });
  }, [isRoot, currentViewMode, visibleFiles, setFolderColors]);

  const handleSetRoot = async (newPath) => {
    localStorage.setItem('rootPath', newPath);
    setPath(newPath);
    await updateServerSettings({ rootPath: newPath });
    window.location.href = 'index.html'; 
  };

  const handleNavigate = (file) => {
    // If folder is empty, open in system explorer directly
    // MODIFIED: Allow entering empty folders
    // if (file.isDirectory && file.isEmpty) {
    //   openInExplorer(file.path);
    //   return;
    // }

    if (file.isDirectory) {
      // Update URL for persistence (supports refresh)
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('path', file.path);
      window.history.pushState({}, '', newUrl.toString());

      // Update state path to trigger effect
      // useEffect will handle the fetchFiles call
      setPath(file.path);
    } else {
      openInExplorer(file.path);
    }
  };
  
  const handlePathNavigate = (newPath) => {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('path', newPath);
      window.history.pushState({}, '', newUrl.toString());
      setPath(newPath);
  };
  
  const handleReset = () => {
      const rootPath = localStorage.getItem('rootPath');
      if (rootPath) {
          handlePathNavigate(rootPath);
      } else {
          if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.update) {
               chrome.tabs.update({ url: 'index.html' });
          } else {
              window.location.href = 'index.html';
          }
      }
  };

  // Helper to generate unique name
  const getUniqueName = (baseName, ext = '') => {
      let name = `${baseName}${ext}`;
      let counter = 2;
      const exists = (n) => files.some(f => f.name === n);
      while (exists(name)) {
          name = `${baseName} (${counter})${ext}`;
          counter++;
      }
      return name;
  };

  const handleRenameSubmit = async (file, newName) => {
      setRenamingName(null);
      if (!newName || newName === file.name) return;
      
      try {
          // Construct new path
          // Handle path separators carefully
          const parentPath = file.path.substring(0, file.path.lastIndexOf(file.name));
          const newPath = parentPath + newName;
          
          await renameItem(file.path, newPath);
          fetchFiles(path, currentViewMode === 'dashboard' ? 2 : 1);
          showToast('重命名成功');
      } catch (err) {
          showToast('重命名失败: ' + err.message, 'error');
      }
  };

  const handleFileClick = (e, file) => {
      e.stopPropagation();
      
      if (e.ctrlKey || e.metaKey) {
          const newSelection = new Set(selectedPaths);
          if (newSelection.has(file.path)) {
              newSelection.delete(file.path);
          } else {
              newSelection.add(file.path);
              setLastSelectedPath(file.path);
          }
          setSelectedPaths(newSelection);
          return;
      }

      if (e.shiftKey && lastSelectedPath) {
          const lastIdx = flatFiles.findIndex(f => f.path === lastSelectedPath);
          const currentIdx = flatFiles.findIndex(f => f.path === file.path);
          
          if (lastIdx !== -1 && currentIdx !== -1) {
              const start = Math.min(lastIdx, currentIdx);
              const end = Math.max(lastIdx, currentIdx);
              const range = flatFiles.slice(start, end + 1).map(f => f.path);
              setSelectedPaths(new Set(range));
              return;
          }
      }

      setSelectedPaths(new Set([file.path]));
      setLastSelectedPath(file.path);
  };

  const handleFileDoubleClick = (e, file) => {
      e.stopPropagation();
      handleNavigate(file);
  };

  const handleBackgroundClick = () => {
      setSelectedPaths(new Set());
      setLastSelectedPath(null);
      setContextMenu({ x: null, y: null, file: null });
  };

  const handleContextMenu = (e, file = null) => {
      e.preventDefault();

      let nextSelectedPaths = selectedPaths;

      if (file && !selectedPaths.has(file.path)) {
          nextSelectedPaths = new Set([file.path]);
          setSelectedPaths(nextSelectedPaths);
          setLastSelectedPath(file.path);
      }

      const selectedCount = file
        ? (nextSelectedPaths.has(file.path) ? nextSelectedPaths.size : 1)
        : 0;

      setContextMenu({ x: e.clientX, y: e.clientY, file, selectedCount });
  };

  const handleMenuAction = async (action, file, extraData) => {
      try {
          let targets = [];
          if (file && selectedPaths.has(file.path)) {
              targets = flatFiles.filter(f => selectedPaths.has(f.path));
          } else if (file) {
              targets = [file];
          }

          if (action === 'set-color') {
              setFolderColors(prev => {
                  const rootKey = getRootKey();
                  const next = { ...prev };
                  
                  targets.forEach(target => {
                      const folderKey = getTopLevelFolderKey(target.path, rootKey);
                      if (!folderKey) return;
                      if (!extraData) {
                          delete next[folderKey];
                      } else {
                          next[folderKey] = extraData;
                      }
                  });
                  
                  localStorage.setItem('folderColors', JSON.stringify(next));
                  return next;
              });
              showToast('颜色设置成功');
          } else if (action === 'open') {
              if (targets.length === 1) handleNavigate(targets[0]);
          } else if (action === 'rename') {
              if (targets.length === 1) {
                  setRenamingName(targets[0].name);
              } else {
                  showToast('不能同时重命名多个文件', 'error');
              }
          } else if (action === 'delete') {
              setConfirmDialog({
                  isOpen: true,
                  title: '删除文件',
                  message: `确定要删除 ${targets.length} 个项目吗? 此操作无法撤销。`,
                  onConfirm: async () => {
                      try {
                          for (const target of targets) {
                              await deleteItem(target.path);
                          }
                          fetchFiles(path, currentViewMode === 'dashboard' ? 2 : 1);
                          showToast('删除成功');
                          setSelectedPaths(new Set());
                      } catch (err) {
                          showToast('删除失败: ' + err.message, 'error');
                      }
                      setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                  }
              });
          } else if (action === 'hide') {
              targets.forEach(target => toggleHidden(target.path));
              showToast('已更新显示状态');
          } else if (action === 'new-folder') {
              const baseName = '新建文件夹';
              const name = getUniqueName(baseName);
              
              let targetPath = path;
              if (file) {
                  if (file.isDirectory) {
                      targetPath = file.path;
                  } else {
                      const p = file.path;
                      const idx = Math.max(p.lastIndexOf('/'), p.lastIndexOf('\\'));
                      if (idx !== -1) {
                          targetPath = p.substring(0, idx);
                      }
                  }
              }

              const separator = targetPath.includes('/') ? '/' : '\\';
              const newPath = `${targetPath}${separator}${name}`;
              
              await createFolder(newPath);
              await fetchFiles(path, currentViewMode === 'dashboard' ? 2 : 1);
              setRenamingName(name);
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
              const typeNameMap = {
                  'txt': '文本文档',
                  'docx': 'Word 文档',
                  'xlsx': 'Excel 工作表',
                  'pptx': 'PPT 演示文稿'
              };
              const ext = extMap[type] || '';
              const baseName = `新建${typeNameMap[type] || '文件'}`;
              
              const name = getUniqueName(baseName, ext);
              
              let targetPath = path;
              if (file) {
                  if (file.isDirectory) {
                      targetPath = file.path;
                  } else {
                      const p = file.path;
                      const idx = Math.max(p.lastIndexOf('/'), p.lastIndexOf('\\'));
                      if (idx !== -1) {
                          targetPath = p.substring(0, idx);
                      }
                  }
              }

              const separator = targetPath.includes('/') ? '/' : '\\';
              const newPath = `${targetPath}${separator}${name}`;
              
              await createFile(newPath);
              await fetchFiles(path, currentViewMode === 'dashboard' ? 2 : 1);
              setRenamingName(name);
          } else if (action === 'properties') {
              if (targets.length === 1) {
                  alert(`名称: ${targets[0].name}\n路径: ${targets[0].path}\n类型: ${targets[0].isDirectory ? '文件夹' : '文件'}`);
              } else {
                   alert(`已选择 ${targets.length} 个项目`);
              }
          } else if (action === 'copy') {
              const itemsToCopy = targets.map(t => ({ path: t.path, name: t.name, isDirectory: t.isDirectory }));
              setClipboard(itemsToCopy);
              
              // Sync to system clipboard
              try {
                  await copyToClipboard(itemsToCopy.map(t => t.path));
              } catch (e) {
                  console.error('Failed to sync to system clipboard', e);
              }

              showToast(`已复制 ${itemsToCopy.length} 个项目`);
          } else if (action === 'paste') {
              let itemsToPaste = [];
              try {
                  const sysFiles = await getClipboardFiles();
                  if (sysFiles && sysFiles.length > 0) {
                      itemsToPaste = sysFiles;
                  } else {
                      itemsToPaste = clipboard;
                  }
              } catch (e) {
                  console.error('Failed to get system clipboard', e);
                  itemsToPaste = clipboard;
              }

              if (!itemsToPaste || itemsToPaste.length === 0) return;
              
              const separator = path.includes('/') ? '/' : '\\';
              
              for (const item of itemsToPaste) {
                  const getParentDir = (p) => {
                      const idx = Math.max(p.lastIndexOf('/'), p.lastIndexOf('\\'));
                      if (idx === -1) return '';
                      return p.substring(0, idx);
                  };
                  // Check if we are pasting into the same folder
                  // Note: item.path from system clipboard might be anything.
                  // We normalize comparison.
                  const itemParent = normalizePathKey(getParentDir(item.path));
                  const currentDir = normalizePathKey(path);
                  const isSameFolder = itemParent === currentDir;
     
                  let baseName = item.name;
                  let ext = '';
                  if (!item.isDirectory) {
                      const lastDotIndex = baseName.lastIndexOf('.');
                      if (lastDotIndex > 0) {
                          ext = baseName.substring(lastDotIndex);
                          baseName = baseName.substring(0, lastDotIndex);
                      }
                  }
     
                  if (isSameFolder) {
                      baseName = `${baseName} - 副本`;
                  }
                  
                  const newName = getUniqueName(baseName, ext);
                  const destinationPath = `${path}${separator}${newName}`;
                  
                  await copyItem(item.path, destinationPath);
              }
              
              await fetchFiles(path, currentViewMode === 'dashboard' ? 2 : 1);
              showToast('粘贴成功');
          }
      } catch (err) {
          showToast('操作失败: ' + err.message, 'error');
          setRenamingName(null);
      }
  };

  if (!localStorage.getItem('rootPath') && !path) {
    return <WelcomeScreen onComplete={handleSetRoot} />;
  }

  return (
    <div 
        className="flex flex-col h-screen bg-transparent text-gray-800 font-sans selection:bg-primary-100 selection:text-primary-700"
        onContextMenu={(e) => handleContextMenu(e, null)}
        onClick={handleBackgroundClick}
    >
      <TopBar 
        currentPath={currentPath} 
        onNavigate={handlePathNavigate}
        onReset={handleReset}
        depth={depth}
        onOpenSettings={() => setIsSettingsOpen(true)}
        viewMode={currentViewMode}
        onToggleView={handleToggleView}
        showHidden={showHidden}
        onToggleHidden={toggleShowHidden}
        sortConfig={sortConfig}
        onSortChange={setSortConfig}
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
            {currentViewMode === 'dashboard' ? (
                <DashboardView 
                    files={sortedFiles} 
                    onContextMenu={handleContextMenu}
                    isHidden={isHidden}
                    showHidden={showHidden}
                    folderColors={folderColors}
                    renamingName={renamingName}
                    onRenameSubmit={handleRenameSubmit}
                    selectedPaths={selectedPaths}
                    onFileClick={handleFileClick}
                    onFileDoubleClick={handleFileDoubleClick}
                />
            ) : currentViewMode === 'grid' ? (
                <FileGrid 
                    files={sortedFiles} 
                    onContextMenu={handleContextMenu}
                    isHidden={isHidden}
                    renamingName={renamingName}
                    onRenameSubmit={handleRenameSubmit}
                    folderColors={folderColors}
                    selectedPaths={selectedPaths}
                    onFileClick={handleFileClick}
                    onFileDoubleClick={handleFileDoubleClick}
                />
            ) : (
                <FileList 
                    files={sortedFiles} 
                    onContextMenu={handleContextMenu}
                    depth={depth}
                    isHidden={isHidden}
                    renamingName={renamingName}
                    onRenameSubmit={handleRenameSubmit}
                    folderColors={folderColors}
                    selectedPaths={selectedPaths}
                    onFileClick={handleFileClick}
                    onFileDoubleClick={handleFileDoubleClick}
                />
            )}
            
            {sortedFiles.length === 0 && !loading && currentViewMode !== 'dashboard' && (
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
        showToast={showToast}
      />

      <ContextMenu 
        x={contextMenu.x} 
        y={contextMenu.y} 
        file={contextMenu.file} 
        fileHidden={contextMenu.file ? isHidden(contextMenu.file.path) : false}
        onAction={handleMenuAction}
        onClose={() => setContextMenu({ x: null, y: null, file: null, selectedCount: 0 })}
        isLevel1={isRoot && !!contextMenu.file?.isDirectory && isTopLevelFolderPath(contextMenu.file.path)}
        hasClipboard={clipboard.length > 0}
        selectedCount={contextMenu.selectedCount || 0}
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
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
