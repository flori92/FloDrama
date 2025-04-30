import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-flo-black text-flo-white font-sans">
      <Header />
      <main className="flex-1 px-0 md:px-4 pt-4 pb-8 max-w-7xl mx-auto">
        {children || <Outlet />}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
