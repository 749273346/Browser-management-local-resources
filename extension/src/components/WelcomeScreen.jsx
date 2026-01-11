import { useState } from 'react';
import { Folder, FolderOpen } from 'lucide-react';

export default function WelcomeScreen({ onComplete }) {
  const [path, setPath] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const handlePickFolder = async () => {
      try {
          const res = await fetch('http://localhost:3001/api/pick-folder', { method: 'POST' });
          const data = await res.json();
          if (data.path) {
              setPath(data.path);
              setError('');
          }
      } catch (err) {
          console.error('Failed to pick folder:', err);
          setError('无法调用文件夹选择器 (Could not open picker)');
      }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!path.trim()) {
        setError('Please enter a path');
        return;
    }

    setChecking(true);
    setError('');

    try {
        const res = await fetch('http://localhost:3001/api/check-path', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: path.trim() })
        });
        const data = await res.json();
        
        if (data.valid) {
            onComplete(path.trim());
        } else {
            setError(data.error || 'Invalid path');
        }
    } catch (err) {
        setError('Failed to connect to local server. Is it running?');
    } finally {
        setChecking(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-surface-50 to-primary-50 text-center">
      <div className="w-24 h-24 bg-white text-primary-600 rounded-3xl shadow-xl flex items-center justify-center mb-8 animate-fade-in">
        <Folder size={48} strokeWidth={1.5} />
      </div>
      
      <h1 className="text-4xl font-normal text-gray-900 mb-4 animate-fade-in" style={{animationDelay: '0.1s'}}>
        欢迎使用调度中心
      </h1>
      
      <p className="text-gray-500 mb-10 max-w-md text-lg animate-fade-in" style={{animationDelay: '0.2s'}}>
        连接本地文件夹，开启全新的全屏资源管理体验。
      </p>

      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6 animate-fade-in" style={{animationDelay: '0.3s'}}>
        <div className="relative group">
            <input
              type="text"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="例如: C:\Users\Name\Documents"
              className={`
                w-full pl-6 pr-14 py-4 rounded-2xl border bg-white text-gray-900 text-lg shadow-sm
                focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary-500
                transition-all duration-200
                ${error ? 'border-red-300 focus:ring-red-100' : 'border-gray-200 group-hover:border-gray-300'}
              `}
            />
            <button
                type="button"
                onClick={handlePickFolder}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="选择文件夹"
            >
                <FolderOpen size={20} />
            </button>
        </div>

        {error && (
            <div className="text-red-500 text-sm text-left pl-2 font-medium flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2"></span>
                {error}
            </div>
        )}

        <button
          type="submit"
          disabled={checking}
          className="w-full py-4 px-6 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 
                   text-white text-lg font-medium rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5
                   transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
        >
          {checking ? '正在验证...' : '开始调度'}
        </button>
      </form>
    </div>
  );
}
