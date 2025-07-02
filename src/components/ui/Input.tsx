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
        bg-gray-800/50 
        border border-green-500/20 
        text-white placeholder-gray-400
        focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50
        transition-all duration-300
        ${className}
      `}
    />
  );
};