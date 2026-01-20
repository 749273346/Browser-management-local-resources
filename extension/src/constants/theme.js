
// Color palette for columns (Google inspired)
export const COLUMN_COLORS = [
    { 
        id: 'blue', 
        bg: 'bg-blue-100 dark:bg-blue-900/30', 
        border: 'border-blue-300 dark:border-blue-700', 
        header: 'bg-blue-200 dark:bg-blue-900/50', 
        text: 'text-blue-800 dark:text-blue-100', 
        name: '谷歌蓝' // Google Blue
    },
    { 
        id: 'red', 
        bg: 'bg-red-100 dark:bg-red-900/30', 
        border: 'border-red-300 dark:border-red-700', 
        header: 'bg-red-200 dark:bg-red-900/50', 
        text: 'text-red-800 dark:text-red-100', 
        name: '谷歌红' // Google Red
    },
    { 
        id: 'yellow', 
        bg: 'bg-yellow-100 dark:bg-yellow-900/30', 
        border: 'border-yellow-300 dark:border-yellow-700', 
        header: 'bg-yellow-200 dark:bg-yellow-900/50', 
        text: 'text-yellow-800 dark:text-yellow-100', 
        name: '谷歌黄' // Google Yellow
    },
    { 
        id: 'green', 
        bg: 'bg-green-100 dark:bg-green-900/30', 
        border: 'border-green-300 dark:border-green-700', 
        header: 'bg-green-200 dark:bg-green-900/50', 
        text: 'text-green-800 dark:text-green-100', 
        name: '谷歌绿' // Google Green
    },
    { 
        id: 'purple', 
        bg: 'bg-purple-100 dark:bg-purple-900/30', 
        border: 'border-purple-300 dark:border-purple-700', 
        header: 'bg-purple-200 dark:bg-purple-900/50', 
        text: 'text-purple-800 dark:text-purple-100', 
        name: '表单紫' // Forms Purple
    },
    { 
        id: 'gray', 
        bg: 'bg-gray-100 dark:bg-gray-900/30', 
        border: 'border-gray-300 dark:border-gray-700', 
        header: 'bg-gray-200 dark:bg-gray-900/50', 
        text: 'text-gray-800 dark:text-gray-100', 
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
