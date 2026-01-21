import { Folder, File, FileImage, FileText, FileCode, FileSpreadsheet, Film, Music, FileArchive, AppWindow, Link2, Database, FileType2, ChevronRight, ExternalLink, EyeOff } from 'lucide-react';
import { getEffectiveColorScheme } from '../constants/theme';

const getFileIcon = (name, isDirectory, color = null) => {
    if (isDirectory) {
        if (color) {
            return <Folder className={`${color.text} fill-current opacity-80`} size={24} strokeWidth={1} />;
        }
        return <Folder className="text-yellow-400 fill-yellow-100" size={24} strokeWidth={1} />;
    }
    
    const ext = name.includes('.') ? name.split('.').pop().toLowerCase() : '';

    if (['xls', 'xlsx', 'csv', 'tsv', 'ods', 'numbers'].includes(ext)) {
        return <FileSpreadsheet className="text-green-600" size={24} strokeWidth={1} />;
    }

    if (['doc', 'docx', 'pdf', 'txt', 'md', 'rtf', 'odt', 'ppt', 'pptx', 'key', 'pages', 'wps', 'dps'].includes(ext)) {
        return <FileText className="text-blue-500 dark:text-primary-300" size={24} strokeWidth={1} />;
    }

    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'tif', 'tiff', 'heic', 'heif', 'avif'].includes(ext)) {
        return <FileImage className="text-purple-500" size={24} strokeWidth={1} />;
    }

    if (['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm', 'm4v', '3gp'].includes(ext)) {
        return <Film className="text-red-500" size={24} strokeWidth={1} />;
    }

    if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma', 'opus'].includes(ext)) {
        return <Music className="text-pink-500" size={24} strokeWidth={1} />;
    }

    if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'zst', 'iso'].includes(ext)) {
        return <FileArchive className="text-amber-600" size={24} strokeWidth={1} />;
    }

    if (['exe', 'msi', 'bat', 'cmd', 'ps1', 'sh', 'app', 'apk', 'jar'].includes(ext)) {
        return <AppWindow className="text-emerald-600" size={24} strokeWidth={1} />;
    }

    if (['lnk', 'url'].includes(ext)) {
        return <Link2 className="text-indigo-600" size={24} strokeWidth={1} />;
    }

    if (['ttf', 'otf', 'woff', 'woff2'].includes(ext)) {
        return <FileType2 className="text-fuchsia-600" size={24} strokeWidth={1} />;
    }

    if (['db', 'sqlite', 'sqlite3', 'mdb', 'accdb'].includes(ext)) {
        return <Database className="text-cyan-600" size={24} strokeWidth={1} />;
    }

    if (['js', 'jsx', 'ts', 'tsx', 'json', 'html', 'css', 'scss', 'less', 'xml', 'yaml', 'yml', 'ini', 'toml', 'conf', 'log', 'py', 'java', 'c', 'cpp', 'h', 'hpp', 'cs', 'go', 'rs', 'php', 'rb', 'lua', 'sql', 'psd', 'ai'].includes(ext)) {
        return <FileCode className="text-sky-600" size={24} strokeWidth={1} />;
    }

    return <File className="text-gray-400 dark:text-slate-400" size={24} strokeWidth={1} />;
};

export default function FileList({ files, onContextMenu, depth, isHidden, renamingPath, onRenameSubmit, folderColors, selectedPaths, onFileClick, onFileDoubleClick }) {
  return (
    <div className="flex flex-col pb-2">
      <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider glass-effect sticky top-0 z-10">
        {depth === 1 ? '内容列表' : '文件列表'}
      </div>
      
      <div className="p-2 space-y-1">
        {files.map((file, i) => {
          const hidden = isHidden ? isHidden(file.path) : false;
          const isRenaming = renamingPath === file.path;
          const colorScheme = file.isDirectory ? getEffectiveColorScheme(file.path, folderColors) : null;
          const isSelected = selectedPaths && selectedPaths.has(file.path);

          return (
              <div 
              key={file.path || i}
              onClick={(e) => !isRenaming && onFileClick && onFileClick(e, file)}
              onDoubleClick={(e) => !isRenaming && onFileDoubleClick && onFileDoubleClick(e, file)}
              onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (onContextMenu) onContextMenu(e, file);
              }}
              className={`group flex items-center p-3 cursor-pointer transition-colors border hover:border-white/40 dark:hover:border-white/10
                ${hidden ? 'opacity-40 grayscale border-dashed border-gray-300 dark:border-slate-700 hover:bg-white/30 dark:hover:bg-slate-800/40' : ''}
                ${!isSelected && !hidden ? 'border-transparent hover:bg-white/60 dark:hover:bg-slate-800/60' : ''}
                ${isSelected ? 'bg-primary-100/80 dark:bg-primary-900/40 border-primary-300 dark:border-primary-700' : ''}
                ${isRenaming ? 'ring-1 ring-primary-500 bg-white dark:bg-slate-800' : ''}
                ${colorScheme ? `${colorScheme.bg} ${colorScheme.border}` : ''}
              `}
              style={{
                borderRadius: 'var(--radius-input)',
                borderWidth: 'var(--border-width)',
                borderColor: colorScheme ? undefined : (hidden || isSelected ? undefined : `rgba(var(--border-color-rgb), var(--border-opacity))`)
              }}
              >
              <div className="mr-4 text-gray-400 dark:text-slate-400 group-hover:text-gray-600 dark:group-hover:text-slate-200 transition-transform group-hover:scale-110 relative">
                  {getFileIcon(file.name, file.isDirectory, colorScheme)}
                  {hidden && (
                    <div className="absolute -top-1 -right-1 bg-gray-200 dark:bg-slate-700 rounded-full p-0.5">
                      <EyeOff size={10} className="text-gray-500 dark:text-slate-200" />
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
                              e.target.value = file.name;
                              e.target.blur();
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
                      className="flex-1 text-sm px-2 py-1 border border-primary-500 rounded bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-0 mr-2"
                  />
              ) : (
                  <span className="flex-1 text-sm text-gray-700 dark:text-slate-200 font-medium truncate group-hover:text-primary-800 dark:group-hover:text-primary-200">
                      {file.name}
                  </span>
              )}

              {file.isDirectory && depth === 1 ? (
                  <ChevronRight size={16} className="text-gray-300 dark:text-slate-600 group-hover:text-primary-400 dark:group-hover:text-primary-200" />
              ) : (
                  <ExternalLink size={14} className="text-gray-300 dark:text-slate-600 group-hover:text-primary-400 dark:group-hover:text-primary-200 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
              </div>
          );
        })}
      </div>
    </div>
  );
}
