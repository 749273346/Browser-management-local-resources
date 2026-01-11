import { ChevronRight, Home, Settings } from 'lucide-react';

export default function TopBar({ currentPath, onNavigate, onReset, depth }) {
  // Simple path parsing logic (can be improved)
  const parts = currentPath ? currentPath.split(/[\\/]/).filter(Boolean) : [];
  
  // To avoid too long breadcrumbs, we might only show last 2-3 items
  // But for now let's show all and rely on overflow scrolling
  
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center shadow-sm sticky top-0 z-10 h-14">
      {/* Home Button / Reset */}
      <button 
        onClick={onReset}
        className="p-2 -ml-2 text-gray-500 hover:bg-surface-100 hover:text-primary-600 rounded-full transition-colors"
        title="Go to Root"
      >
        <Home size={18} />
      </button>

      {/* Breadcrumbs */}
      <div className="flex-1 flex items-center overflow-x-auto mx-2 scrollbar-hide text-sm mask-image-linear-to-r">
        {parts.map((part, index) => {
           // Reconstruct path for this part (naive implementation)
           // NOTE: This assumes Windows paths mostly. A real robust solution would need 
           // the full path map from history or robust path joining.
           // For simplicity in this demo, we might just display text or use the history stack if available.
           // Since we don't have the full path map easily here without passing complex props,
           // we will display the current folder name prominently.
           return null; 
        })}
        
        {/* Simplified Breadcrumb: Just Root > ... > Current */}
        <div className="flex items-center text-gray-600 whitespace-nowrap">
            <span className="opacity-50 mx-1">/</span>
            <span className="font-medium text-gray-900">{parts[parts.length - 1] || 'Root'}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-1">
        <div className="px-2 py-1 bg-surface-100 rounded-md text-xs font-medium text-primary-600">
            L{depth + 1}
        </div>
        <button 
            onClick={() => { if(confirm('Reset root path?')) { localStorage.removeItem('rootPath'); window.location.reload(); } }}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-surface-100 rounded-full transition-colors"
        >
            <Settings size={18} />
        </button>
      </div>
    </div>
  );
}
