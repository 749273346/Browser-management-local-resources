import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { 
    Search, X, Folder, File, FileText, FileCode,
    FileImage, Film, Music, FileArchive, AppWindow, Link2, Database, FileType2,
    Clock, Loader2, ExternalLink, ArrowRight, ArrowUp, ArrowDown, Sheet
} from 'lucide-react';
import PptIcon from './PptIcon';

const CATEGORIES = [
    { id: 'all', label: '全部' },
    { id: 'sheet', label: '表格' },
    { id: 'doc', label: '文档' },
    { id: 'image', label: '图片' },
    { id: 'video', label: '视频' },
    { id: 'audio', label: '音频' },
    { id: 'archive', label: '压缩包' },
    { id: 'app', label: '程序' },
    { id: 'code', label: '代码' },
];

const MAX_HISTORY = 5;

const nameCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

// Helper to get icon
const getFileIcon = (name, isDirectory) => {
    if (isDirectory) return <Folder className="text-yellow-500" size={18} />;
    
    const ext = name.includes('.') ? name.split('.').pop().toLowerCase() : '';

    if (['xls', 'xlsx', 'csv', 'tsv', 'ods', 'numbers'].includes(ext)) {
        return <Sheet className="text-green-600" size={18} />;
    }

    if (['doc', 'docx', 'pdf', 'txt', 'md', 'rtf', 'odt', 'pages', 'wps'].includes(ext)) {
        return <FileText className="text-blue-500" size={18} />;
    }

    if (['ppt', 'pptx', 'key', 'dps', 'odp'].includes(ext)) {
        return <PptIcon className="text-red-500" size={18} />;
    }

    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'tif', 'tiff', 'heic', 'heif', 'avif'].includes(ext)) {
        return <FileImage className="text-purple-500" size={18} />;
    }

    if (['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm', 'm4v', '3gp'].includes(ext)) {
        return <Film className="text-red-500" size={18} />;
    }

    if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma', 'opus'].includes(ext)) {
        return <Music className="text-pink-500" size={18} />;
    }

    if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'zst', 'iso'].includes(ext)) {
        return <FileArchive className="text-amber-600" size={18} />;
    }

    if (['exe', 'msi', 'bat', 'cmd', 'ps1', 'sh', 'app', 'apk', 'jar'].includes(ext)) {
        return <AppWindow className="text-emerald-600" size={18} />;
    }

    if (['js', 'jsx', 'ts', 'tsx', 'json', 'html', 'css', 'scss', 'less', 'xml', 'yaml', 'yml', 'ini', 'toml', 'conf', 'log', 'py', 'java', 'c', 'cpp', 'h', 'hpp', 'cs', 'go', 'rs', 'php', 'rb', 'lua', 'sql', 'psd', 'ai'].includes(ext)) {
        return <FileCode className="text-sky-600" size={18} />;
    }

    if (['ttf', 'otf', 'woff', 'woff2'].includes(ext)) {
        return <FileType2 className="text-fuchsia-600" size={18} />;
    }

    if (['db', 'sqlite', 'sqlite3', 'mdb', 'accdb'].includes(ext)) {
        return <Database className="text-cyan-600" size={18} />;
    }

    if (['lnk', 'url'].includes(ext)) {
        return <Link2 className="text-indigo-600" size={18} />;
    }

    return <File className="text-gray-400" size={18} />;
};

// Highlight helper
const HighlightedText = ({ text, highlight }) => {
    if (!highlight) return <span>{text}</span>;
    
    try {
        // Escape regex special characters
        const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const parts = text.split(new RegExp(`(${escapedHighlight})`, 'gi'));
        return (
            <span>
                {parts.map((part, i) => 
                    part.toLowerCase() === highlight.toLowerCase() ? (
                        <span key={i} className="text-primary-600 dark:text-primary-400 font-bold bg-yellow-100 dark:bg-yellow-900/30 rounded-sm px-0.5">
                            {part}
                        </span>
                    ) : (
                        <span key={i}>{part}</span>
                    )
                )}
            </span>
        );
    } catch (e) {
        return <span>{text}</span>;
    }
};

export default function SearchBar({ currentPath, onNavigate }) {
    const [isActive, setIsActive] = useState(false);
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('all');
    const [scope, setScope] = useState('local'); // global | local
    const [sortDirection, setSortDirection] = useState('asc');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const [activeIndex, setActiveIndex] = useState(-1);
    
    const containerRef = useRef(null);
    const inputRef = useRef(null);
    const debounceRef = useRef(null);

    // Load history on mount
    useEffect(() => {
        const saved = localStorage.getItem('search_history');
        if (saved) {
            try {
                setHistory(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse history');
            }
        }
    }, []);

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsActive(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Search function
    const performSearch = useCallback(async (searchQuery, searchCategory, searchScope) => {
        if (!searchQuery.trim()) {
            setResults([]);
            return;
        }

        setIsLoading(true);
        try {
            // Determine search root based on scope
            const rootPath = localStorage.getItem('rootPath') || 'C:\\';
            const searchRoot = searchScope === 'local' ? (currentPath || rootPath) : rootPath;
            
            const params = new URLSearchParams({
                query: searchQuery,
                path: searchRoot,
                type: searchCategory
            });

            const res = await fetch(`http://localhost:3001/api/search?${params}`);
            const data = await res.json();
            setResults(data.results || []);
        } catch (error) {
            console.error('Search failed:', error);
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    }, [currentPath]);

    // Debounce effect
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (query) {
            debounceRef.current = setTimeout(() => {
                performSearch(query, category, scope);
            }, 300);
        } else {
            setResults([]);
            setIsLoading(false);
        }

        return () => clearTimeout(debounceRef.current);
    }, [query, category, scope, performSearch]);

    const displayResults = useMemo(() => {
        if (!results?.length) return [];

        const sorted = [...results].sort((a, b) => {
            if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
            const nameCmp = nameCollator.compare(a.name, b.name);
            if (nameCmp !== 0) return nameCmp;
            return nameCollator.compare(a.path, b.path);
        });

        return sortDirection === 'asc' ? sorted : sorted.reverse();
    }, [results, sortDirection]);

    useEffect(() => {
        setActiveIndex(-1);
    }, [query, category, sortDirection, results]);

    const addToHistory = (text) => {
        const newHistory = [text, ...history.filter(h => h !== text)].slice(0, MAX_HISTORY);
        setHistory(newHistory);
        localStorage.setItem('search_history', JSON.stringify(newHistory));
    };

    const handleOpen = async (item) => {
        addToHistory(query);
        
        if (item.isDirectory) {
            // If it's a directory and we have a navigation handler, use it
            if (onNavigate) {
                onNavigate(item.path);
                setIsActive(false);
                setQuery('');
                setResults([]);
            } else {
                // Fallback to opening in explorer if no navigation handler
                try {
                    await fetch('http://localhost:3001/api/open', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ path: item.path })
                    });
                    setIsActive(false);
                } catch (e) {
                    console.error('Failed to open:', e);
                }
            }
        } else {
            // It's a file, open it
            try {
                await fetch('http://localhost:3001/api/open', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ path: item.path })
                });
                setIsActive(false);
            } catch (e) {
                console.error('Failed to open:', e);
            }
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(prev => Math.min(prev + 1, displayResults.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => Math.max(prev - 1, -1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (activeIndex >= 0 && displayResults[activeIndex]) {
                handleOpen(displayResults[activeIndex]);
            } else if (displayResults.length > 0) {
                handleOpen(displayResults[0]);
            }
        } else if (e.key === 'Escape') {
            setIsActive(false);
            inputRef.current?.blur();
        }
    };

    const clearHistory = (e) => {
        e.stopPropagation();
        setHistory([]);
        localStorage.removeItem('search_history');
    };

    return (
        <div ref={containerRef} className="relative z-50">
            {/* Search Input */}
            <div className={`
                flex items-center transition-all duration-300 ease-in-out
                ${isActive ? 'w-[480px] bg-white dark:bg-slate-800' : 'w-48 bg-white/40 dark:bg-slate-800/40 hover:bg-white/60 dark:hover:bg-slate-800/60'}
                backdrop-blur-md rounded-full border border-white/20 dark:border-white/10 shadow-sm
            `}>
                <Search size={18} className="ml-3 text-gray-500 dark:text-slate-400 flex-shrink-0" />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsActive(true)}
                    onKeyDown={handleKeyDown}
                    placeholder="搜索文件..."
                    className="searchbar-input w-full bg-transparent border-none appearance-none focus:ring-0 outline-none focus:outline-none text-sm px-3 py-2 text-gray-800 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-500"
                    spellCheck="false"
                    autoComplete="off"
                />
                {query && (
                    <button 
                        onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus(); }}
                        className="mr-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            {/* Dropdown Panel */}
            {isActive && (
                <div className="absolute top-full right-0 mt-2 w-[480px] bg-white/90 dark:bg-slate-900/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/20 dark:border-white/10 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right">
                    
                    {/* Categories */}
                    <div className="flex items-center px-2 py-2 border-b border-gray-100 dark:border-slate-800">
                        {/* Scope Toggle */}
                        <div className="flex bg-gray-100 dark:bg-slate-800 rounded-lg p-0.5 mr-2 flex-shrink-0">
                            <button
                                onClick={() => { setScope('global'); inputRef.current?.focus(); }}
                                className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${scope === 'global' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-600 dark:text-primary-300' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}
                            >
                                全局
                            </button>
                            <button
                                onClick={() => { setScope('local'); inputRef.current?.focus(); }}
                                className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${scope === 'local' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-600 dark:text-primary-300' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}
                            >
                                当前
                            </button>
                        </div>
                        <div className="h-4 w-px bg-gray-200 dark:bg-slate-700 mx-1 flex-shrink-0"></div>
                        <div className="flex flex-1 space-x-1 overflow-x-auto scrollbar-hide">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => { setCategory(cat.id); inputRef.current?.focus(); }}
                                    className={`
                                        px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors
                                        ${category === cat.id 
                                            ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300' 
                                            : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'}
                                    `}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                        <button
                            type="button"
                            title={sortDirection === 'asc' ? '按名称升序' : '按名称降序'}
                            aria-label={sortDirection === 'asc' ? '按名称升序' : '按名称降序'}
                            onClick={() => {
                                setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
                                inputRef.current?.focus();
                            }}
                            className="ml-2 p-2 rounded-lg text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
                        >
                            {sortDirection === 'asc' ? (
                                <ArrowUp size={16} className="text-gray-500 dark:text-slate-400" />
                            ) : (
                                <ArrowDown size={16} className="text-gray-500 dark:text-slate-400" />
                            )}
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                <Loader2 size={32} className="animate-spin mb-3 text-primary-500" />
                                <span className="text-sm">正在搜索...</span>
                            </div>
                        ) : query ? (
                            displayResults.length > 0 ? (
                                <div className="py-2">
                                    <div className="px-4 py-1 text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                                        搜索结果 ({displayResults.length})
                                    </div>
                                    {displayResults.map((item, index) => (
                                        <div
                                            key={item.path}
                                            onClick={() => handleOpen(item)}
                                            onMouseEnter={() => setActiveIndex(index)}
                                            className={`
                                                group flex items-center px-4 py-3 cursor-pointer transition-colors
                                                ${index === activeIndex ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-gray-50 dark:hover:bg-slate-800/50'}
                                            `}
                                        >
                                            <div className="flex-shrink-0 mr-3">
                                                {getFileIcon(item.name, item.isDirectory)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate pr-2">
                                                        <HighlightedText text={item.name} highlight={query} />
                                                    </div>
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-slate-400 truncate flex items-center mt-0.5">
                                                    <span className="opacity-70">{item.parentPath}</span>
                                                </div>
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                                <ExternalLink size={14} className="text-gray-400" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-slate-500">
                                    <Folder size={48} className="mb-4 opacity-20" />
                                    <p className="text-sm">未找到相关文件</p>
                                </div>
                            )
                        ) : (
                            /* History View */
                            <div className="py-2">
                                {history.length > 0 ? (
                                    <>
                                        <div className="flex items-center justify-between px-4 py-1 mb-1">
                                            <span className="text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                                                最近搜索
                                            </span>
                                            <button 
                                                onClick={clearHistory}
                                                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                清空
                                            </button>
                                        </div>
                                        {history.map((h, i) => (
                                            <div
                                                key={i}
                                                onClick={() => { setQuery(h); inputRef.current?.focus(); }}
                                                className="flex items-center px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer group"
                                            >
                                                <Clock size={14} className="text-gray-400 mr-3" />
                                                <span className="text-sm text-gray-700 dark:text-slate-300 flex-1">{h}</span>
                                                <ArrowRight size={14} className="text-gray-300 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                            </div>
                                        ))}
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-slate-600">
                                        <Search size={32} className="mb-2 opacity-20" />
                                        <p className="text-xs">输入关键词开始搜索</p>
                                        <p className="text-[10px] mt-1 opacity-60">支持按类型筛选</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    
                    {/* Footer Status */}
                    {query && results.length >= 100 && (
                        <div className="px-4 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 text-xs text-yellow-600 dark:text-yellow-500 text-center border-t border-yellow-100 dark:border-yellow-900/30">
                            仅显示前 100 条结果，请尝试更精确的关键词
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
