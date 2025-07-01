import React, { useState } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Navigation } from './components/Navigation';
import { LandingPage } from './pages/LandingPage';
import { ManufacturerPage } from './pages/ManufacturerPage';
import { UserPage } from './pages/UserPage';
import { ThemeProvider } from './contexts/ThemeContext';
import { WalletProvider } from './contexts/WalletContext';

function App() {
  const [currentPage, setCurrentPage] = useState<'landing' | 'manufacturer' | 'user'>('landing');

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'manufacturer':
        return <ManufacturerPage />;
      case 'user':
        return <UserPage />;
      default:
        return <LandingPage onPageChange={setCurrentPage} />;
    }
  };

  return (
    <ThemeProvider>
      <WalletProvider>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-blue-900/20 dark:to-purple-900/20 transition-colors duration-300">
          <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
          <main>{renderCurrentPage()}</main>
          
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
            toastClassName="backdrop-blur-xl bg-slate-800/90 border border-slate-700/50"
          />
        </div>
      </WalletProvider>
    </ThemeProvider>
  );
}

export default App;