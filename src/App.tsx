import React, { useState, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Navigation } from './components/Navigation';
import { Sidebar } from './components/Sidebar';
import { LandingPage } from './pages/LandingPage';
import { ManufacturerPage } from './pages/ManufacturerPage';
import { UserPage } from './pages/UserPage';
import { QRScanPage } from './pages/QRScanPage';
import { ThemeProvider } from './contexts/ThemeContext';
import { WalletProvider } from './contexts/WalletContext';

function App() {
  const [currentPage, setCurrentPage] = useState<'landing' | 'manufacturer' | 'user' | 'qr-scan'>('landing');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState<string>('');

  // Handle URL parameters for QR code scanning
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const page = urlParams.get('page');
    const data = urlParams.get('data');
    
    if (page === 'qr-scan' && data) {
      setCurrentPage('qr-scan');
    }
  }, []);

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'manufacturer':
        return <ManufacturerPage activeFeature={activeFeature} />;
      case 'user':
        return <UserPage activeFeature={activeFeature} />;
      case 'qr-scan':
        return <QRScanPage />;
      default:
        return <LandingPage onPageChange={setCurrentPage} />;
    }
  };

  const showSidebar = currentPage !== 'landing';

  return (
    <ThemeProvider>
      <WalletProvider>
        <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-green-900 transition-colors duration-300 relative overflow-hidden">
          {/* Matrix-style background animation */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-green-400 to-transparent animate-matrix"></div>
            <div className="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-transparent via-green-400 to-transparent animate-matrix delay-1000"></div>
            <div className="absolute top-0 left-3/4 w-px h-full bg-gradient-to-b from-transparent via-green-400 to-transparent animate-matrix delay-2000"></div>
          </div>
          
          {/* Floating orbs */}
          <div className="absolute top-20 left-10 w-32 h-32 bg-green-500/10 rounded-full blur-xl animate-float"></div>
          <div className="absolute bottom-20 right-10 w-48 h-48 bg-green-400/5 rounded-full blur-2xl animate-float delay-1000"></div>
          
          <Navigation 
            currentPage={currentPage} 
            onPageChange={setCurrentPage}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            showSidebarToggle={showSidebar}
          />
          
          <div className="flex">
            {showSidebar && (
              <Sidebar 
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                activeFeature={activeFeature}
                onFeatureChange={setActiveFeature}
              />
            )}
            
            <main className={`flex-1 transition-all duration-300 ${showSidebar && sidebarOpen ? 'ml-64' : ''}`}>
              {renderCurrentPage()}
            </main>
          </div>
          
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="dark"
            toastClassName="backdrop-blur-xl bg-gray-800/90 border border-green-500/30"
          />
        </div>
      </WalletProvider>
    </ThemeProvider>
  );
}

export default App;