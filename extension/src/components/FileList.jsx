import { Folder, File, FileImage, FileText, FileCode, ChevronRight, ExternalLink, EyeOff } from 'lucide-react';

const getFileIcon = (name, isDirectory) => {
    if (isDirectory) return <Folder className="text-yellow-400 fill-yellow-100" size={24} strokeWidth={1} />;
    
    const ext = name.split('.').pop().toLowerCase();
    switch (ext) {
        case 'png':
        case 'jpg':
        case 'jpeg':
        case 'gif':
            return <FileImage className="text-purple-500" size={24} strokeWidth={1} />;
        case 'txt':
        case 'md':
            return <FileText className="text-gray-500 dark:text-slate-300" size={24} strokeWidth={1} />;
        case 'js':
        case 'jsx':
        case 'ts':
        case 'tsx':
        case 'json':
            return <FileCode className="text-blue-500" size={24} strokeWidth={1} />;
        default:
            return <File className="text-gray-400 dark:text-slate-400" size={24} strokeWidth={1} />;
    }
};

export default function FileList({ files, onNavigate, onContextMenu, depth, isHidden, renamingName, onRenameSubmit }) {
  return (
    <div className="flex flex-col pb-2">
      <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider bg-white/50 dark:bg-slate-900/60 backdrop-blur-md sticky top-0 border-b border-white/20 dark:border-white/10 z-10">
        {depth === 1 ? '内容列表' : '文件列表'}
      </div>
      
      <div className="p-2 space-y-1">
        {files.map((file, i) => {
          const hidden = isHidden ? isHidden(file.path) : false;
          const isRenaming = renamingName === file.name;

          return (
              <div 
              key={i}
              onClick={() => !isRenaming && onNavigate(file)}
              onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (onContextMenu) onContextMenu(e, file);
              }}
              className={`group flex items-center p-3 rounded-xl cursor-pointer transition-colors border hover:border-white/40 dark:hover:border-white/10
                ${hidden ? 'opacity-40 grayscale border-dashed border-gray-300 dark:border-slate-700 hover:bg-white/30 dark:hover:bg-slate-800/40' : 'border-transparent hover:bg-white/60 dark:hover:bg-slate-800/60'}
                ${isRenaming ? 'ring-1 ring-primary-500 bg-white dark:bg-slate-800' : ''}
              `}
              >
              <div className="mr-4 text-gray-400 dark:text-slate-400 group-hover:text-gray-600 dark:group-hover:text-slate-200 transition-transform group-hover:scale-110 relative">
                  {getFileIcon(file.name, file.isDirectory)}
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
                              onRenameSubmit(file, file.name);
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
