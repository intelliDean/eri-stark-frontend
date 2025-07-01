import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, User, Building2, Sun, Moon, Menu, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useWallet } from '../contexts/WalletContext';
import { Button } from './ui/Button';

interface NavigationProps {
  currentPage: 'landing' | 'manufacturer' | 'user';
  onPageChange: (page: 'landing' | 'manufacturer' | 'user') => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentPage, onPageChange }) => {
  const { isDark, toggleTheme } = useTheme();
  const { address, isConnected, connectWallet, disconnectWallet } = useWallet();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'landing', label: 'Home', icon: Shield },
    { id: 'manufacturer', label: 'Manufacturer', icon: Building2 },
    { id: 'user', label: 'User', icon: User },
  ];

  const handleWalletClick = () => {
    if (isConnected) {
      disconnectWallet();
    } else {
      connectWallet();
    }
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/20 dark:bg-slate-950/30 border-b border-purple-500/20 dark:border-purple-400/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div
            className="flex items-center space-x-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="relative">
              <Shield className="w-8 h-8 text-purple-400" />
              <div className="absolute inset-0 w-8 h-8 bg-purple-400/20 rounded-full blur-md"></div>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              ERI
            </span>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onPageChange(item.id as any)}
                  className={`
                    flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 relative group
                    ${currentPage === item.id 
                      ? 'text-purple-400' 
                      : 'text-slate-300 hover:text-purple-400'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {currentPage === item.id && (
                    <motion.div
                      className="absolute inset-0 bg-purple-500/10 rounded-lg border border-purple-500/20"
                      layoutId="activeTab"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right side controls */}
          <div className="flex items-center space-x-4">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-300 hover:text-purple-400 hover:bg-purple-500/10 transition-all duration-300"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Wallet connection */}
            <Button
              onClick={handleWalletClick}
              variant={isConnected ? 'secondary' : 'primary'}
              size="sm"
              className="hidden md:block"
            >
              {isConnected 
                ? `${address!.slice(0, 6)}...${address!.slice(-4)}` 
                : 'Connect Wallet'
              }
            </Button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-300 hover:text-purple-400"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-purple-500/20 py-4"
          >
            <div className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onPageChange(item.id as any);
                      setMobileMenuOpen(false);
                    }}
                    className={`
                      w-full flex items-center space-x-2 px-4 py-3 rounded-lg transition-all duration-300
                      ${currentPage === item.id 
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                        : 'text-slate-300 hover:text-purple-400 hover:bg-purple-500/5'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
              <div className="pt-2 border-t border-purple-500/20">
                <Button
                  onClick={handleWalletClick}
                  variant={isConnected ? 'secondary' : 'primary'}
                  size="sm"
                  className="w-full"
                >
                  {isConnected 
                    ? `${address!.slice(0, 6)}...${address!.slice(-4)}` 
                    : 'Connect Wallet'
                  }
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  );
};