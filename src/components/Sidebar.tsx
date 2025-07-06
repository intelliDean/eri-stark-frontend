import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Building2, 
  User, 
  QrCode, 
  Package, 
  Shield, 
  FileText, 
  Upload,
  Eye,
  Gift,
  RotateCcw,
  X,
  Key,
  Menu,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
  currentPage: 'landing' | 'manufacturer' | 'user' | 'qr-scan';
  onPageChange: (page: 'landing' | 'manufacturer' | 'user' | 'qr-scan') => void;
  activeFeature: string;
  onFeatureChange: (feature: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onClose, 
  onToggle,
  currentPage, 
  onPageChange, 
  activeFeature, 
  onFeatureChange 
}) => {

  const manufacturerFeatures = [
    { id: 'landing', label: 'Back to Home', icon: Home },
    { id: 'register-manufacturer', label: 'Register', icon: Building2 },
    { id: 'create-certificate', label: 'Create Certificate', icon: FileText },
    { id: 'verify-authenticity', label: 'Verify Authenticity', icon: Eye },
    { id: 'bulk-upload', label: 'Bulk Upload', icon: Upload },
  ];

  const userFeatures = [
    { id: 'landing', label: 'Back to Home', icon: Home },
    { id: 'register-user', label: 'Register', icon: User },
    { id: 'my-items', label: 'My Items', icon: Package },
    { id: 'transfer-ownership', label: 'Transfer', icon: Gift },
    { id: 'claim-ownership', label: 'Claim Ownership', icon: Package },
    { id: 'revoke-code', label: 'Revoke Code', icon: RotateCcw },
    { id: 'verify-ownership', label: 'Verify', icon: Shield },
  ];

  const qrFeatures = [
    { id: 'landing', label: 'Back to Home', icon: Home },
    { id: 'claim-ownership', label: 'Claim Ownership', icon: Package },
    { id: 'verify-ownership', label: 'Verify Ownership', icon: Shield },
    { id: 'verify-authenticity', label: 'Verify Authenticity', icon: Eye },
  ];

  const handleNavClick = (id: string) => {
    if (id === 'landing') {
      onPageChange(id as any);
      onFeatureChange('');
    } else {
      onFeatureChange(id);
    }
  };

  // Get the appropriate features based on current page
  const getCurrentFeatures = () => {
    switch (currentPage) {
      case 'manufacturer':
        return manufacturerFeatures;
      case 'user':
        return userFeatures;
      case 'qr-scan':
        return qrFeatures;
      default:
        return [];
    }
  };

  const currentFeatures = getCurrentFeatures();

  // Get page title
  const getPageTitle = () => {
    switch (currentPage) {
      case 'manufacturer':
        return 'Manufacturer Tools';
      case 'user':
        return 'User Dashboard';
      case 'qr-scan':
        return 'QR Scanner';
      default:
        return 'Navigation';
    }
  };
  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>
      
      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{ 
          x: isOpen ? 0 : -320,
          opacity: isOpen ? 1 : 0
        }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed left-0 top-0 h-full w-64 bg-gray-900/95 backdrop-blur-xl border-r border-green-500/20 z-50 overflow-y-auto"
      >
        <div className="p-4">
          {/* Header with close/toggle buttons */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold text-green-400">{getPageTitle()}</h2>
            <div className="flex items-center space-x-2">
              {/* Hide button for desktop */}
              <button
                onClick={onToggle}
                className="hidden lg:flex p-2 rounded-lg text-gray-400 hover:text-green-400 hover:bg-green-500/10 transition-colors"
                title="Hide sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {/* Close button for mobile */}
              <button
                onClick={onClose}
                className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-green-400 hover:bg-green-500/10 transition-colors"
                title="Close sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Contextual Features */}
          {currentFeatures.length > 0 && (
            <div className="space-y-2 mb-8">
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
                Available Actions
              </h3>
              {currentFeatures.map((item) => {
                const Icon = item.icon;
                const isActive = item.id === 'landing' ? false : activeFeature === item.id;
                const isBackButton = item.id === 'landing';
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`
                      w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 group
                      ${isBackButton
                        ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50 border border-gray-700/50'
                        : isActive 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                          : 'text-gray-300 hover:text-green-400 hover:bg-green-500/10'
                      }
                    `}
                  >
                    <Icon className={`w-4 h-4 ${
                      isBackButton 
                        ? 'text-gray-400 group-hover:text-gray-300'
                        : isActive 
                          ? 'text-green-400' 
                          : 'text-gray-400 group-hover:text-green-400'
                    }`} />
                    <span className="text-sm">{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-green-500/20 pt-4 mt-8">
            <div className={`mb-3 p-3 rounded-lg text-xs ${
              currentPage === 'manufacturer' 
                ? 'bg-blue-500/10 text-blue-300'
                : currentPage === 'user'
                  ? 'bg-green-500/10 text-green-300'
                  : 'bg-purple-500/10 text-purple-300'
            }`}>
              {currentPage === 'manufacturer' && (
                <>🏭 <strong>Manufacturer Mode:</strong> Create and verify product certificates</>
              )}
              {currentPage === 'user' && (
                <>👤 <strong>User Mode:</strong> Manage your product ownership</>
              )}
              {currentPage === 'qr-scan' && (
                <>📱 <strong>Scanner Mode:</strong> Verify products via QR codes</>
              )}
            </div>
            <p className="text-xs text-gray-500 text-center">
              ERI Platform v1.0
            </p>
          </div>
        </div>
      </motion.div>

    </>
  );
};