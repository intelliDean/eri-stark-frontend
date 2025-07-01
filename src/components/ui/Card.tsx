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
        backdrop-blur-xl bg-slate-800/30 dark:bg-slate-900/40 
        border border-purple-500/20 dark:border-purple-400/20 
        rounded-2xl p-6 shadow-xl
        ${hover ? 'hover:shadow-2xl hover:bg-slate-800/40 dark:hover:bg-slate-900/50 hover:border-purple-500/30' : ''}
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