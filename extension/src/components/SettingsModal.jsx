import { useState, useEffect } from 'react';
import { X, Image as ImageIcon, Sliders, Info, Upload, Save, Folder } from 'lucide-react';
import { themes, applyTheme } from '../theme';

// CR-Guangzhou Wallpapers (Hosted or Base64 placeholders)
const PRESET_WALLPAPERS = [
    { name: '复兴号', url: 'https://images.unsplash.com/photo-1535557597501-0fee0a50433b?auto=format&fit=crop&q=80' },
    { name: '广州南站', url: 'https://images.unsplash.com/photo-1565626424177-832454523770?auto=format&fit=crop&q=80' },
    { name: '铁轨夕阳', url: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&q=80' },
];

export default function SettingsModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('appearance');
  
  // Settings State
  const [bgImage, setBgImage] = useState(localStorage.getItem('bgImage') || '');
  const [tempBgImage, setTempBgImage] = useState(''); // For preview before saving
  const [glassOpacity, setGlassOpacity] = useState(localStorage.getItem('glassOpacity') || 0.8);
  const [glassBlur, setGlassBlur] = useState(localStorage.getItem('glassBlur') || 12);
  const [currentTheme, setCurrentTheme] = useState(localStorage.getItem('appTheme') || 'high-speed');
  
  // Directory State
  const [currentRoot, setCurrentRoot] = useState(localStorage.getItem('rootPath') || '');
  const [history, setHistory] = useState([]);

  // Initialize temp state when modal opens
  useEffect(() => {
      if (isOpen) {
          setTempBgImage(localStorage.getItem('bgImage') || '');
          setCurrentRoot(localStorage.getItem('rootPath') || '');
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
      setBgImage(tempBgImage);
      const root = document.documentElement;
      
      // Ensure we handle "none" properly for clearing background
      if (tempBgImage && tempBgImage !== 'none') {
          root.style.setProperty('--bg-image', `url("${tempBgImage}")`);
      } else {
          root.style.setProperty('--bg-image', 'none');
          setTempBgImage(''); // Reset temp state to empty string for UI consistency
      }
      
      // Save empty string to localStorage if "none" or empty
      localStorage.setItem('bgImage', tempBgImage === 'none' ? '' : tempBgImage);
      
      // Feedback
      // In a real app we'd use a toast. For now, we can maybe use a small state or just reliance on visual change.
      // But user requested feedback.
      // Let's rely on the global UI feedback todo for a toast system later, or add a simple one here.
      alert('背景已成功应用！');
  };

  const handleThemeChange = (themeKey) => {
      applyTheme(themeKey);
      setCurrentTheme(themeKey);
  };

  const handleChangeRoot = async () => {
      try {
          const res = await fetch('http://localhost:3001/api/pick-folder', { method: 'POST' });
          const data = await res.json();
          if (data.path) {
              const newPath = data.path;
              // Update history
              const newHistory = [newPath, ...history.filter(p => p !== newPath)].slice(0, 3);
              setHistory(newHistory);
              localStorage.setItem('pathHistory', JSON.stringify(newHistory));
              
              // Set new root
              localStorage.setItem('rootPath', newPath);
              setCurrentRoot(newPath);
              
              if (confirm('目录已更改，需要刷新页面以生效。是否立即刷新？')) {
                  window.location.href = 'index.html';
              }
          }
      } catch (err) {
          alert('无法打开文件夹选择器');
      }
  };

  const handleHistoryClick = (path) => {
      if (path === currentRoot) return;
      if (confirm(`切换到历史目录: ${path}?`)) {
          localStorage.setItem('rootPath', path);
          window.location.href = 'index.html';
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-[600px] h-[550px] flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-48 bg-gray-50 border-r border-gray-200 p-4 flex flex-col space-y-2">
            <h2 className="text-lg font-bold text-gray-800 mb-4 px-2">设置</h2>
            
            <button 
                onClick={() => setActiveTab('appearance')}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'appearance' ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
                <ImageIcon size={18} />
                <span>外观设置</span>
            </button>
            <button 
                onClick={() => setActiveTab('directory')}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'directory' ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
                <Folder size={18} />
                <span>目录管理</span>
            </button>
            <button 
                onClick={() => setActiveTab('tweaks')}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'tweaks' ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
                <Sliders size={18} />
                <span>视觉微调</span>
            </button>
            <button 
                onClick={() => setActiveTab('about')}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'about' ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
                <Info size={18} />
                <span>关于</span>
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col relative">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                <X size={24} />
            </button>

            <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
                {activeTab === 'appearance' && (
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">主题色</h3>
                            <div className="grid grid-cols-3 gap-3">
                                {Object.entries(themes).map(([key, theme]) => (
                                    <button
                                        key={key}
                                        onClick={() => handleThemeChange(key)}
                                        className={`
                                            p-3 rounded-xl border-2 text-left transition-all
                                            ${currentTheme === key ? 'border-primary-500 bg-primary-50' : 'border-transparent bg-gray-50 hover:bg-gray-100'}
                                        `}
                                    >
                                        <div className="w-6 h-6 rounded-full mb-2" style={{ backgroundColor: theme.colors.primary }}></div>
                                        <div className="text-xs font-medium text-gray-700">{theme.name}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">背景壁纸</h3>
                            
                            {/* Preview Area */}
                            <div className="mb-4 relative h-40 w-full rounded-xl border-2 border-gray-200 bg-gray-100 overflow-hidden flex items-center justify-center">
                                {tempBgImage ? (
                                    <img src={tempBgImage} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-gray-400 text-sm">暂无预览</span>
                                )}
                                
                                <div className="absolute bottom-3 right-3 flex space-x-2">
                                    <label className="px-3 py-1.5 bg-white/90 backdrop-blur shadow-sm rounded-lg text-xs font-medium cursor-pointer hover:bg-white transition-colors flex items-center">
                                        <Upload size={14} className="mr-1"/> 选择图片
                                        <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                                    </label>
                                    
                                    {tempBgImage !== bgImage && (
                                        <>
                                            <button 
                                                onClick={() => setTempBgImage(bgImage)}
                                                className="px-3 py-1.5 bg-white/90 text-gray-700 shadow-sm rounded-lg text-xs font-medium hover:bg-white transition-colors flex items-center"
                                            >
                                                取消
                                            </button>
                                            <button 
                                                onClick={handleSaveBackground}
                                                className="px-3 py-1.5 bg-primary-600 text-white shadow-sm rounded-lg text-xs font-medium hover:bg-primary-700 transition-colors flex items-center animate-pulse"
                                            >
                                                <Save size={14} className="mr-1"/> 确认更换
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Presets */}
                            <div className="grid grid-cols-3 gap-3">
                                <button 
                                    onClick={() => setTempBgImage('')}
                                    className={`h-16 rounded-lg border-2 flex items-center justify-center bg-gray-100 text-gray-500 text-xs font-medium ${!tempBgImage ? 'border-primary-500' : 'border-transparent'}`}
                                >
                                    无背景
                                </button>
                                {PRESET_WALLPAPERS.map((wp, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setTempBgImage(wp.url)}
                                        className={`h-16 rounded-lg border-2 bg-cover bg-center transition-all ${tempBgImage === wp.url ? 'border-primary-500 ring-2 ring-primary-200' : 'border-transparent'}`}
                                        style={{ backgroundImage: `url(${wp.url})` }}
                                        title={wp.name}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'directory' && (
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">当前根目录</h3>
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col space-y-3">
                                <div className="text-sm font-mono text-gray-600 break-all bg-white p-2 rounded border border-gray-100">
                                    {currentRoot || '未设置'}
                                </div>
                                <button 
                                    onClick={handleChangeRoot}
                                    className="self-end px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors flex items-center"
                                >
                                    <Folder size={16} className="mr-2" />
                                    更改目录
                                </button>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">最近使用</h3>
                            {history.length > 0 ? (
                                <div className="space-y-2">
                                    {history.map((path, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl hover:border-primary-200 transition-colors group">
                                            <span className="text-xs text-gray-600 font-mono truncate flex-1 mr-4" title={path}>{path}</span>
                                            {path !== currentRoot && (
                                                <button 
                                                    onClick={() => handleHistoryClick(path)}
                                                    className="px-3 py-1 text-xs font-medium text-primary-600 bg-primary-50 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    切换
                                                </button>
                                            )}
                                            {path === currentRoot && (
                                                <span className="px-2 py-1 text-xs font-medium text-green-600 bg-green-50 rounded-md">
                                                    当前
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-400 text-sm">暂无历史记录</div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'tweaks' && (
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">界面透明度</h3>
                            <div className="flex items-center space-x-4">
                                <input 
                                    type="range" 
                                    min="0.1" 
                                    max="1" 
                                    step="0.05" 
                                    value={glassOpacity}
                                    onChange={(e) => setGlassOpacity(e.target.value)}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                                />
                                <span className="text-sm font-mono w-12 text-right">{Math.round(glassOpacity * 100)}%</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">调整卡片和面板的背景不透明度。</p>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">毛玻璃模糊度</h3>
                            <div className="flex items-center space-x-4">
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="30" 
                                    step="1" 
                                    value={glassBlur}
                                    onChange={(e) => setGlassBlur(e.target.value)}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                                />
                                <span className="text-sm font-mono w-12 text-right">{glassBlur}px</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">调整背景模糊程度，数值越高越模糊。</p>
                        </div>
                    </div>
                )}

                {activeTab === 'about' && (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Info size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">调度中心资源管理系统</h2>
                        <p className="text-sm text-gray-500 mt-2">Version 2.1.0 (High-Speed Edition)</p>
                        <div className="mt-8 p-4 bg-gray-50 rounded-xl text-left text-sm text-gray-600 space-y-2">
                            <p>🚄 <strong>广铁定制版</strong>：专为铁路职工打造的高效工具。</p>
                            <p>🎨 <strong>个性化引擎</strong>：支持自定义壁纸与透明度。</p>
                            <p>🛡️ <strong>安全隐私</strong>：所有配置仅保存在本地。</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
