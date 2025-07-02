import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Sun, Moon, Menu, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useWallet } from '../contexts/WalletContext';
import { Button } from './ui/Button';

interface NavigationProps {
  currentPage: 'landing' | 'manufacturer' | 'user' | 'qr-scan';
  onPageChange: (page: 'landing' | 'manufacturer' | 'user' | 'qr-scan') => void;
  onToggleSidebar?: () => void;
  showSidebarToggle?: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({ 
  currentPage, 
  onPageChange, 
  onToggleSidebar,
  showSidebarToggle = false 
}) => {
  const { isDark, toggleTheme } = useTheme();
  const { address, isConnected, connectWallet, disconnectWallet } = useWallet();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleWalletClick = () => {
    if (isConnected) {
      disconnectWallet();
    } else {
      connectWallet();
    }
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-black/20 border-b border-green-500/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left side */}
          <div className="flex items-center space-x-4">
            {/* Sidebar toggle */}
            {showSidebarToggle && (
              <button
                onClick={onToggleSidebar}
                className="p-2 rounded-lg text-green-400 hover:bg-green-500/10 transition-colors duration-300"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            
            {/* Logo */}
            <motion.div
              className="flex items-center space-x-2 cursor-pointer"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => onPageChange('landing')}
            >
              <div className="relative">
                <Shield className="w-8 h-8 text-green-400" />
                <div className="absolute inset-0 w-8 h-8 bg-green-400/20 rounded-full blur-md animate-pulse"></div>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
                ERI
              </span>
            </motion.div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center space-x-4">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-300 hover:text-green-400 hover:bg-green-500/10 transition-all duration-300"
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
              className="md:hidden p-2 rounded-lg text-gray-300 hover:text-green-400"
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
            className="md:hidden border-t border-green-500/20 py-4"
          >
            <div className="pt-2">
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
          </motion.div>
        )}
      </div>
    </nav>
  );
};