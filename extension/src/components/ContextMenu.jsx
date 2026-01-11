import { useState, useEffect, useRef } from 'react';
import { FolderPlus, FilePlus, RefreshCw, FolderOpen, Pencil, Trash2, EyeOff, Eye, Info, FileSpreadsheet, FileType } from 'lucide-react';

export default function ContextMenu({ x, y, file, onAction, onClose, fileHidden }) {
  const menuRef = useRef(null);

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

  if (x === null || y === null) return null;

  // Adjust position if it goes off screen (simple logic)
  const style = {
    top: y,
    left: x,
  };

  const MenuItem = ({ icon: Icon, label, onClick, danger = false, className = '' }) => (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); onClose(); }}
      className={`w-full flex items-center px-3 py-2 text-sm text-left rounded-md transition-colors
        ${danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-primary-50 hover:text-primary-700'}
        ${className}
      `}
    >
      <Icon size={16} className="mr-3 opacity-70" />
      <span>{label}</span>
    </button>
  );

  const Separator = () => <div className="h-px bg-gray-200 my-1 mx-2"></div>;
  const MenuHeader = ({ title }) => <div className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</div>;

  return (
    <div
      ref={menuRef}
      style={style}
      className="fixed z-50 w-64 bg-white/90 backdrop-blur-xl border border-white/40 shadow-2xl rounded-xl p-1.5 animate-fade-in origin-top-left"
    >
      {file ? (
        // File/Folder Context Menu
        <>
          <div className="px-3 py-2 mb-1 text-xs font-bold text-gray-400 uppercase tracking-wider truncate">
             {file.name}
          </div>
          {file.isDirectory && (
             <MenuItem icon={FolderOpen} label="打开 (Open)" onClick={() => onAction('open', file)} />
          )}
          <MenuItem icon={Pencil} label="重命名 (Rename)" onClick={() => onAction('rename', file)} />
          <MenuItem 
            icon={fileHidden ? Eye : EyeOff} 
            label={fileHidden ? "取消停运 (Restore)" : "停运/隐藏 (Ignore)"} 
            onClick={() => onAction('hide', file)} 
          />
          <MenuItem icon={Info} label="属性 (Properties)" onClick={() => onAction('properties', file)} />
          <Separator />
          <MenuItem icon={Trash2} label="删除 (Delete)" onClick={() => onAction('delete', file)} danger />
        </>
      ) : (
        // Empty Space Context Menu
        <>
          <MenuHeader title="新建 (New)" />
          <MenuItem icon={FolderPlus} label="文件夹 (Folder)" onClick={() => onAction('new-folder')} />
          <MenuItem icon={FileType} label="Word 文档 (.docx)" onClick={() => onAction('new-file-docx')} />
          <MenuItem icon={FileSpreadsheet} label="Excel 表格 (.xlsx)" onClick={() => onAction('new-file-xlsx')} />
          <MenuItem icon={FilePlus} label="PPT 演示文稿 (.pptx)" onClick={() => onAction('new-file-pptx')} />
          
          <Separator />
          <MenuItem icon={RefreshCw} label="刷新 (Refresh)" onClick={() => onAction('refresh')} />
        </>
      )}
    </div>
  );
}
