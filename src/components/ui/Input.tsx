import React from 'react';

interface InputProps {
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  required?: boolean;
  accept?: string;
}

export const Input: React.FC<InputProps> = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  className = '',
  required = false,
  accept
}) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      accept={accept}
      className={`
        w-full p-4 rounded-xl 
        bg-slate-800/50 dark:bg-slate-900/60 
        border border-purple-500/20 dark:border-purple-400/20 
        text-white placeholder-slate-400
        focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50
        transition-all duration-300
        ${className}
      `}
    />
  );
};