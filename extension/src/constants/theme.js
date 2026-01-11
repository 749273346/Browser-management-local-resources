
// Color palette for columns (Railway theme inspired)
export const COLUMN_COLORS = [
    { id: 'yellow', bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-800', header: 'bg-yellow-100 dark:bg-yellow-900/40', text: 'text-yellow-800 dark:text-yellow-200', name: '杏黄' },
    { id: 'green', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', header: 'bg-green-100 dark:bg-green-900/40', text: 'text-green-800 dark:text-green-200', name: '竹绿' },
    { id: 'red', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', header: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-800 dark:text-red-200', name: '丹红' },
    { id: 'blue', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', header: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-800 dark:text-blue-200', name: '海蓝' },
    { id: 'purple', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800', header: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-800 dark:text-purple-200', name: '紫藤' },
];

export const getThemeColor = (id) => COLUMN_COLORS.find(c => c.id === id);
