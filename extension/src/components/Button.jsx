import React from 'react';

export default function Button({ 
    children, 
    onClick, 
    variant = 'secondary', // primary, secondary, ghost, danger
    size = 'md', // sm, md, lg, icon
    className = '',
    title,
    disabled = false,
    active = false,
    icon: Icon
}) {
    // Base styles - Apple-like interaction (scale on click), smooth transitions
    const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 select-none";
    
    // Variants
    const variants = {
        primary: "bg-primary-600 hover:bg-primary-700 text-white shadow-sm hover:shadow-md border border-transparent",
        secondary: `
            bg-white dark:bg-slate-800 
            text-gray-700 dark:text-slate-200 
            border border-gray-200 dark:border-slate-700 
            hover:bg-gray-50 dark:hover:bg-slate-700/80 
            hover:border-gray-300 dark:hover:border-slate-600
            shadow-sm
        `,
        ghost: `
            bg-transparent 
            text-gray-600 dark:text-slate-300 
            hover:bg-black/5 dark:hover:bg-white/10 
            hover:text-gray-900 dark:hover:text-slate-100
        `,
        danger: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 border border-transparent",
        active: "bg-primary-100 dark:bg-primary-500/20 text-primary-700 dark:text-primary-200 border border-primary-200 dark:border-primary-500/30"
    };

    // Size styles
    const sizes = {
        sm: "text-xs px-2.5 py-1.5 gap-1.5",
        md: "text-sm px-4 py-2 gap-2",
        lg: "text-base px-6 py-3 gap-3",
        icon: "p-2 aspect-square"
    };

    // Determine final variant class
    let variantClass = variants[variant];
    if (active && variant !== 'primary') {
        variantClass = variants.active;
    }

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
                ${baseStyles}
                ${variantClass}
                ${sizes[size]}
                ${className}
            `}
            style={{ borderRadius: 'var(--radius-btn)' }}
            title={title}
        >
            {Icon && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 18} />}
            {children}
        </button>
    );
}
