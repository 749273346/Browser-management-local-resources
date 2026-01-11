import { useState, useEffect } from 'react';
import { X, Image as ImageIcon, Sliders, Info, Upload, Trash2, Check, Save } from 'lucide-react';
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

  // Initialize temp state when modal opens
  useEffect(() => {
      if (isOpen) {
          setTempBgImage(localStorage.getItem('bgImage') || '');
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
      if (tempBgImage) {
          root.style.setProperty('--bg-image', `url("${tempBgImage}")`);
      } else {
          root.style.setProperty('--bg-image', 'none');
      }
      localStorage.setItem('bgImage', tempBgImage);
      alert('背景已应用 (Background Applied)');
  };

  const handleThemeChange = (themeKey) => {
      applyTheme(themeKey);
      setCurrentTheme(themeKey);
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
                                        <button 
                                            onClick={handleSaveBackground}
                                            className="px-3 py-1.5 bg-primary-600 text-white shadow-sm rounded-lg text-xs font-medium hover:bg-primary-700 transition-colors flex items-center animate-pulse"
                                        >
                                            <Save size={14} className="mr-1"/> 确认更换
                                        </button>
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
