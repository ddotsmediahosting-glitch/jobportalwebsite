import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
            {label}
            {props.required && <span className="text-brand-500 ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            {...props}
            className={`
              block w-full rounded-xl border px-3.5 py-2.5 text-sm text-gray-900
              placeholder-gray-400 bg-white
              focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent
              disabled:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-500
              transition-all duration-150
              ${leftIcon ? 'pl-9' : ''}
              ${error
                ? 'border-red-300 bg-red-50/50 focus:ring-red-300'
                : 'border-gray-200 hover:border-gray-300'
              }
              ${className}
            `}
          />
        </div>
        {error && (
          <p className="text-xs text-red-600 flex items-center gap-1">
            <span>⚠</span> {error}
          </p>
        )}
        {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
            {label}
            {props.required && <span className="text-brand-500 ml-0.5">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          {...props}
          className={`
            block w-full rounded-xl border px-3.5 py-2.5 text-sm text-gray-900
            placeholder-gray-400 bg-white
            focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent
            disabled:bg-gray-50 disabled:cursor-not-allowed resize-y
            transition-all duration-150
            ${error
              ? 'border-red-300 bg-red-50/50 focus:ring-red-300'
              : 'border-gray-200 hover:border-gray-300'
            }
            ${className}
          `}
        />
        {error && (
          <p className="text-xs text-red-600 flex items-center gap-1">
            <span>⚠</span> {error}
          </p>
        )}
        {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
