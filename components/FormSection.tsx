'use client';

import { ReactNode } from 'react';

interface FormSectionProps {
  title: string;
  icon: string;
  children: ReactNode;
}

export default function FormSection({ title, icon, children }: FormSectionProps) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">{icon}</span>
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
