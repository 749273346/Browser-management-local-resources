
// Color palette for columns (Apple inspired)
export const COLUMN_COLORS = [
    { 
        id: 'red', 
        bg: 'bg-red-50 dark:bg-red-900/20', 
        border: 'border-red-200 dark:border-red-800', 
        header: 'bg-red-100 dark:bg-red-900/40', 
        text: 'text-red-600 dark:text-red-200', 
        name: '珊瑚红' // Coral / Red
    },
    { 
        id: 'orange', 
        bg: 'bg-orange-50 dark:bg-orange-900/20', 
        border: 'border-orange-200 dark:border-orange-800', 
        header: 'bg-orange-100 dark:bg-orange-900/40', 
        text: 'text-orange-600 dark:text-orange-200', 
        name: '蜜柑橙' // Orange
    },
    { 
        id: 'yellow', 
        bg: 'bg-yellow-50 dark:bg-yellow-900/20', 
        border: 'border-yellow-200 dark:border-yellow-800', 
        header: 'bg-yellow-100 dark:bg-yellow-900/40', 
        text: 'text-yellow-700 dark:text-yellow-200', 
        name: '向日葵' // Sunflower / Yellow
    },
    { 
        id: 'green', 
        bg: 'bg-green-50 dark:bg-green-900/20', 
        border: 'border-green-200 dark:border-green-800', 
        header: 'bg-green-100 dark:bg-green-900/40', 
        text: 'text-green-600 dark:text-green-200', 
        name: '薄荷绿' // Mint / Green
    },
    { 
        id: 'cyan', 
        bg: 'bg-cyan-50 dark:bg-cyan-900/20', 
        border: 'border-cyan-200 dark:border-cyan-800', 
        header: 'bg-cyan-100 dark:bg-cyan-900/40', 
        text: 'text-cyan-600 dark:text-cyan-200', 
        name: '湖水蓝' // Teal / Cyan
    },
    { 
        id: 'blue', 
        bg: 'bg-blue-50 dark:bg-blue-900/20', 
        border: 'border-blue-200 dark:border-blue-800', 
        header: 'bg-blue-100 dark:bg-blue-900/40', 
        text: 'text-blue-600 dark:text-blue-200', 
        name: '天空蓝' // Blue
    },
    { 
        id: 'purple', 
        bg: 'bg-purple-50 dark:bg-purple-900/20', 
        border: 'border-purple-200 dark:border-purple-800', 
        header: 'bg-purple-100 dark:bg-purple-900/40', 
        text: 'text-purple-600 dark:text-purple-200', 
        name: '薰衣草' // Lavender / Purple
    },
    { 
        id: 'gray', 
        bg: 'bg-slate-50 dark:bg-slate-900/20', 
        border: 'border-slate-200 dark:border-slate-800', 
        header: 'bg-slate-100 dark:bg-slate-900/40', 
        text: 'text-slate-600 dark:text-slate-200', 
        name: '石墨灰' // Graphite / Gray
    }
];

export const getThemeColor = (id) => COLUMN_COLORS.find(c => c.id === id);
