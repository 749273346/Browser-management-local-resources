import { useState, useEffect, useRef } from 'react';
import { FolderPlus, FilePlus, RefreshCw, FolderOpen, Pencil, Trash2, EyeOff, FileText, X } from 'lucide-react';

export default function ContextMenu({ x, y, file, onAction, onClose }) {
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

  const MenuItem = ({ icon: Icon, label, onClick, danger = false }) => (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); onClose(); }}
      className={`w-full flex items-center px-3 py-2 text-sm text-left rounded-md transition-colors
        ${danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-primary-50 hover:text-primary-700'}
      `}
    >
      <Icon size={16} className="mr-3 opacity-70" />
      <span>{label}</span>
    </button>
  );

  const Separator = () => <div className="h-px bg-gray-200 my-1 mx-2"></div>;

  return (
    <div
      ref={menuRef}
      style={style}
      className="fixed z-50 w-56 bg-white/90 backdrop-blur-xl border border-white/40 shadow-2xl rounded-xl p-1.5 animate-fade-in origin-top-left"
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
          <MenuItem icon={EyeOff} label="停运/隐藏 (Ignore)" onClick={() => onAction('hide', file)} />
          <Separator />
          <MenuItem icon={Trash2} label="删除 (Delete)" onClick={() => onAction('delete', file)} danger />
        </>
      ) : (
        // Empty Space Context Menu
        <>
          <MenuItem icon={FolderPlus} label="新建文件夹 (New Folder)" onClick={() => onAction('new-folder')} />
          <Separator />
          <MenuItem icon={RefreshCw} label="刷新 (Refresh)" onClick={() => onAction('refresh')} />
        </>
      )}
    </div>
  );
}
