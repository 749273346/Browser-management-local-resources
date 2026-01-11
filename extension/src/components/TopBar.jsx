import { Home, Settings, Train, Palette, ChevronRight, LayoutGrid, List, Eye, EyeOff } from 'lucide-react';
import { applyTheme } from '../theme';

export default function TopBar({ currentPath, onNavigate, onReset, depth, onOpenSettings, viewMode, onToggleView, showHidden, onToggleHidden }) {
  // Normalize path to use forward slashes for easier splitting, but keep track of original separator if possible
  // Actually, for display, just splitting by either is fine.
  const parts = currentPath ? currentPath.split(/[\\/]/).filter(Boolean) : [];
  
  const handleBreadcrumbClick = (index) => {
      // Reconstruct path
      // Determine separator based on what's likely used in currentPath
      const separator = currentPath.includes('\\') ? '\\' : '/';
      
      let newPath = parts.slice(0, index + 1).join(separator);
      
      // Handle Windows drive root (e.g. "C:" -> "C:\")
      if (index === 0 && newPath.includes(':') && !newPath.endsWith(separator)) {
          newPath += separator;
      }
      
      // Handle Unix root (starts with /)
      if (currentPath.startsWith('/') && !newPath.startsWith('/')) {
          newPath = '/' + newPath;
      }
      
      onNavigate(newPath);
  };

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
        <div className="flex items-center text-gray-800 whitespace-nowrap drop-shadow-sm">
            {parts.map((part, index) => {
                const isLast = index === parts.length - 1;
                return (
                    <div key={index} className="flex items-center">
                        <button
                            onClick={() => !isLast && handleBreadcrumbClick(index)}
                            disabled={isLast}
                            className={`
                                px-2 py-1 rounded-md transition-colors font-medium
                                ${isLast 
                                    ? 'text-primary-800 font-bold cursor-default' 
                                    : 'text-gray-600 hover:bg-black/5 hover:text-gray-900 cursor-pointer'
                                }
                            `}
                        >
                            {part}
                        </button>
                        {!isLast && (
                            <ChevronRight size={16} className="text-gray-400 mx-0.5" />
                        )}
                    </div>
                );
            })}
            {parts.length === 0 && (
                 <span className="font-medium text-lg text-primary-800">调度中心</span>
            )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2">
        <button
            onClick={onToggleHidden}
            className={`p-2 rounded-full transition-colors ${showHidden ? 'text-primary-600 bg-primary-50' : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'}`}
            title={showHidden ? '隐藏停运物资' : '显示停运物资'}
        >
            {showHidden ? <Eye size={20} /> : <EyeOff size={20} />}
        </button>

        <button
            onClick={onToggleView}
            className="p-2 text-gray-600 hover:text-primary-700 hover:bg-white/50 rounded-full transition-colors"
            title={viewMode === 'grid' ? '切换到列表视图' : '切换到网格视图'}
        >
            {viewMode === 'grid' ? <List size={20} /> : <LayoutGrid size={20} />}
        </button>

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
