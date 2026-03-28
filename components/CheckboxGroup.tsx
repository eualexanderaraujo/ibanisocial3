'use client';

interface CheckboxGroupProps {
  label: string;
  options: readonly string[];
  values: string[];
  onChange: (values: string[]) => void;
}

export default function CheckboxGroup({ label, options, values, onChange }: CheckboxGroupProps) {
  const toggle = (opt: string) => {
    onChange(values.includes(opt) ? values.filter((v) => v !== opt) : [...values, opt]);
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {options.map((opt) => {
          const checked = values.includes(opt);
          return (
            <label
              key={opt}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all select-none ${
                checked
                  ? 'border-brand-500 bg-brand-50 text-brand-800'
                  : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  checked ? 'border-brand-600 bg-brand-600' : 'border-gray-300 bg-white'
                }`}
              >
                {checked && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <input
                type="checkbox"
                className="sr-only"
                checked={checked}
                onChange={() => toggle(opt)}
              />
              <span className="text-sm font-medium">{opt}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
