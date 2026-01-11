import { Folder, File, FileImage, FileText, FileCode, EyeOff, Eye } from 'lucide-react';
import { useHiddenFiles } from '../hooks/useHiddenFiles';

const getFileIcon = (name, isDirectory) => {
    // Railway themed folder icon logic could go here later
    if (isDirectory) return <Folder className="text-primary-500 fill-primary-50" size={36} strokeWidth={1.5} />;
    
    const ext = name.split('.').pop().toLowerCase();
    switch (ext) {
        case 'png':
        case 'jpg':
        case 'jpeg':
        case 'gif':
            return <FileImage className="text-purple-500" size={36} strokeWidth={1.5} />;
        case 'txt':
        case 'md':
            return <FileText className="text-gray-500" size={36} strokeWidth={1.5} />;
        case 'js':
        case 'jsx':
        case 'ts':
        case 'tsx':
        case 'json':
            return <FileCode className="text-blue-500" size={36} strokeWidth={1.5} />;
        default:
            return <File className="text-gray-400" size={36} strokeWidth={1.5} />;
    }
};

export default function FileGrid({ files, onNavigate }) {
  const { isHidden, toggleHidden, showHidden, toggleShowHidden } = useHiddenFiles();

  // Filter files based on hidden state
  const displayedFiles = files.filter(file => showHidden || !isHidden(file.path));

  const handleContextMenu = (e, file) => {
      e.preventDefault();
      // Simple context menu logic: Toggle hidden state
      // In a real app, this would show a custom menu
      if (confirm(`Do you want to ${isHidden(file.path) ? 'unhide' : 'hide'} "${file.name}"?`)) {
          toggleHidden(file.path);
      }
  };

  return (
    <div className="flex flex-col h-full">
        <div className="flex justify-end px-6 pt-2">
            <button 
                onClick={toggleShowHidden}
                className="text-xs flex items-center text-gray-400 hover:text-primary-600 transition-colors"
            >
                {showHidden ? <Eye size={14} className="mr-1"/> : <EyeOff size={14} className="mr-1"/>}
                {showHidden ? '隐藏停运物资' : '显示停运物资'}
            </button>
        </div>
        
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4 p-6">
        {displayedFiles.map((file, i) => {
            const hidden = isHidden(file.path);
            return (
                <div 
                key={i}
                onClick={() => onNavigate(file)}
                onContextMenu={(e) => handleContextMenu(e, file)}
                className={`
                    group flex flex-col items-center p-4 rounded-xl border border-white/20 shadow-lg 
                    hover:shadow-xl hover:border-primary-200 cursor-pointer transition-all duration-200
                    backdrop-blur-[var(--glass-blur)]
                    ${hidden ? 'opacity-40 grayscale border-dashed' : ''}
                `}
                style={{
                    backgroundColor: `rgba(255, 255, 255, var(--glass-opacity))`
                }}
                >
                <div className="mb-3 transition-transform group-hover:scale-110 duration-200 relative">
                    {getFileIcon(file.name, file.isDirectory)}
                    {hidden && (
                        <div className="absolute -top-1 -right-1 bg-gray-200 rounded-full p-0.5">
                            <EyeOff size={12} className="text-gray-500"/>
                        </div>
                    )}
                </div>
                <span className="text-xs text-center text-gray-700 font-medium break-all line-clamp-2 w-full px-1">
                    {file.name}
                </span>
                </div>
            );
        })}
        </div>
    </div>
  );
}
