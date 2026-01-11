import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        if (onClose) setTimeout(onClose, 300); // Wait for fade out
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [message, duration, onClose]);

  if (!visible && !message) return null;

  const isSuccess = type === 'success';
  const Icon = isSuccess ? CheckCircle : AlertCircle;
  const bgColor = isSuccess ? 'bg-green-50' : 'bg-red-50';
  const borderColor = isSuccess ? 'border-green-200' : 'border-red-200';
  const textColor = isSuccess ? 'text-green-800' : 'text-red-800';
  const iconColor = isSuccess ? 'text-green-500' : 'text-red-500';

  return (
    <div className={`
      fixed bottom-6 left-1/2 -translate-x-1/2 z-[100]
      flex items-center px-4 py-3 rounded-xl shadow-lg border
      ${bgColor} ${borderColor} ${textColor}
      transition-all duration-300 ease-out transform
      ${visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
    `}>
      <Icon className={`w-5 h-5 mr-3 ${iconColor}`} />
      <span className="font-medium text-sm">{message}</span>
      <button 
        onClick={() => setVisible(false)}
        className={`ml-4 p-1 rounded-full hover:bg-black/5 transition-colors ${textColor}`}
      >
        <X size={14} />
      </button>
    </div>
  );
}