import { useState, useRef, useEffect } from 'react';
import { Settings, Train, ChevronRight, LayoutGrid, List, Eye, EyeOff, Kanban, ArrowUpDown, Check } from 'lucide-react';
import Button from './Button';
import SearchBar from './SearchBar';

export default function TopBar({ currentPath, onNavigate, onReset, onOpenSettings, viewMode, onToggleView, showHidden, onToggleHidden, sortConfig, onSortChange }) {
  // Normalize path to use forward slashes for easier splitting, but keep track of original separator if possible
  // Actually, for display, just splitting by either is fine.
  const parts = currentPath ? currentPath.split(/[\\/]/).filter(Boolean) : [];

  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortRef.current && !sortRef.current.contains(event.target)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSortChange = (key) => {
    onSortChange({ ...sortConfig, key });
  };
  
  const getNextViewMode = () => {
    if (viewMode === 'dashboard') return 'grid';
    if (viewMode === 'grid') return 'list';
    return 'dashboard';
  };

  const getViewIcon = () => {
    if (viewMode === 'dashboard') return <Kanban size={20} />;
    if (viewMode === 'grid') return <LayoutGrid size={20} />;
    return <List size={20} />;
  };

  const getViewTitle = () => {
    if (viewMode === 'dashboard') return '切换到网格视图';
    if (viewMode === 'grid') return '切换到列表视图';
    return '切换到看板视图';
  };

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

  return (
    <div className="glass-effect px-6 py-3 flex items-center shadow-sm sticky top-0 z-10 h-16 transition-colors duration-300">
      {/* Home Button / Reset */}
      <button 
        onClick={onReset}
        className="p-2 -ml-2 text-primary-600 dark:text-primary-200 hover:bg-white/50 dark:hover:bg-slate-800/60 rounded-full transition-colors group"
        title="调度中心"
      >
        <Train size={24} strokeWidth={1.5} className="group-hover:scale-110 transition-transform" />
      </button>

      {/* Breadcrumbs */}
      <div className="flex-1 flex items-center overflow-x-auto mx-4 scrollbar-hide text-sm mask-image-linear-to-r">
        <div className="flex items-center text-gray-800 dark:text-slate-100 whitespace-nowrap drop-shadow-sm">
            {parts.map((part, index) => {
                const isLast = index === parts.length - 1;
                return (
                    <div key={index} className="flex items-center">
                        <button
                            onClick={() => !isLast && handleBreadcrumbClick(index)}
                            disabled={isLast}
                            className={`
                                px-2 py-1 transition-colors font-medium
                                ${isLast 
                                    ? 'text-primary-800 dark:text-primary-200 font-bold cursor-default' 
                                    : 'text-gray-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-slate-100 cursor-pointer'
                                }
                            `}
                            style={{ borderRadius: 'var(--radius-btn)' }}
                        >
                            {part}
                        </button>
                        {!isLast && (
                            <ChevronRight size={16} className="text-gray-400 dark:text-slate-500 mx-0.5" />
                        )}
                    </div>
                );
            })}
            {parts.length === 0 && (
                 <span className="font-medium text-lg text-primary-800 dark:text-primary-200">调度中心</span>
            )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2">
        <div className="mr-2">
            <SearchBar currentPath={currentPath} onNavigate={onNavigate} />
        </div>

        <Button
            onClick={onToggleHidden}
            variant={showHidden ? 'active' : 'secondary'}
            size="icon"
            title={showHidden ? '隐藏停运物资' : '显示停运物资'}
        >
            {showHidden ? <Eye size={20} /> : <EyeOff size={20} />}
        </Button>

        <Button
            onClick={() => onToggleView(getNextViewMode())}
            variant="secondary"
            size="icon"
            title={getViewTitle()}
        >
            {getViewIcon()}
        </Button>

        <div className="relative" ref={sortRef}>
            <Button
                onClick={() => setIsSortOpen(!isSortOpen)}
                variant={isSortOpen ? 'active' : 'secondary'}
                size="icon"
                title="排序"
            >
                <ArrowUpDown size={20} />
            </Button>
            
            {isSortOpen && sortConfig && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-xl shadow-lg border border-white/20 dark:border-slate-700/50 py-1 z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                        排序方式
                    </div>
                    {[
                        { key: 'name', label: '名称' },
                        { key: 'date', label: '修改日期' },
                        { key: 'type', label: '类型' },
                        { key: 'size', label: '大小' }
                    ].map(option => (
                        <button
                            key={option.key}
                            onClick={() => {
                                handleSortChange(option.key);
                                setIsSortOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 text-gray-700 dark:text-slate-200 transition-colors"
                        >
                            <span>{option.label}</span>
                            {sortConfig.key === option.key && (
                                <Check size={16} className="text-primary-600" />
                            )}
                        </button>
                    ))}
                    <div className="my-1 border-t border-gray-200 dark:border-slate-700/50"></div>
                    <button
                         onClick={() => {
                             onSortChange({ ...sortConfig, direction: 'asc' });
                             setIsSortOpen(false);
                         }}
                         className="w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 text-gray-700 dark:text-slate-200 transition-colors"
                    >
                        <span>升序</span>
                        {sortConfig.direction === 'asc' && <Check size={16} className="text-primary-600" />}
                    </button>
                    <button
                         onClick={() => {
                             onSortChange({ ...sortConfig, direction: 'desc' });
                             setIsSortOpen(false);
                         }}
                         className="w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 text-gray-700 dark:text-slate-200 transition-colors"
                    >
                        <span>降序</span>
                        {sortConfig.direction === 'desc' && <Check size={16} className="text-primary-600" />}
                    </button>
                </div>
            )}
        </div>

        <Button 
            onClick={onOpenSettings}
            variant="secondary"
            size="icon"
            title="个性化设置"
        >
            <Settings size={20} />
        </Button>
      </div>
    </div>
  );
}
