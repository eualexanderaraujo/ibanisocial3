'use client';

interface StepperProps {
  steps: string[];
  current: number;
}

export default function Stepper({ steps, current }: StepperProps) {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 right-0 top-5 h-0.5 bg-gray-200 z-0" />
        <div
          className="absolute left-0 top-5 h-0.5 bg-brand-600 z-0 transition-all duration-500"
          style={{ width: `${(current / (steps.length - 1)) * 100}%` }}
        />
        {steps.map((step, i) => (
          <div key={i} className="flex flex-col items-center z-10 flex-1">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 border-2 ${
                i < current
                  ? 'bg-brand-600 border-brand-600 text-white'
                  : i === current
                  ? 'bg-white border-brand-600 text-brand-600 shadow-lg shadow-brand-200'
                  : 'bg-white border-gray-300 text-gray-400'
              }`}
            >
              {i < current ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                i + 1
              )}
            </div>
            <span
              className={`mt-2 text-xs font-medium text-center hidden sm:block max-w-[60px] leading-tight ${
                i === current ? 'text-brand-700' : i < current ? 'text-brand-500' : 'text-gray-400'
              }`}
            >
              {step}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-center text-sm text-gray-500 sm:hidden">
        Etapa {current + 1} de {steps.length}: <span className="font-semibold text-brand-700">{steps[current]}</span>
      </p>
    </div>
  );
}
