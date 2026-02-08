import { TextareaHTMLAttributes, forwardRef } from 'react';

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`
            w-full px-4 py-3 min-h-[96px]
            bg-[#1A1F26] text-white rounded-xl
            border-2 border-transparent
            focus:border-[#FFC107] focus:outline-none
            placeholder:text-gray-500
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors resize-none
            ${error ? 'border-[#EF4444]' : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-2 text-sm text-[#EF4444]">{error}</p>
        )}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';
