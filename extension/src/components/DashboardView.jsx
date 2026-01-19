import { Folder, File, FileImage, FileText, FileCode, ChevronRight, EyeOff } from 'lucide-react';
import { COLUMN_COLORS, getEffectiveColorScheme } from '../constants/theme';

const getFileIcon = (name, isDirectory) => {
    if (isDirectory) return <Folder className="text-primary-500 fill-primary-50" size={20} />;
    
    const ext = name.split('.').pop().toLowerCase();
    switch (ext) {
        case 'png': case 'jpg': case 'jpeg': case 'gif':
            return <FileImage className="text-purple-500" size={20} />;
        case 'txt': case 'md':
            return <FileText className="text-gray-500" size={20} />;
        case 'js': case 'jsx': case 'ts': case 'tsx': case 'json':
            return <FileCode className="text-blue-500" size={20} />;
        default:
            return <File className="text-gray-400" size={20} />;
    }
};

export default function DashboardView({ files, currentPath, onContextMenu, isHidden, folderColors = {}, renamingName, onRenameSubmit, selectedPaths, onFileClick, onFileDoubleClick }) {
    const folders = files.filter(f => f.isDirectory);
    const looseFiles = files.filter(f => !f.isDirectory);

    let allColumns = [...folders];
    
    // Create virtual folder for loose files if they exist
    if (looseFiles.length > 0) {
        const virtualFolder = {
            name: '文件',
            path: (currentPath || '') + '::__files__',
            isDirectory: true,
            isVirtual: true,
            children: looseFiles
        };
        // Insert at the beginning
        allColumns = [virtualFolder, ...folders];
    }

    const RenameInput = ({ file, className }) => (
        <input
            autoFocus
            type="text"
            defaultValue={file.name}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    onRenameSubmit(file, e.target.value);
                } else if (e.key === 'Escape') {
                    onRenameSubmit(file, file.name); // Cancel
                }
            }}
            onBlur={(e) => onRenameSubmit(file, e.target.value)}
            onFocus={(e) => {
                const dotIndex = file.name.lastIndexOf('.');
                if (dotIndex > 0 && !file.isDirectory) {
                    e.target.setSelectionRange(0, dotIndex);
                } else {
                    e.target.select();
                }
            }}
            className={`text-sm px-1 py-0.5 border border-primary-500 rounded bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-0 ${className}`}
        />
    );

    return (
        <div className="flex flex-col h-full p-6">
            {/* Columns Container */}
            <div className="flex-1 overflow-x-auto custom-scrollbar pb-4">
                <div className="flex space-x-6 min-w-max h-full">
                    {allColumns.map((folder, index) => {
                        let color = COLUMN_COLORS[index % COLUMN_COLORS.length];
                        const effective = getEffectiveColorScheme(folder.path, folderColors);
                        if (effective) color = effective;
                        
                        // For virtual folder, we check if it is hidden (conceptually)
                        // But since it's a virtual container, maybe we just check if its ID is in hidden list?
                        // But toggleHidden works on real paths.
                        // If we allowed 'hide' on virtual folder, it toggles 'path::__files__'.
                        // So isHidden(folder.path) should work if we toggled it.
                        const hidden = isHidden ? isHidden(folder.path) : false;
                        
                        const children = folder.children || [];
                        const isFolderRenaming = renamingName === folder.name;
                        const isFolderSelected = selectedPaths && selectedPaths.has(folder.path);

                        return (
                            <div 
                                key={folder.path || index}
                                className={`
                                    w-80 flex flex-col transition-all h-full max-h-full border shadow-sm backdrop-blur-md
                                    ${color.bg} ${color.border}
                                    ${hidden ? 'opacity-60 grayscale' : ''}
                                `}
                                style={{
                                    borderRadius: 'var(--radius-card)',
                                    backdropFilter: 'blur(var(--glass-blur))',
                                    borderWidth: 'var(--border-width)',
                                    borderColor: `rgba(var(--border-color-rgb), var(--border-opacity))`
                                }}
                            >
                                {/* Column Header */}
                                <div 
                                    className={`p-4 border-b ${color.border} ${color.header} flex items-center justify-between cursor-pointer group ${isFolderSelected ? 'ring-2 ring-primary-500 z-10' : ''}`}
                                    style={{ 
                                        borderTopLeftRadius: 'var(--radius-card)', 
                                        borderTopRightRadius: 'var(--radius-card)' 
                                    }}
                                    onClick={(e) => !isFolderRenaming && onFileClick && onFileClick(e, folder)}
                                    onDoubleClick={(e) => !isFolderRenaming && onFileDoubleClick && onFileDoubleClick(e, folder)}
                                    onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); if(onContextMenu) onContextMenu(e, folder); }}
                                >
                                    {isFolderRenaming ? (
                                        <RenameInput file={folder} className="flex-1 w-full text-lg font-bold" />
                                    ) : (
                                        <h3 className={`text-lg font-bold ${color.text} truncate flex-1 flex items-center`}>
                                            {folder.name}
                                            {hidden && <EyeOff size={16} className="ml-2 opacity-50"/>}
                                        </h3>
                                    )}
                                    {!isFolderRenaming && !folder.isVirtual && (
                                        <ChevronRight size={20} className={`${color.text} opacity-0 group-hover:opacity-100 transition-opacity`} />
                                    )}
                                </div>

                                {/* Column Content (List) */}
                                <div 
                                    className="flex-1 overflow-y-auto p-3 custom-scrollbar space-y-2"
                                    onContextMenu={(e) => { 
                                        e.preventDefault(); 
                                        e.stopPropagation(); 
                                        if(onContextMenu) onContextMenu(e, folder); 
                                    }}
                                >
                                    {children.length > 0 ? (
                                        children.map((child, childIndex) => {
                                            const childHidden = isHidden ? isHidden(child.path) : false;
                                            const isChildRenaming = renamingName === child.name;
                                            const isSelected = selectedPaths && selectedPaths.has(child.path);

                                            return (
                                                <div
                                                    key={childIndex}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (!isChildRenaming && onFileClick) onFileClick(e, child);
                                                    }}
                                                    onDoubleClick={(e) => {
                                                        e.stopPropagation();
                                                        if (!isChildRenaming && onFileDoubleClick) onFileDoubleClick(e, child);
                                                    }}
                                                    onContextMenu={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        if(onContextMenu) onContextMenu(e, child);
                                                    }}
                                                    className={`
                                                        flex items-center p-3 rounded-xl cursor-pointer transition-all border
                                                        ${childHidden ? 'opacity-50 grayscale border-dashed border-gray-400' : ''}
                                                        ${!isSelected && !childHidden ? 'bg-white/60 dark:bg-slate-800/60 border-transparent hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm hover:-translate-y-0.5' : ''}
                                                        ${isSelected ? 'bg-primary-100/80 dark:bg-primary-900/40 border-primary-300 dark:border-primary-700' : ''}
                                                        ${isChildRenaming ? 'ring-1 ring-primary-500 bg-white dark:bg-slate-800' : ''}
                                                    `}
                                                >
                                                    <div className="mr-3 text-gray-500 dark:text-slate-400">
                                                        {getFileIcon(child.name, child.isDirectory)}
                                                    </div>
                                                    {isChildRenaming ? (
                                                        <RenameInput file={child} className="flex-1 w-full min-w-0" />
                                                    ) : (
                                                        <span className="text-sm font-medium text-gray-700 dark:text-slate-200 truncate flex-1">
                                                            {child.name}
                                                        </span>
                                                    )}
                                                    {child.isDirectory && !isChildRenaming && (
                                                        <ChevronRight size={14} className="text-gray-400" />
                                                    )}
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="text-center py-8 text-gray-400 dark:text-slate-500 text-sm italic">
                                            (空)
                                        </div>
                                    )}
                                </div>
                                
                                {/* Column Footer */}
                                <div 
                                    className={`p-2 border-t ${color.border} bg-white/10 text-center`}
                                    style={{ 
                                        borderBottomLeftRadius: 'var(--radius-card)', 
                                        borderBottomRightRadius: 'var(--radius-card)' 
                                    }}
                                >
                                    <span className={`text-xs font-medium ${color.text} opacity-60`}>
                                        {children.length} 项
                                    </span>
                                </div>
                            </div>
                        );
                    })}

                    {allColumns.length === 0 && (
                        <div className="flex flex-col items-center justify-center w-full h-64 text-gray-500">
                            <span className="text-lg">暂无内容</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
