import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import LanguageSelector from './LanguageSelector';
import { useConvexQuery } from '../../hooks/useConvexQuery';
import { api } from '../../../convex/_generated/api';

export default function Header() {
  const { t } = useTranslation();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: meData } = useConvexQuery(api.users.me, {}, { staleTime: 2 * 60 * 1000 });

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { path: '/', label: t('nav.home') },
    { path: '/search', label: t('nav.search') },
    { path: '/categories', label: t('nav.categories') },
    { path: '/about', label: t('nav.about') },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo */}
          <div className="flex items-center group">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <i className="ri-compass-3-fill text-white text-xl"></i>
              </div>
              <span 
                className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent" 
                style={{ fontFamily: "Pacifico, serif" }}
              >
                Olufinja
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  isActive(item.path)
                    ? 'text-green-600 bg-green-50'
                    : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right Section */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <LanguageSelector />
            
            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={mobileMenuOpen}
            >
              <i className={`${mobileMenuOpen ? 'ri-close-line' : 'ri-menu-line'} text-2xl`}></i>
            </button>

            <SignedOut>
              <Link 
                to="/auth/login" 
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-3 sm:px-6 py-2 sm:py-2.5 rounded-xl hover:shadow-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-medium whitespace-nowrap text-sm sm:text-base transform hover:-translate-y-0.5"
              >
                <span className="hidden sm:inline">{t('nav.login')}</span>
                <span className="sm:hidden">
                  <i className="ri-login-box-line"></i>
                </span>
              </Link>
              <Link 
                to="/auth/register" 
                className="border-2 border-green-600 text-green-600 px-3 sm:px-6 py-2 sm:py-2.5 rounded-xl hover:bg-green-50 hover:border-green-700 transition-all duration-300 font-medium whitespace-nowrap text-sm sm:text-base hidden sm:block"
              >
                {t('nav.register')}
              </Link>
            </SignedOut>
            
            <SignedIn>
              {meData?.user?.user_type === 'supplier' && (
                <Link 
                  to="/dashboard"
                  className="text-gray-700 hover:text-green-600 font-medium px-3 py-2 rounded-lg transition-colors hidden sm:block"
                >
                  {t('nav.dashboard')}
                </Link>
              )}
              {(meData?.user?.is_admin === true || meData?.user?.user_type === 'admin') && (
                <Link 
                  to="/admin"
                  className="text-gray-700 hover:text-green-600 font-medium px-3 py-2 rounded-lg transition-colors hidden sm:block"
                >
                  {t('nav.admin')}
                </Link>
              )}
              <div className="hidden sm:block">
                <UserButton 
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "w-10 h-10"
                    }
                  }}
                />
              </div>
              {/* Mobile User Button */}
              <div className="sm:hidden">
                <UserButton 
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8"
                    }
                  }}
                />
              </div>
            </SignedIn>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div 
        className={`md:hidden absolute top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-50 transition-all duration-300 ${
          mobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
      >
        <nav className="flex flex-col py-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-4 py-3 font-medium transition-colors flex items-center ${
                isActive(item.path)
                  ? 'text-green-600 bg-green-50'
                  : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <i className={`mr-3 ${
                item.path === '/' ? 'ri-home-line' :
                item.path === '/search' ? 'ri-search-line' :
                item.path === '/categories' ? 'ri-grid-line' :
                'ri-information-line'
              }`}></i>
              {item.label}
            </Link>
          ))}
          
          <div className="border-t border-gray-200 mt-2 pt-2">
            <SignedIn>
              {meData?.user?.user_type === 'supplier' && (
                <Link
                  to="/dashboard"
                  className="px-4 py-3 text-gray-700 hover:text-green-600 hover:bg-green-50 font-medium flex items-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <i className="ri-dashboard-line mr-3"></i>
                  {t('nav.dashboard')}
                </Link>
              )}
              {(meData?.user?.is_admin === true || meData?.user?.user_type === 'admin') && (
                <Link
                  to="/admin"
                  className="px-4 py-3 text-gray-700 hover:text-green-600 hover:bg-green-50 font-medium flex items-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <i className="ri-admin-line mr-3"></i>
                  {t('nav.admin')}
                </Link>
              )}
            </SignedIn>
            
            <SignedOut>
              <Link
                to="/auth/register"
                className="px-4 py-3 text-green-600 hover:bg-green-50 font-medium flex items-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                <i className="ri-user-add-line mr-3"></i>
                {t('nav.register')}
              </Link>
            </SignedOut>
          </div>
        </nav>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/20 z-40"
          onClick={() => setMobileMenuOpen(false)}
          style={{ top: '4rem' }}
        />
      )}
    </header>
  );
}
