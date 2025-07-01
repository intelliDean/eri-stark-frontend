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
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 dark:from-slate-950 dark:via-purple-950 dark:to-slate-950 transition-colors duration-300">
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
            toastClassName="backdrop-blur-xl bg-slate-800/90 border border-purple-500/30"
          />
        </div>
      </WalletProvider>
    </ThemeProvider>
  );
}

export default App;