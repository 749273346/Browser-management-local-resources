import { Folder, File, FileImage, FileText, FileCode, EyeOff } from 'lucide-react';

const getFileIcon = (name, isDirectory) => {
    // Railway themed folder icon logic could go here later
    if (isDirectory) return <Folder className="text-primary-500 fill-primary-50" size={48} strokeWidth={1.5} />;
    
    const ext = name.split('.').pop().toLowerCase();
    switch (ext) {
        case 'png':
        case 'jpg':
        case 'jpeg':
        case 'gif':
            return <FileImage className="text-purple-500" size={48} strokeWidth={1.5} />;
        case 'txt':
        case 'md':
            return <FileText className="text-gray-500" size={48} strokeWidth={1.5} />;
        case 'js':
        case 'jsx':
        case 'ts':
        case 'tsx':
        case 'json':
            return <FileCode className="text-blue-500" size={48} strokeWidth={1.5} />;
        default:
            return <File className="text-gray-400" size={48} strokeWidth={1.5} />;
    }
};

export default function FileGrid({ files, onNavigate, onContextMenu, isHidden }) {
  return (
    <div className="flex flex-col h-full">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-4 p-6">
        {files.map((file, i) => {
            const hidden = isHidden ? isHidden(file.path) : false;
            return (
                <div 
                key={i}
                onClick={() => onNavigate(file)}
                onContextMenu={(e) => {
                    e.preventDefault(); // Prevent default context menu
                    e.stopPropagation(); // Stop propagation to parent
                    if (onContextMenu) onContextMenu(e, file);
                }}
                className={`
                    group flex flex-col items-center p-4 rounded-2xl border border-white/40 shadow-sm 
                    hover:shadow-xl hover:border-primary-200 cursor-pointer transition-all duration-300 ease-out
                    hover:-translate-y-1
                    backdrop-blur-[var(--glass-blur)]
                    ${hidden ? 'opacity-40 grayscale border-dashed' : 'bg-white/40 hover:bg-white/60'}
                `}
                >
                <div className="mb-4 transition-transform group-hover:scale-110 duration-300 relative">
                    {getFileIcon(file.name, file.isDirectory)}
                    {hidden && (
                        <div className="absolute -top-1 -right-1 bg-gray-200 rounded-full p-0.5">
                            <EyeOff size={12} className="text-gray-500"/>
                        </div>
                    )}
                </div>
                <span className="text-sm text-center text-gray-700 font-medium break-all line-clamp-2 w-full px-1 leading-tight group-hover:text-primary-800 transition-colors">
                    {file.name}
                </span>
                </div>
            );
        })}
        </div>
    </div>
  );
}
