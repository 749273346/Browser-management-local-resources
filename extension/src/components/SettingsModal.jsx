import { useState, useEffect } from 'react';
import { X, Image as ImageIcon, Sliders, Info, Upload, Save, Folder, Sun, Moon, LogOut } from 'lucide-react';
import { themes, applyTheme, applyColorMode } from '../theme';
import Button from './Button';

const normalizeBgValue = (value) => {
  if (!value || value === 'none') return '';
  if (value.startsWith('url(')) {
    return value.replace(/^url\((['"]?)(.*)\1\)$/, '$2');
  }
  return value;
};

const PRESET_WALLPAPERS = [
  {
    name: '蒸汽时代 (粤汉铁路 KF型)',
    url: '/wallpapers/gz_steam_kf7.jpg?v=2'
  },
  {
    name: '内燃时代 (广州站 DF4B)',
    url: '/wallpapers/gz_diesel_df4b.jpg?v=2'
  },
  {
    name: '电力时代 (广深线 SS8)',
    url: '/wallpapers/gz_electric_ss8.jpg'
  },
  {
    name: '高铁时代 (和谐号 CRH1A)',
    url: '/wallpapers/gz_hsr_crh1a.jpg?v=3'
  },
  {
    name: '复兴号 (智能动车组 CR400AF-Z)',
    url: '/wallpapers/gz_hsr_fuxing.jpg?v=2'
  }
];

export default function SettingsModal({ isOpen, onClose, showToast }) {
  const [activeTab, setActiveTab] = useState('appearance');
  const SERVER_URL = 'http://localhost:3001';
  
  // Settings State
  const [bgImage, setBgImage] = useState(normalizeBgValue(localStorage.getItem('bgImage') || ''));
  const [tempBgImage, setTempBgImage] = useState(''); // For preview before saving
  const [glassOpacity, setGlassOpacity] = useState(localStorage.getItem('glassOpacity') || 0.8);
  const [glassBlur, setGlassBlur] = useState(localStorage.getItem('glassBlur') || 12);
  const [currentTheme, setCurrentTheme] = useState(localStorage.getItem('appTheme') || 'glass-morphism');
  const [colorMode, setColorMode] = useState(localStorage.getItem('colorMode') || 'day');
  const [customWallpapers, setCustomWallpapers] = useState(() => {
      try {
          return JSON.parse(localStorage.getItem('customWallpapers') || '[]');
      } catch {
          return [];
      }
  });
  const [hiddenPresetWallpapers, setHiddenPresetWallpapers] = useState(() => {
      try {
          return JSON.parse(localStorage.getItem('hiddenPresetWallpapers') || '[]');
      } catch {
          return [];
      }
  });
  const [wallpaperMenu, setWallpaperMenu] = useState({ x: null, y: null, url: '', isCustom: false, isPreset: false });
  
  // Directory State
  const [currentRoot, setCurrentRoot] = useState(localStorage.getItem('rootPath') || '');
  const [history, setHistory] = useState([]);

  // Initialize temp state when modal opens
  useEffect(() => {
      if (isOpen) {
          setTempBgImage(normalizeBgValue(localStorage.getItem('bgImage') || ''));
          setCurrentRoot(localStorage.getItem('rootPath') || '');
          setColorMode(localStorage.getItem('colorMode') || 'day');
          try {
              setCustomWallpapers(JSON.parse(localStorage.getItem('customWallpapers') || '[]'));
          } catch {
              setCustomWallpapers([]);
          }
          try {
              setHiddenPresetWallpapers(JSON.parse(localStorage.getItem('hiddenPresetWallpapers') || '[]'));
          } catch {
              setHiddenPresetWallpapers([]);
          }
          const savedHistory = JSON.parse(localStorage.getItem('pathHistory') || '[]');
          setHistory(savedHistory);
      }
  }, [isOpen]);

  // Apply changes live (except BG which needs confirmation)
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--glass-opacity', glassOpacity);
    root.style.setProperty('--glass-blur', `${glassBlur}px`);
    
    localStorage.setItem('glassOpacity', glassOpacity);
    localStorage.setItem('glassBlur', glassBlur);
  }, [glassOpacity, glassBlur]);

  const handleFileUpload = (e) => {
      const file = e.target.files[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setTempBgImage(reader.result);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSaveBackground = () => {
      const normalized = normalizeBgValue(tempBgImage);
      setBgImage(normalized);
      const root = document.documentElement;
      
      // Ensure we handle "none" properly for clearing background
      if (normalized) {
          root.style.setProperty('--bg-image', `url("${normalized}")`);
      } else {
          root.style.setProperty('--bg-image', 'none');
          setTempBgImage(''); // Reset temp state to empty string for UI consistency
      }
      
      // Save empty string to localStorage if "none" or empty
      localStorage.setItem('bgImage', normalized);

      let newCustomWallpapers = customWallpapers;

      if (normalized && normalized.startsWith('data:')) {
          setCustomWallpapers(prev => {
              const next = prev.includes(normalized) ? prev : [normalized, ...prev].slice(0, 18);
              localStorage.setItem('customWallpapers', JSON.stringify(next));
              newCustomWallpapers = next;
              return next;
          });
      }
      
      saveSettingsToServer({ 
          bgImage: normalized,
          customWallpapers: newCustomWallpapers
      }).catch(err => console.error('Failed to sync background settings:', err));
      
      // Feedback
      // In a real app we'd use a toast. For now, we can maybe use a small state or just reliance on visual change.
      // But user requested feedback.
      // Let's rely on the global UI feedback todo for a toast system later, or add a simple one here.
      if (showToast) {
          showToast('背景已成功应用！');
      } else {
          // Fallback if showToast is not provided (shouldn't happen if properly passed)
          // alert('背景已成功应用！');
      }
  };

  const handleThemeChange = (themeKey) => {
      applyTheme(themeKey);
      setCurrentTheme(themeKey);
      saveSettingsToServer({ appTheme: themeKey }).catch(err => console.error('Failed to sync theme settings:', err));
  };

  const handleModeChange = (mode) => {
      const resolved = applyColorMode(mode);
      setColorMode(resolved);
      applyTheme(currentTheme);
      saveSettingsToServer({ colorMode: resolved }).catch(err => console.error('Failed to sync color mode settings:', err));
  };

  const handleDeleteWallpaper = (url) => {
      const isCustom = customWallpapers.includes(url);
      const isPreset = PRESET_WALLPAPERS.some((wp) => wp.url === url);

      if (isCustom) {
          setCustomWallpapers(prev => {
              const next = prev.filter(u => u !== url);
              localStorage.setItem('customWallpapers', JSON.stringify(next));
              return next;
          });
      }

      if (isPreset) {
          setHiddenPresetWallpapers(prev => {
              if (prev.includes(url)) return prev;
              const next = [url, ...prev];
              localStorage.setItem('hiddenPresetWallpapers', JSON.stringify(next));
              return next;
          });
      }

      if (bgImage === url) {
          setBgImage('');
          const root = document.documentElement;
          root.style.setProperty('--bg-image', 'none');
          localStorage.setItem('bgImage', '');
      }

      if (tempBgImage === url) {
          setTempBgImage(bgImage === url ? '' : bgImage);
      }

      setWallpaperMenu({ x: null, y: null, url: '', isCustom: false, isPreset: false });
  };

  const handleClearBackground = (sourceUrl = '') => {
      const root = document.documentElement;
      root.style.setProperty('--bg-image', 'none');
      setBgImage('');
      localStorage.setItem('bgImage', '');
      saveSettingsToServer({ bgImage: '' }).catch(err => console.error('Failed to sync background settings:', err));

      if (tempBgImage === sourceUrl || tempBgImage) {
          setTempBgImage('');
      }

      setWallpaperMenu({ x: null, y: null, url: '', isCustom: false, isPreset: false });
  };

  const openWallpaperMenu = (e, url) => {
      e.preventDefault();
      e.stopPropagation();
      if (!url) return;
      const isCustom = customWallpapers.includes(url);
      const isPreset = PRESET_WALLPAPERS.some((wp) => wp.url === url);
      setWallpaperMenu({ x: e.clientX, y: e.clientY, url, isCustom, isPreset });
  };

  const saveSettingsToServer = async (overrides = {}) => {
      const settings = {
          rootPath: localStorage.getItem('rootPath'),
          folderColors: JSON.parse(localStorage.getItem('folderColors') || '{}'),
          folderViewModes: JSON.parse(localStorage.getItem('folderViewModes') || '{}'),
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
  };

  const handleChangeRoot = async () => {
      try {
          const res = await fetch(`${SERVER_URL}/api/pick-folder`, { method: 'POST' });
          const data = await res.json();
          if (!res.ok) {
              throw new Error(data?.error || 'Server error');
          }
          if (data.path) {
              const newPath = data.path;
              // Update history
              const newHistory = [newPath, ...history.filter(p => p !== newPath)].slice(0, 3);
              setHistory(newHistory);
              localStorage.setItem('pathHistory', JSON.stringify(newHistory));
              
              // Set new root
              localStorage.setItem('rootPath', newPath);
              setCurrentRoot(newPath);
              await saveSettingsToServer({ rootPath: newPath });
              
              if (confirm('目录已更改，需要刷新页面以生效。是否立即刷新？')) {
                  window.location.href = 'index.html';
              }
          }
      } catch (err) {
          const message = err?.message ? `无法更改目录：${err.message}` : '无法更改目录';
          if (showToast) showToast(message, 'error');
          else alert(message);
      }
  };

  const handleHistoryClick = (path) => {
      if (path === currentRoot) return;
      if (confirm(`切换到历史目录: ${path}?`)) {
          localStorage.setItem('rootPath', path);
          saveSettingsToServer({ rootPath: path }).catch(() => {});
          window.location.href = 'index.html';
      }
  };

  const handleLogout = () => {
      if (confirm('确定要退出当前资源库并返回初始界面吗？')) {
          localStorage.removeItem('rootPath');
          saveSettingsToServer({ rootPath: '' }).catch(() => {});
          window.location.href = 'index.html';
      }
  };

  if (!isOpen) return null;

  return (
    <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
        onContextMenuCapture={(e) => {
            // Allow context menu only on wallpapers
            if (e.target.closest('[data-is-wallpaper="true"]')) return;
            e.preventDefault();
            e.stopPropagation();
        }}
        onMouseDown={() => setWallpaperMenu({ x: null, y: null, url: '', isCustom: false, isPreset: false })}
    >
      {/* Context Menu - Moved outside of overflow-hidden container */}
      {wallpaperMenu.x !== null && wallpaperMenu.y !== null && (
          <div
              className="fixed z-[60] w-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-2xl rounded-xl p-1.5 animate-fade-in origin-top-left"
              style={{ left: wallpaperMenu.x, top: wallpaperMenu.y }}
              onMouseDown={(e) => e.stopPropagation()}
              onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
          >
              <button
                  className="w-full flex items-center px-3 py-2 text-sm text-left rounded-md transition-colors text-gray-700 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10"
                  onClick={() => handleClearBackground(wallpaperMenu.url)}
              >
                  清除背景
              </button>
              {(wallpaperMenu.isCustom || wallpaperMenu.isPreset) && (
                  <button
                      className="w-full flex items-center px-3 py-2 text-sm text-left rounded-md transition-colors text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                      onClick={() => handleDeleteWallpaper(wallpaperMenu.url)}
                  >
                      删除壁纸
                  </button>
              )}
              <button
                  className="w-full flex items-center px-3 py-2 text-sm text-left rounded-md transition-colors text-gray-700 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10"
                  onClick={() => setWallpaperMenu({ x: null, y: null, url: '', isCustom: false, isPreset: false })}
              >
                  取消
              </button>
          </div>
      )}

      <div
        className="glass-effect rounded-2xl shadow-2xl w-[600px] h-[550px] flex overflow-hidden border-0"
        onMouseDown={(e) => e.stopPropagation()}
        style={{
             backgroundColor: colorMode === 'night' ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)'
        }}
      >
        {/* Sidebar */}
        <div className="w-48 bg-gray-50/50 dark:bg-slate-950/50 border-r border-gray-200 dark:border-slate-800 p-4 flex flex-col backdrop-blur-sm">
            <h2 className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-4 px-2">设置</h2>
            
            <div className="flex flex-col space-y-2">
                <Button 
                    variant="ghost" 
                    active={activeTab === 'appearance'}
                    onClick={() => setActiveTab('appearance')}
                    className="w-full !justify-start"
                    icon={ImageIcon}
                >
                    外观设置
                </Button>
                <Button 
                    variant="ghost" 
                    active={activeTab === 'directory'}
                    onClick={() => setActiveTab('directory')}
                    className="w-full !justify-start"
                    icon={Folder}
                >
                    目录管理
                </Button>
                <Button 
                    variant="ghost" 
                    active={activeTab === 'tweaks'}
                    onClick={() => setActiveTab('tweaks')}
                    className="w-full !justify-start"
                    icon={Sliders}
                >
                    视觉微调
                </Button>
                <Button 
                    variant="ghost" 
                    active={activeTab === 'about'}
                    onClick={() => setActiveTab('about')}
                    className="w-full !justify-start"
                    icon={Info}
                >
                    关于
                </Button>
            </div>

            <div className="mt-auto pt-3">
                <Button
                    onClick={() => handleModeChange(colorMode === 'night' ? 'day' : 'night')}
                    variant="secondary"
                    size="icon"
                    title={colorMode === 'night' ? '切换到白天模式' : '切换到黑夜模式'}
                >
                    {colorMode === 'night' ? <Sun size={18} /> : <Moon size={18} />}
                </Button>
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col relative">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-slate-200 transition-colors z-10">
                <X size={24} />
            </button>

            <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
                {activeTab === 'appearance' && (
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 uppercase tracking-wider mb-4">界面风格</h3>
                            <div className="grid grid-cols-3 gap-3">
                                {Object.entries(themes).map(([key, theme]) => (
                                    <button
                                        key={key}
                                        onClick={() => handleThemeChange(key)}
                                        className={`
                                            p-3 rounded-xl border-2 text-left transition-all relative overflow-hidden group
                                            ${currentTheme === key ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/15' : 'border-transparent bg-gray-50 hover:bg-gray-100 dark:bg-slate-800/60 dark:hover:bg-slate-800'}
                                        `}
                                    >
                                        <div className="mb-2 h-12 w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden relative shadow-sm">
                                            {/* Mini Preview of Theme Style */}
                                            {theme.type === 'glass' && (
                                                <div className="absolute inset-2 rounded bg-primary-100/50 backdrop-blur-sm border border-white/40"></div>
                                            )}
                                            {theme.type === 'flat' && (
                                                <div className="absolute inset-2 rounded-sm bg-gray-100 dark:bg-slate-800"></div>
                                            )}
                                            {theme.type === 'classic' && (
                                                <div className="absolute inset-2 rounded bg-gradient-to-b from-white to-gray-50 border border-gray-300"></div>
                                            )}
                                        </div>
                                        <div className="text-xs font-medium text-gray-700 dark:text-slate-200">{theme.name}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 uppercase tracking-wider mb-4">背景壁纸</h3>
                            
                            {/* Preview Area */}
                            <div
                                className="mb-4 relative h-40 w-full rounded-xl border-2 border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center"
                                onContextMenu={(e) => openWallpaperMenu(e, tempBgImage)}
                            >
                                {tempBgImage ? (
                                    <img src={tempBgImage} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-gray-400 dark:text-slate-400 text-sm">暂无预览</span>
                                )}
                                
                                <div className="absolute bottom-3 right-3 flex space-x-2">
                                    <label className="px-3 py-1.5 bg-white/90 dark:bg-slate-900/80 dark:text-slate-200 backdrop-blur shadow-sm rounded-lg text-xs font-medium cursor-pointer hover:bg-white dark:hover:bg-slate-900 transition-colors flex items-center">
                                        <Upload size={14} className="mr-1"/> 选择图片
                                        <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                                    </label>
                                    
                                    {tempBgImage !== bgImage && (
                                        <>
                                            <Button 
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => setTempBgImage(bgImage)}
                                            >
                                                取消
                                            </Button>
                                            <Button 
                                                variant="primary"
                                                size="sm"
                                                onClick={handleSaveBackground}
                                                className="animate-pulse"
                                                icon={Save}
                                            >
                                                确认更换
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Presets */}
                            <div className="grid grid-cols-3 gap-3">
                                <button 
                                    onClick={() => setTempBgImage('')}
                                    className={`h-16 rounded-lg border-2 flex items-center justify-center bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-300 text-xs font-medium ${!tempBgImage ? 'border-primary-500' : 'border-transparent'}`}
                                >
                                    无背景
                                </button>
                                {customWallpapers.map((url, i) => (
                                    <button
                                        key={`custom-${i}`}
                                        data-wallpaper-url={url}
                                        onClick={() => setTempBgImage(url)}
                                        onContextMenu={(e) => openWallpaperMenu(e, url)}
                                        className={`h-16 rounded-lg border-2 bg-cover bg-center transition-all cursor-context-menu ${tempBgImage === url ? 'border-primary-500 ring-2 ring-primary-200' : 'border-transparent'}`}
                                        style={{ backgroundImage: `url("${url}")` }}
                                        title="自定义壁纸（右键删除）"
                                    />
                                ))}
                                {PRESET_WALLPAPERS.filter((wp) => !hiddenPresetWallpapers.includes(wp.url)).map((wp, i) => (
                                    <button
                                        key={i}
                                        data-wallpaper-url={wp.url}
                                        data-is-wallpaper="true"
                                        onClick={() => setTempBgImage(wp.url)}
                                        onContextMenu={(e) => openWallpaperMenu(e, wp.url)}
                                        className={`h-16 rounded-lg border-2 bg-cover bg-center transition-all cursor-context-menu ${tempBgImage === wp.url ? 'border-primary-500 ring-2 ring-primary-200' : 'border-transparent'}`}
                                        style={{ backgroundImage: `url("${wp.url}")` }}
                                        title={`${wp.name} (右键可删除)`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'directory' && (
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 uppercase tracking-wider mb-4">当前根目录</h3>
                            <div className="bg-gray-50 dark:bg-slate-800/60 p-4 rounded-xl border border-gray-200 dark:border-slate-700 flex flex-col space-y-3">
                                <div className="text-sm font-mono text-gray-600 dark:text-slate-300 break-all bg-white dark:bg-slate-900 p-2 rounded border border-gray-100 dark:border-slate-700">
                                    {currentRoot || '未设置'}
                                </div>
                                <Button 
                                    variant="primary"
                                    size="sm"
                                    onClick={handleChangeRoot}
                                    className="self-end"
                                    icon={Folder}
                                >
                                    更改目录
                                </Button>
                            </div>
                            
                            <Button 
                                variant="danger" 
                                className="w-full justify-center mt-2"
                                onClick={handleLogout}
                                icon={LogOut}
                            >
                                退出资源库
                            </Button>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 uppercase tracking-wider mb-4">最近使用</h3>
                            {history.length > 0 ? (
                                <div className="space-y-2">
                                    {history.map((path, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl hover:border-primary-200 dark:hover:border-primary-500/40 transition-colors group">
                                            <span className="text-xs text-gray-600 dark:text-slate-300 font-mono truncate flex-1 mr-4" title={path}>{path}</span>
                                            {path !== currentRoot && (
                                                <Button 
                                                    variant="active"
                                                    size="sm"
                                                    onClick={() => handleHistoryClick(path)}
                                                    className="opacity-0 group-hover:opacity-100"
                                                >
                                                    切换
                                                </Button>
                                            )}
                                            {path === currentRoot && (
                                                <span className="px-2 py-1 text-xs font-medium text-green-600 dark:text-green-300 bg-green-50 dark:bg-green-950/40 rounded-md">
                                                    当前
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-400 dark:text-slate-400 text-sm">暂无历史记录</div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'tweaks' && (
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 uppercase tracking-wider mb-4">界面透明度</h3>
                            <div className="flex items-center space-x-4">
                                <input 
                                    type="range" 
                                    min="0.1" 
                                    max="1" 
                                    step="0.05" 
                                    value={glassOpacity}
                                    onChange={(e) => setGlassOpacity(e.target.value)}
                                    className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
                                />
                                <span className="text-sm font-mono w-12 text-right text-gray-800 dark:text-slate-200">{Math.round(glassOpacity * 100)}%</span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">调整卡片和面板的背景不透明度。</p>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 uppercase tracking-wider mb-4">毛玻璃模糊度</h3>
                            <div className="flex items-center space-x-4">
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="30" 
                                    step="1" 
                                    value={glassBlur}
                                    onChange={(e) => setGlassBlur(e.target.value)}
                                    className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
                                />
                                <span className="text-sm font-mono w-12 text-right text-gray-800 dark:text-slate-200">{glassBlur}px</span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">调整背景模糊程度，数值越高越模糊。</p>
                        </div>
                    </div>
                )}

                {activeTab === 'about' && (
                    <div className="text-center py-4">
                        <div className="w-16 h-16 bg-primary-100 dark:bg-primary-500/15 text-primary-600 dark:text-primary-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Info size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">调度中心资源管理系统</h2>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Version 2.1.0 (High-Speed Edition)</p>
                        
                        <div className="mt-6 p-4 bg-gray-50 dark:bg-slate-800/60 rounded-xl text-left text-sm text-gray-600 dark:text-slate-300 space-y-3">
                            <div>
                                <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-1">单位</h4>
                                <p>惠州电务段汕头水电车间</p>
                            </div>
                            
                            <div>
                                <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-1">技术指导</h4>
                                <p>李海东、梁成欧、庄金旺、郭新城、洪映森</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <div>
                                    <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-1">作者</h4>
                                    <p>智轨先锋组</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-1">联系方式</h4>
                                    <p>电话：19119383440</p>
                                    <p>微信：yh19119383440</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 text-xs text-gray-400 dark:text-slate-500 border-t border-gray-100 dark:border-slate-800 pt-4">
                             <div className="flex justify-center space-x-4 mb-2">
                                <span className="flex items-center"><span className="mr-1">🚄</span> 广铁定制版</span>
                                <span className="flex items-center"><span className="mr-1">🎨</span> 个性化引擎</span>
                                <span className="flex items-center"><span className="mr-1">🛡️</span> 本地存储</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
