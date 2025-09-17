// src/components/ui/Card.jsx
import { forwardRef } from 'react';

const Card = forwardRef(({
    className = '',
    children,
    hover = false,
    padding = 'default',
    shadow = 'default',
    border = true,
    ...props
}, ref) => {
    const paddingClasses = {
        none: '',
        sm: 'p-4',
        default: 'p-6',
        lg: 'p-8'
    };

    const shadowClasses = {
        none: '',
        sm: 'shadow-sm',
        default: 'shadow-md',
        lg: 'shadow-lg',
        xl: 'shadow-xl'
    };

    return (
        <div
            ref={ref}
            className={`
        bg-white rounded-xl backdrop-blur-sm 
        ${border ? 'border border-gray-200' : ''}
        ${shadowClasses[shadow]} 
        ${paddingClasses[padding]}
        ${hover ? 'hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer' : 'transition-shadow duration-200'}
        ${className}
      `}
            {...props}
        >
            {children}
        </div>
    );
});

Card.displayName = 'Card';

const CardHeader = ({ className = '', children, ...props }) => (
    <div className={`flex items-center justify-between mb-4 ${className}`} {...props}>
        {children}
    </div>
);

const CardTitle = ({ className = '', children, ...props }) => (
    <h3 className={`text-lg font-semibold text-gray-900 ${className}`} {...props}>
        {children}
    </h3>
);

const CardDescription = ({ className = '', children, ...props }) => (
    <p className={`text-sm text-gray-600 mt-1 ${className}`} {...props}>
        {children}
    </p>
);

const CardContent = ({ className = '', children, ...props }) => (
    <div className={className} {...props}>
        {children}
    </div>
);

const CardFooter = ({ className = '', children, ...props }) => (
    <div className={`mt-4 pt-4 border-t border-gray-100 ${className}`} {...props}>
        {children}
    </div>
);

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };