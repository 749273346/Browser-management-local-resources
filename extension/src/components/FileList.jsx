import { Folder, File, FileImage, FileText, FileCode, ChevronRight, ExternalLink } from 'lucide-react';

const getFileIcon = (name, isDirectory) => {
    if (isDirectory) return <Folder className="text-primary-500 fill-primary-50" size={20} />;
    
    const ext = name.split('.').pop().toLowerCase();
    switch (ext) {
        case 'png':
        case 'jpg':
        case 'jpeg':
        case 'gif':
            return <FileImage className="text-purple-500" size={20} />;
        case 'txt':
        case 'md':
            return <FileText className="text-gray-500" size={20} />;
        case 'js':
        case 'jsx':
        case 'ts':
        case 'tsx':
        case 'json':
            return <FileCode className="text-blue-500" size={20} />;
        default:
            return <File className="text-gray-400" size={20} />;
    }
};

export default function FileList({ files, onNavigate, depth }) {
  return (
    <div className="flex flex-col pb-2">
      <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider bg-surface-50 sticky top-0 border-b border-gray-100">
        {depth === 1 ? 'Select to Explore' : 'Click to Open'}
      </div>
      
      <div className="p-2 space-y-1">
        {files.map((file, i) => (
            <div 
            key={i}
            onClick={() => onNavigate(file)}
            className="group flex items-center p-3 rounded-lg hover:bg-surface-100 cursor-pointer transition-colors border border-transparent hover:border-surface-200"
            >
            <div className="mr-4 text-gray-400 group-hover:text-gray-600">
                {getFileIcon(file.name, file.isDirectory)}
            </div>
            
            <span className="flex-1 text-sm text-gray-700 font-medium truncate">
                {file.name}
            </span>

            {file.isDirectory && depth === 1 ? (
                <ChevronRight size={16} className="text-gray-300 group-hover:text-primary-400" />
            ) : (
                <ExternalLink size={14} className="text-gray-300 group-hover:text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
            </div>
        ))}
      </div>
    </div>
  );
}
