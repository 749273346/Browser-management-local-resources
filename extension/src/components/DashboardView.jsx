import { useEffect, useRef, useState } from 'react';
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

const TITLE_STYLES = {
    CLASSIC: { id: 'classic', label: '经典卡片' },
    GLASS: { id: 'glass', label: '毛玻璃' },
    MINIMAL: { id: 'minimal', label: '极简文字' },
    MODERN: { id: 'modern', label: '现代悬浮' }
};

const TITLE_COLORS = {
    BLUE: { id: 'blue', label: '谷歌蓝', from: 'from-blue-500', via: 'via-blue-600', to: 'to-blue-700', text: 'text-blue-600', ring: 'ring-blue-500' },
    RED: { id: 'red', label: '谷歌红', from: 'from-red-500', via: 'via-red-600', to: 'to-red-700', text: 'text-red-600', ring: 'ring-red-500' },
    YELLOW: { id: 'yellow', label: '谷歌黄', from: 'from-yellow-400', via: 'via-yellow-500', to: 'to-yellow-600', text: 'text-yellow-600', ring: 'ring-yellow-500' },
    GREEN: { id: 'green', label: '谷歌绿', from: 'from-green-500', via: 'via-green-600', to: 'to-green-700', text: 'text-green-600', ring: 'ring-green-500' },
    PURPLE: { id: 'purple', label: '表单紫', from: 'from-purple-500', via: 'via-purple-600', to: 'to-purple-700', text: 'text-purple-600', ring: 'ring-purple-500' },
    GRAY: { id: 'gray', label: '经典灰', from: 'from-slate-500', via: 'via-slate-600', to: 'to-slate-700', text: 'text-slate-600', ring: 'ring-slate-500' },
};

const DashboardTitle = ({ 
    title, 
    onTitleChange, 
    style = 'classic', 
    color = 'blue', 
    onStyleChange, 
    onColorChange 
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [localTitle, setLocalTitle] = useState(title);
    const [contextMenu, setContextMenu] = useState(null);
    const inputRef = useRef(null);

    useEffect(() => {
        setLocalTitle(title);
    }, [title]);

    useEffect(() => {
        if (!isEditing) return;
        inputRef.current?.focus();
        inputRef.current?.select();
    }, [isEditing]);

    useEffect(() => {
        const handleClickOutside = () => setContextMenu(null);
        if (contextMenu) {
            window.addEventListener('click', handleClickOutside);
            window.addEventListener('contextmenu', handleClickOutside);
        }
        return () => {
            window.removeEventListener('click', handleClickOutside);
            window.removeEventListener('contextmenu', handleClickOutside);
        };
    }, [contextMenu]);

    const canEdit = typeof onTitleChange === 'function';

    const submit = () => {
        setIsEditing(false);
        const next = (localTitle || '').trim();
        if (!next) {
            setLocalTitle(title);
            return;
        }
        if (next === title) return;
        onTitleChange(next);
    };

    const handleContextMenu = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY });
    };

    const colorConfig = Object.values(TITLE_COLORS).find(c => c.id === color) || TITLE_COLORS.BLUE;
    const isClassic = style === 'classic' || !style;
    const isGlass = style === 'glass';
    const isMinimal = style === 'minimal';
    const isModern = style === 'modern';

    const renderContent = () => {
        if (isEditing) {
            return (
                <input
                    ref={inputRef}
                    type="text"
                    value={localTitle}
                    onChange={(e) => setLocalTitle(e.target.value)}
                    onBlur={submit}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') submit();
                        if (e.key === 'Escape') {
                            setLocalTitle(title);
                            setIsEditing(false);
                        }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className={`
                        bg-transparent text-2xl font-bold text-center outline-none border-b-2 font-serif min-w-[320px] w-full
                        ${(isMinimal || isModern) ? 'text-gray-800 dark:text-white border-primary-500' : 'text-white border-white/50'}
                    `}
                />
            );
        }
        return (
            <h1 className={`
                text-2xl font-bold tracking-wide font-serif select-none transition-all
                ${(isMinimal || isModern) ? 'text-gray-800 dark:text-white' : 'text-white drop-shadow-lg'}
                ${isModern ? `bg-gradient-to-r ${colorConfig.from} ${colorConfig.via} ${colorConfig.to} bg-clip-text text-transparent` : ''}
            `}>
                {title}
            </h1>
        );
    };

    return (
        <div className="w-full flex justify-center mb-6 shrink-0 z-10 relative group">
            <div
                className={`relative transition-all duration-300 ${canEdit ? 'cursor-pointer' : ''} ${isEditing ? 'scale-100' : 'hover:scale-[1.01]'}`}
                onClick={() => canEdit && !isEditing && setIsEditing(true)}
                onContextMenu={handleContextMenu}
            >
                {/* Classic Style */}
                {isClassic && (
                    <div className={`
                        flex items-center justify-center px-16 py-3
                        bg-gradient-to-r ${colorConfig.from} ${colorConfig.via} ${colorConfig.to}
                        rounded-lg shadow-xl border border-white/10
                        min-w-[500px] relative overflow-hidden
                    `}>
                        <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
                        <div className="w-10 h-10 mr-4 relative z-10 flex items-center justify-center bg-white/10 rounded-full p-1 shadow-inner">
                            <img src="/icon.svg" alt="" className="w-full h-full object-contain drop-shadow-md" />
                        </div>
                        <div className="relative z-10">{renderContent()}</div>
                    </div>
                )}

                {/* Glass Style */}
                {isGlass && (
                    <div className={`
                        flex items-center justify-center px-12 py-3
                        backdrop-blur-xl bg-white/30 dark:bg-black/30
                        rounded-2xl shadow-lg border border-white/20
                        min-w-[400px] relative overflow-hidden
                    `}>
                        <div className={`absolute inset-0 opacity-10 bg-gradient-to-r ${colorConfig.from} ${colorConfig.via} ${colorConfig.to}`}></div>
                        <div className="w-10 h-10 mr-4 relative z-10 flex items-center justify-center bg-white/20 rounded-xl p-1 shadow-sm backdrop-blur-md">
                            <img src="/icon.svg" alt="" className="w-full h-full object-contain drop-shadow-sm" />
                        </div>
                        <div className="relative z-10">{renderContent()}</div>
                    </div>
                )}

                {/* Minimal Style */}
                {isMinimal && (
                    <div className="flex items-center justify-center px-8 py-2 min-w-[300px]">
                        <div className="mr-3 opacity-80">
                            <img src="/icon.svg" alt="" className="w-8 h-8 object-contain" />
                        </div>
                        {renderContent()}
                    </div>
                )}

                {/* Modern Style */}
                {isModern && (
                    <div className={`
                        flex items-center justify-center px-10 py-3
                        bg-white/80 dark:bg-slate-900/80 backdrop-blur-md
                        rounded-full shadow-md border border-white/40 dark:border-slate-700/50
                        min-w-[380px] hover:shadow-lg transition-shadow
                        ${colorConfig.ring} ring-1 ring-opacity-20
                    `}>
                        <div className="w-8 h-8 mr-3 relative z-10">
                            <img src="/icon.svg" alt="" className="w-full h-full object-contain" />
                        </div>
                        <div className="relative z-10">{renderContent()}</div>
                    </div>
                )}
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <div 
                    className="fixed z-50 bg-white/90 dark:bg-slate-800/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/20 dark:border-slate-700 py-1.5 min-w-[180px] animate-in fade-in zoom-in-95 duration-100 flex flex-col overflow-hidden select-none"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">标题样式</div>
                    {Object.values(TITLE_STYLES).map(s => (
                        <div 
                            key={s.id}
                            className={`px-4 py-2 text-sm cursor-pointer flex items-center justify-between ${style === s.id ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700'}`}
                            onClick={() => { onStyleChange && onStyleChange(s.id); setContextMenu(null); }}
                        >
                            {s.label}
                            {style === s.id && <div className="w-1.5 h-1.5 rounded-full bg-primary-500"></div>}
                        </div>
                    ))}
                    
                    <div className="my-1 border-t border-gray-200 dark:border-slate-700"></div>
                    <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">主题色</div>
                    <div className="px-3 py-1 grid grid-cols-6 gap-1 mb-1">
                        {Object.values(TITLE_COLORS).map(c => (
                            <div
                                key={c.id}
                                className={`w-6 h-6 rounded-full cursor-pointer bg-gradient-to-br ${c.from} ${c.to} shadow-sm ring-2 ring-offset-1 dark:ring-offset-slate-800 transition-transform hover:scale-110 ${color === c.id ? 'ring-gray-400 dark:ring-gray-500 scale-110' : 'ring-transparent'}`}
                                onClick={() => { onColorChange && onColorChange(c.id); setContextMenu(null); }}
                                title={c.label}
                            ></div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default function DashboardView({ files, currentPath, onContextMenu, isHidden, folderColors = {}, renamingName, onRenameSubmit, selectedPaths, onFileClick, onFileDoubleClick, columnCount = 4, dashboardTitle, onDashboardTitleChange, isRoot, dashboardTitleStyle, dashboardTitleColor, onDashboardTitleStyleChange, onDashboardTitleColorChange }) {
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
        <div className="flex flex-col h-full p-6 overflow-hidden">
            {/* Dashboard Title - Only on Root */}
            {isRoot && (
                <DashboardTitle 
                    title={dashboardTitle || '本地资源管理目录'} 
                    onTitleChange={onDashboardTitleChange}
                    style={dashboardTitleStyle}
                    color={dashboardTitleColor}
                    onStyleChange={onDashboardTitleStyleChange}
                    onColorChange={onDashboardTitleColorChange}
                />
            )}

            {/* Columns Container - Vertical Scroll */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pb-4">
                <div 
                    className="grid gap-6 w-full"
                    style={{
                        gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
                    }}
                >
                    {allColumns.map((folder, index) => {
                        let color = COLUMN_COLORS[index % COLUMN_COLORS.length];
                        const effective = folder.isVirtual 
                            ? getEffectiveColorScheme(currentPath, folderColors)
                            : getEffectiveColorScheme(folder.path, folderColors);
                        
                        if (effective) color = effective;
                        
                        // For virtual folder, we check if it is hidden (conceptually)
                        const hidden = isHidden ? isHidden(folder.path) : false;
                        
                        const children = folder.children || [];
                        const isFolderRenaming = renamingName === folder.name;
                        const isFolderSelected = selectedPaths && selectedPaths.has(folder.path);

                        return (
                            <div 
                                key={folder.path || index}
                                className={`
                                    w-full flex flex-col transition-all h-[600px] border shadow-sm backdrop-blur-md
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
