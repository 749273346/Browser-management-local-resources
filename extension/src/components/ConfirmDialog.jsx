import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, confirmText = '确定', cancelText = '取消', type = 'danger' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-[400px] border border-white/20 dark:border-white/10 p-6 transform scale-100 animate-in fade-in zoom-in-95 duration-200"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start mb-4">
            <div className={`p-3 rounded-full mr-4 shrink-0 ${type === 'danger' ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'}`}>
                <AlertTriangle size={24} />
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-1">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed break-words">{message}</p>
            </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
            <button
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors border border-transparent"
            >
                {cancelText}
            </button>
            <button
                onClick={onConfirm}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors shadow-sm
                    ${type === 'danger' 
                        ? 'bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500' 
                        : 'bg-primary-600 hover:bg-primary-700'
                    }
                `}
            >
                {confirmText}
            </button>
        </div>
      </div>
    </div>
  );
}
