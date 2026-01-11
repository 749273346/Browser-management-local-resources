import { useState } from 'react';
import { Folder } from 'lucide-react';

export default function WelcomeScreen({ onComplete }) {
  const [path, setPath] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

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
    <div className="flex flex-col items-center justify-center h-full p-6 bg-surface-50 text-center">
      <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center mb-6">
        <Folder size={32} strokeWidth={2} />
      </div>
      
      <h1 className="text-2xl font-medium text-gray-900 mb-2">
        Welcome to Local Resources
      </h1>
      
      <p className="text-gray-500 mb-8 max-w-xs text-sm">
        To get started, please enter the full path of the folder you want to manage.
      </p>

      <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-4">
        <div className="relative">
            <input
              type="text"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="e.g., C:\Users\Name\Documents"
              className={`
                w-full px-4 py-3 rounded-xl border bg-white text-gray-900 text-sm
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                transition-all duration-200
                ${error ? 'border-red-300 focus:ring-red-200' : 'border-gray-200'}
              `}
            />
        </div>

        {error && (
            <div className="text-red-500 text-xs text-left pl-1">
                {error}
            </div>
        )}

        <button
          type="submit"
          disabled={checking}
          className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 active:bg-primary-700 
                   text-white font-medium rounded-full shadow-sm hover:shadow-md 
                   transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {checking ? 'Verifying...' : 'Start Managing'}
        </button>
      </form>
    </div>
  );
}
