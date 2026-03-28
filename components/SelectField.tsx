'use client';

import { forwardRef, SelectHTMLAttributes } from 'react';

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: readonly string[];
  error?: string;
  placeholder?: string;
}

const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, options, error, placeholder, id, ...props }, ref) => {
    const selectId = id ?? label.toLowerCase().replace(/\s+/g, '_');
    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={selectId} className="text-sm font-semibold text-gray-700">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <select
          id={selectId}
          ref={ref}
          className={`w-full px-4 py-3 rounded-xl border-2 text-gray-800 text-base transition-all outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 appearance-none bg-no-repeat bg-[right_1rem_center] ${
            error
              ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-100'
              : 'border-gray-200 bg-gray-50 hover:border-gray-300'
          }`}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
          }}
          {...props}
        >
          <option value="">{placeholder ?? `Selecione ${label.toLowerCase()}`}</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-red-600 mt-0.5">{error}</p>}
      </div>
    );
  }
);

SelectField.displayName = 'SelectField';
export default SelectField;
