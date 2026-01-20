
// Color palette for columns (Google inspired)
export const COLUMN_COLORS = [
    { 
        id: 'blue', 
        bg: 'bg-blue-50 dark:bg-blue-900/20', 
        border: 'border-blue-200 dark:border-blue-800', 
        header: 'bg-blue-100 dark:bg-blue-900/40', 
        text: 'text-blue-700 dark:text-blue-200', 
        name: '谷歌蓝' // Google Blue
    },
    { 
        id: 'red', 
        bg: 'bg-red-50 dark:bg-red-900/20', 
        border: 'border-red-200 dark:border-red-800', 
        header: 'bg-red-100 dark:bg-red-900/40', 
        text: 'text-red-700 dark:text-red-200', 
        name: '谷歌红' // Google Red
    },
    { 
        id: 'yellow', 
        bg: 'bg-yellow-50 dark:bg-yellow-900/20', 
        border: 'border-yellow-200 dark:border-yellow-800', 
        header: 'bg-yellow-100 dark:bg-yellow-900/40', 
        text: 'text-yellow-700 dark:text-yellow-200', 
        name: '谷歌黄' // Google Yellow
    },
    { 
        id: 'green', 
        bg: 'bg-green-50 dark:bg-green-900/20', 
        border: 'border-green-200 dark:border-green-800', 
        header: 'bg-green-100 dark:bg-green-900/40', 
        text: 'text-green-700 dark:text-green-200', 
        name: '谷歌绿' // Google Green
    },
    { 
        id: 'purple', 
        bg: 'bg-purple-50 dark:bg-purple-900/20', 
        border: 'border-purple-200 dark:border-purple-800', 
        header: 'bg-purple-100 dark:bg-purple-900/40', 
        text: 'text-purple-700 dark:text-purple-200', 
        name: '表单紫' // Forms Purple
    },
    { 
        id: 'gray', 
        bg: 'bg-gray-50 dark:bg-gray-900/20', 
        border: 'border-gray-200 dark:border-gray-800', 
        header: 'bg-gray-100 dark:bg-gray-900/40', 
        text: 'text-gray-700 dark:text-gray-200', 
        name: '经典灰' // Classic Gray
    }
];

export const getThemeColor = (id) => COLUMN_COLORS.find(c => c.id === id);

export const getEffectiveColorScheme = (path, folderColors) => {
    if (!path || !folderColors) return null;

    const normalize = (p) => (p || '').replace(/\\/g, '/').replace(/\/$/, '').toLowerCase();
    const normalizedPath = normalize(path);
    if (!normalizedPath) return null;

    const entries = Object.entries(folderColors)
        .map(([k, v]) => [normalize(k), v])
        .filter(([k, v]) => !!k && !!v);

    // 1. Direct match (normalized)
    for (const [k, v] of entries) {
        if (k === normalizedPath) {
            return getThemeColor(v) || null;
        }
    }

    // 2. Inheritance (closest ancestor)
    let closestKey = '';
    let closestId = '';
    for (const [k, v] of entries) {
        if (!normalizedPath.startsWith(k)) continue;
        if (!(normalizedPath[k.length] === '/' || normalizedPath.length === k.length)) continue;
        if (k.length > closestKey.length) {
            closestKey = k;
            closestId = v;
        }
    }

    return closestId ? getThemeColor(closestId) : null;
};
