import { Folder, File, FileImage, FileText, FileCode, EyeOff } from 'lucide-react';
import { getEffectiveColorScheme } from '../constants/theme';

const getFileIcon = (name, isDirectory, color = null) => {
    // Railway themed folder icon logic could go here later
    if (isDirectory) {
        // If color is present, use it for folder icon fill/stroke
        if (color) {
             // We can't easily dynamic class for fill in Lucide, so we rely on parent styling or use style prop
             // But actually, Lucide accepts classNames.
             // Let's use the color's text class for the folder icon
             return <Folder className={`${color.text} fill-current opacity-80`} size={48} strokeWidth={1} />;
        }
        return <Folder className="text-yellow-400 fill-yellow-100" size={48} strokeWidth={1} />;
    }
    
    const ext = name.split('.').pop().toLowerCase();
    switch (ext) {
        case 'png':
        case 'jpg':
        case 'jpeg':
        case 'gif':
            return <FileImage className="text-purple-500" size={48} strokeWidth={1} />;
        case 'txt':
        case 'md':
            return <FileText className="text-gray-500 dark:text-slate-300" size={48} strokeWidth={1} />;
        case 'js':
        case 'jsx':
        case 'ts':
        case 'tsx':
        case 'json':
            return <FileCode className="text-blue-500" size={48} strokeWidth={1} />;
        default:
            return <File className="text-gray-400 dark:text-slate-400" size={48} strokeWidth={1} />;
    }
};

export default function FileGrid({ files, onContextMenu, isHidden, renamingName, onRenameSubmit, folderColors, selectedPaths, onFileClick, onFileDoubleClick }) {
  return (
    <div className="flex flex-col h-full">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-4 p-6">
        {files.map((file, i) => {
            const hidden = isHidden ? isHidden(file.path) : false;
            const isRenaming = renamingName === file.name;
            const colorScheme = file.isDirectory ? getEffectiveColorScheme(file.path, folderColors) : null;
            const isSelected = selectedPaths && selectedPaths.has(file.path);
            
            return (
                <div 
                key={i}
                onClick={(e) => !isRenaming && onFileClick && onFileClick(e, file)}
                onDoubleClick={(e) => !isRenaming && onFileDoubleClick && onFileDoubleClick(e, file)}
                onContextMenu={(e) => {
                    e.preventDefault(); // Prevent default context menu
                    e.stopPropagation(); // Stop propagation to parent
                    if (onContextMenu) onContextMenu(e, file);
                }}
                className={`
                    group flex flex-col items-center shadow-sm glass-effect
                    hover:shadow-xl hover:border-primary-200 dark:hover:border-primary-500/40 cursor-pointer transition-all duration-300 ease-out
                    ${!isRenaming && 'hover:-translate-y-1'}
                    ${hidden ? 'opacity-40 grayscale border-dashed' : ''}
                    ${!isSelected && !hidden ? 'hover:bg-white/60 dark:hover:bg-slate-800/60' : ''}
                    ${isSelected ? 'bg-primary-100/80 dark:bg-primary-900/40 border-primary-300 dark:border-primary-700 ring-1 ring-primary-300 dark:ring-primary-700' : ''}
                    ${isRenaming ? 'ring-2 ring-primary-500 bg-white dark:bg-slate-800 !opacity-100' : ''}
                    ${colorScheme ? `${colorScheme.bg} ${colorScheme.border}` : ''}
                `}
                style={{
                    borderRadius: 'var(--radius-card)',
                    padding: 'var(--spacing-unit)',
                    backdropFilter: 'blur(var(--glass-blur))',
                    borderWidth: 'var(--border-width)',
                    borderColor: colorScheme ? undefined : `rgba(var(--border-color-rgb), var(--border-opacity))`
                }}
                >
                <div className="mb-4 transition-transform group-hover:scale-110 duration-300 relative">
                    {getFileIcon(file.name, file.isDirectory, colorScheme)}
                    {hidden && (
                        <div className="absolute -top-1 -right-1 bg-gray-200 dark:bg-slate-700 rounded-full p-0.5">
                            <EyeOff size={12} className="text-gray-500 dark:text-slate-200"/>
                        </div>
                    )}
                </div>
                
                {isRenaming ? (
                    <input
                        type="text"
                        defaultValue={file.name}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                e.target.blur();
                            } else if (e.key === 'Escape') {
                                e.preventDefault();
                                onRenameSubmit(file, file.name); // Cancel
                            }
                        }}
                        onBlur={(e) => onRenameSubmit(file, e.target.value)}
                        onFocus={(e) => {
                            // Select filename without extension if possible, or just all
                            const dotIndex = file.name.lastIndexOf('.');
                            if (dotIndex > 0 && !file.isDirectory) {
                                e.target.setSelectionRange(0, dotIndex);
                            } else {
                                e.target.select();
                            }
                        }}
                        className="w-full text-center text-sm px-1 py-0.5 border border-primary-500 rounded bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-0"
                    />
                ) : (
                    <span className="text-sm text-center text-gray-700 dark:text-slate-200 font-medium break-all line-clamp-2 w-full px-1 leading-tight group-hover:text-primary-800 dark:group-hover:text-primary-200 transition-colors">
                        {file.name}
                    </span>
                )}
                </div>
            );
        })}
        </div>
    </div>
  );
}
