'use client';

import { forwardRef, InputHTMLAttributes } from 'react';

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, error, id, ...props }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, '_');
    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={inputId} className="text-sm font-semibold text-gray-700">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <input
          id={inputId}
          ref={ref}
          className={`w-full px-4 py-3 rounded-xl border-2 text-gray-800 text-base transition-all outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 ${
            error
              ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-100'
              : 'border-gray-200 bg-gray-50 hover:border-gray-300'
          }`}
          {...props}
        />
        {error && <p className="text-xs text-red-600 mt-0.5">{error}</p>}
      </div>
    );
  }
);

InputField.displayName = 'InputField';
export default InputField;
