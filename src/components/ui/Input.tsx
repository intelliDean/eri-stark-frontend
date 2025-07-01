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
        bg-white/10 dark:bg-slate-900/50 
        border border-white/20 dark:border-slate-700/50 
        text-slate-900 dark:text-white 
        placeholder-slate-500 dark:placeholder-slate-400
        focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent
        transition-all duration-300
        ${className}
      `}
    />
  );
};