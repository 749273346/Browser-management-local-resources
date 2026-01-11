import { Folder, File, FileImage, FileText, FileCode, ChevronRight, ExternalLink, EyeOff } from 'lucide-react';

const getFileIcon = (name, isDirectory) => {
    if (isDirectory) return <Folder className="text-primary-500 fill-primary-50" size={24} />;
    
    const ext = name.split('.').pop().toLowerCase();
    switch (ext) {
        case 'png':
        case 'jpg':
        case 'jpeg':
        case 'gif':
            return <FileImage className="text-purple-500" size={24} />;
        case 'txt':
        case 'md':
            return <FileText className="text-gray-500" size={24} />;
        case 'js':
        case 'jsx':
        case 'ts':
        case 'tsx':
        case 'json':
            return <FileCode className="text-blue-500" size={24} />;
        default:
            return <File className="text-gray-400" size={24} />;
    }
};

export default function FileList({ files, onNavigate, onContextMenu, depth, isHidden }) {
  return (
    <div className="flex flex-col pb-2">
      <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider bg-white/50 backdrop-blur-md sticky top-0 border-b border-white/20 z-10">
        {depth === 1 ? '内容列表' : '文件列表'}
      </div>
      
      <div className="p-2 space-y-1">
        {files.map((file, i) => {
          const hidden = isHidden ? isHidden(file.path) : false;
          return (
              <div 
              key={i}
              onClick={() => onNavigate(file)}
              onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (onContextMenu) onContextMenu(e, file);
              }}
              className={`group flex items-center p-3 rounded-xl cursor-pointer transition-colors border hover:border-white/40
                ${hidden ? 'opacity-40 grayscale border-dashed border-gray-300 hover:bg-white/30' : 'border-transparent hover:bg-white/60'}
              `}
              >
              <div className="mr-4 text-gray-400 group-hover:text-gray-600 transition-transform group-hover:scale-110 relative">
                  {getFileIcon(file.name, file.isDirectory)}
                  {hidden && (
                    <div className="absolute -top-1 -right-1 bg-gray-200 rounded-full p-0.5">
                      <EyeOff size={10} className="text-gray-500" />
                    </div>
                  )}
              </div>
              
              <span className="flex-1 text-sm text-gray-700 font-medium truncate group-hover:text-primary-800">
                  {file.name}
              </span>

              {file.isDirectory && depth === 1 ? (
                  <ChevronRight size={16} className="text-gray-300 group-hover:text-primary-400" />
              ) : (
                  <ExternalLink size={14} className="text-gray-300 group-hover:text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
              </div>
          );
        })}
      </div>
    </div>
  );
}
