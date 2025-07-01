import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', hover = true }) => {
  return (
    <motion.div
      className={`
        backdrop-blur-xl bg-white/10 dark:bg-slate-800/30 
        border border-white/20 dark:border-slate-700/50 
        rounded-2xl p-6 shadow-xl
        ${hover ? 'hover:shadow-2xl hover:bg-white/20 dark:hover:bg-slate-800/40' : ''}
        transition-all duration-300
        ${className}
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
};