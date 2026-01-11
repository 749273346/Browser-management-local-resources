import { Home, Settings, Train, Palette } from 'lucide-react';
import { applyTheme } from '../theme';

export default function TopBar({ currentPath, onNavigate, onReset, depth, onOpenSettings }) {
  const parts = currentPath ? currentPath.split(/[\\/]/).filter(Boolean) : [];
  
  const cycleTheme = () => {
      const themes = ['high-speed', 'iron-spirit', 'history'];
      const current = localStorage.getItem('appTheme') || 'high-speed';
      const next = themes[(themes.indexOf(current) + 1) % themes.length];
      applyTheme(next);
  };

  return (
    <div className="bg-white/60 backdrop-blur-md border-b border-white/20 px-6 py-3 flex items-center shadow-sm sticky top-0 z-10 h-16 transition-colors duration-300">
      {/* Home Button / Reset */}
      <button 
        onClick={onReset}
        className="p-2 -ml-2 text-primary-600 hover:bg-white/50 rounded-full transition-colors group"
        title="调度中心"
      >
        <Train size={24} strokeWidth={1.5} className="group-hover:scale-110 transition-transform" />
      </button>

      {/* Breadcrumbs */}
      <div className="flex-1 flex items-center overflow-x-auto mx-4 scrollbar-hide text-sm mask-image-linear-to-r">
        {/* Simplified Breadcrumb for now */}
        <div className="flex items-center text-gray-800 whitespace-nowrap drop-shadow-sm">
            <span className="font-medium text-lg text-primary-800">{parts[parts.length - 1] || '调度中心'}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2">
        <button 
            onClick={onOpenSettings}
            className="p-2 text-gray-600 hover:text-primary-700 hover:bg-white/50 rounded-full transition-colors"
            title="个性化设置"
        >
            <Settings size={20} />
        </button>
      </div>
    </div>
  );
}
