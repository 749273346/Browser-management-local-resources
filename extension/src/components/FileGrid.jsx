import { Folder, File, FileImage, FileText, FileCode } from 'lucide-react';

const getFileIcon = (name, isDirectory) => {
    if (isDirectory) return <Folder className="text-primary-500 fill-primary-50" size={36} strokeWidth={1.5} />;
    
    const ext = name.split('.').pop().toLowerCase();
    switch (ext) {
        case 'png':
        case 'jpg':
        case 'jpeg':
        case 'gif':
            return <FileImage className="text-purple-500" size={36} strokeWidth={1.5} />;
        case 'txt':
        case 'md':
            return <FileText className="text-gray-500" size={36} strokeWidth={1.5} />;
        case 'js':
        case 'jsx':
        case 'ts':
        case 'tsx':
        case 'json':
            return <FileCode className="text-blue-500" size={36} strokeWidth={1.5} />;
        default:
            return <File className="text-gray-400" size={36} strokeWidth={1.5} />;
    }
};

export default function FileGrid({ files, onNavigate }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4 p-6">
      {files.map((file, i) => (
        <div 
          key={i}
          onClick={() => onNavigate(file)}
          className="group flex flex-col items-center p-4 bg-white rounded-xl border border-gray-100 shadow-card hover:shadow-card-hover hover:border-primary-200 cursor-pointer transition-all duration-200"
        >
          <div className="mb-3 transition-transform group-hover:scale-110 duration-200">
            {getFileIcon(file.name, file.isDirectory)}
          </div>
          <span className="text-xs text-center text-gray-700 font-medium break-all line-clamp-2 w-full px-1">
            {file.name}
          </span>
        </div>
      ))}
    </div>
  );
}
