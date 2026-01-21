import { useEffect, useRef } from 'react';
import { FolderPlus, FilePlus, FolderOpen, Pencil, Trash2, EyeOff, Eye, Info, FileType, FileText, Copy, Clipboard, FilePieChart, Sheet } from 'lucide-react';
import { COLUMN_COLORS } from '../constants/theme';

export default function ContextMenu({ x, y, file, onAction, onClose, fileHidden, isLevel1, hasClipboard, selectedCount = 1, sourceType = null }) {
  const menuRef = useRef(null);
  const isMulti = selectedCount > 1;
  const isDir = !!file?.isDirectory || Array.isArray(file?.children);

  useEffect(() => {
    menuRef.current?.focus();
  }, [x, y]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleKeyDown = (e) => {
    const key = String(e.key || '').toLowerCase();
    const isCopy = (e.ctrlKey || e.metaKey) && key === 'c';
    const isPaste = (e.ctrlKey || e.metaKey) && key === 'v';

    if (isCopy) {
      e.preventDefault();
      e.stopPropagation();
      if (file && !file.isVirtual && sourceType !== 'content') onAction('copy', file);
      onClose();
      return;
    }

    if (isPaste) {
      e.preventDefault();
      e.stopPropagation();
      if (file && (isDir || sourceType === 'content') && !file.isVirtual) {
        onAction('paste', file);
      } else {
        onAction('paste');
      }
      onClose();
      return;
    }

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const buttons = menuRef.current.querySelectorAll('button');
      const currentIndex = Array.from(buttons).indexOf(document.activeElement);
      let nextIndex;
      
      if (currentIndex === -1) {
        nextIndex = 0;
      } else if (e.key === 'ArrowDown') {
        nextIndex = (currentIndex + 1) % buttons.length;
      } else {
        nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
      }
      
      buttons[nextIndex]?.focus();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (x === null || y === null) return null;

  // Adjust position if it goes off screen (simple logic)
  const style = {
    top: y,
    left: x,
  };

  const MenuItem = ({ icon: Icon, label, onClick, danger = false, disabled = false, className = '' }) => (
    <button
      onClick={(e) => { 
        if (disabled) return;
        e.stopPropagation(); 
        onClick(); 
        onClose(); 
      }}
      disabled={disabled}
      className={`w-full flex items-center px-3 py-2 text-sm text-left rounded-md transition-colors
        ${danger ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30' : 
          disabled ? 'text-gray-400 cursor-not-allowed' :
          'text-gray-700 dark:text-slate-200 hover:bg-primary-50 dark:hover:bg-primary-500/10 hover:text-primary-700 dark:hover:text-primary-200'}
        ${className}
      `}
    >
      <Icon size={16} className={`mr-3 ${disabled ? 'opacity-40' : 'opacity-70'}`} />
      <span>{label}</span>
    </button>
  );

  const Separator = () => <div className="h-px bg-gray-200 dark:bg-slate-700 my-1 mx-2"></div>;
  const MenuHeader = ({ title }) => <div className="px-3 py-1 text-xs font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-wider">{title}</div>;

  const showContentMenu = sourceType === 'content' && file;

  return (
    <div
      ref={menuRef}
      style={style}
      className="fixed z-50 w-64 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-2xl rounded-xl p-1.5 animate-fade-in origin-top-left focus:outline-none"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {showContentMenu ? (
         // Content Area Context Menu (New, Paste inside folder)
         <>
           <div className="px-3 py-2 mb-1 text-xs font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider truncate">
              {file.name}
           </div>
           <MenuItem icon={Clipboard} label="粘贴 (Paste)" onClick={() => onAction('paste', file)} disabled={!hasClipboard || file.isVirtual} />
           <MenuItem icon={Copy} label="复制此文件夹 (Copy)" onClick={() => onAction('copy', file)} disabled={file.isVirtual} />
           <Separator />
           <MenuHeader title="新建 (New)" />
           <MenuItem icon={FolderPlus} label="文件夹 (Folder)" onClick={() => onAction('new-folder', file)} />
           <MenuItem icon={FileText} label="文本文档 (.txt)" onClick={() => onAction('new-file-txt', file)} />
           <MenuItem icon={FileType} label="Word 文档 (.docx)" onClick={() => onAction('new-file-docx', file)} />
           <MenuItem icon={Sheet} label="Excel 表格 (.xlsx)" onClick={() => onAction('new-file-xlsx', file)} />
           <MenuItem icon={FilePlus} label="PPT 演示文稿 (.pptx)" onClick={() => onAction('new-file-pptx', file)} />
         </>
      ) : file ? (
        // File/Folder Context Menu
        <>
          <div className="px-3 py-2 mb-1 text-xs font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider truncate">
             {isMulti ? `已选择 ${selectedCount} 项` : file.name}
          </div>
          {!isMulti && isDir && !file.isVirtual && (
             <MenuItem icon={FolderOpen} label="打开 (Open)" onClick={() => onAction('open', file)} />
          )}
          {!isMulti && isDir && (
            <MenuItem icon={Clipboard} label="粘贴到此处 (Paste)" onClick={() => onAction('paste', file)} disabled={!hasClipboard || file.isVirtual} />
          )}
          <MenuItem icon={Copy} label={`复制 ${isMulti ? selectedCount + ' 项' : ''} (Copy)`} onClick={() => onAction('copy', file)} disabled={file.isVirtual} />
          <MenuItem 
            icon={fileHidden ? Eye : EyeOff} 
            label={fileHidden ? "取消停运 (Restore)" : "停运/隐藏 (Ignore)"} 
            onClick={() => onAction('hide', file)} 
          />
          {!isMulti && <MenuItem icon={Pencil} label="重命名 (Rename)" onClick={() => onAction('rename', file)} disabled={file.isVirtual} />}
          {(isLevel1 || file.isVirtual) && isDir && (
             <div className="px-3 py-2">
                 <div className="text-xs font-semibold text-gray-400 dark:text-slate-400 mb-2 uppercase tracking-wider">设置颜色 (Color)</div>
                 <div className="flex space-x-2">
                     {COLUMN_COLORS.map(color => (
                         <button
                             key={color.id}
                             className={`w-5 h-5 rounded-full border border-gray-300 dark:border-gray-600 ${color.bg.split(' ')[0]} hover:scale-110 transition-transform`}
                             title={color.name}
                             onClick={(e) => {
                                 e.stopPropagation();
                                 onAction('set-color', file, color.id);
                                 onClose();
                             }}
                         />
                     ))}
                     <button
                         className="w-5 h-5 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 flex items-center justify-center hover:scale-110 transition-transform"
                         title="默认"
                         onClick={(e) => {
                             e.stopPropagation();
                             onAction('set-color', file, null);
                             onClose();
                         }}
                     >
                         <span className="w-3 h-px bg-gray-400 rotate-45"></span>
                     </button>
                 </div>
                 <div className="h-px bg-gray-200 dark:bg-slate-700 my-2 mx-[-12px]"></div>
             </div>
          )}
          <MenuItem icon={Info} label="属性 (Properties)" onClick={() => onAction('properties', file)} disabled={file.isVirtual} />
          <Separator />
          <MenuItem icon={Trash2} label={`删除 ${isMulti ? selectedCount + ' 项' : ''} (Delete)`} onClick={() => onAction('delete', file)} danger disabled={file.isVirtual} />
        </>
      ) : (
        // Empty Space Context Menu (Global)
        <>
          <MenuItem icon={Clipboard} label="粘贴 (Paste)" onClick={() => onAction('paste')} disabled={!hasClipboard} />
          <Separator />
          <MenuHeader title="新建 (New)" />
          <MenuItem icon={FolderPlus} label="文件夹 (Folder)" onClick={() => onAction('new-folder')} />
          <MenuItem icon={FileText} label="文本文档 (.txt)" onClick={() => onAction('new-file-txt')} />
          <MenuItem icon={FileType} label="Word 文档 (.docx)" onClick={() => onAction('new-file-docx')} />
          <MenuItem icon={FilePieChart} label="Excel 表格 (.xlsx)" onClick={() => onAction('new-file-xlsx')} />
          <MenuItem icon={FilePlus} label="PPT 演示文稿 (.pptx)" onClick={() => onAction('new-file-pptx')} />
        </>
      )}
    </div>
  );
}
