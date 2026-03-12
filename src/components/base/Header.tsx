import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import LanguageSelector from './LanguageSelector';
import { useConvexQuery } from '../../hooks/useConvexQuery';
import { api } from '@convex/_generated/api';

export default function Header() {
  const { t } = useTranslation();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [bugReportOpen, setBugReportOpen] = useState(false);
  const [bugDescription, setBugDescription] = useState('');
  const [isSendingBug, setIsSendingBug] = useState(false);
  const [bugSent, setBugSent] = useState(false);
  const { data: meData } = useConvexQuery(api.users.me, {}, { staleTime: 2 * 60 * 1000 });

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { path: '/', label: t('nav.home') },
    { path: '/search', label: t('nav.suppliers') },
    { path: '/products', label: t('nav.products') },
    { path: '/categories', label: t('nav.categories') },
    { path: '/about', label: t('nav.about') },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo */}
          <div className="flex items-center group">
            <Link to="/" className="flex items-center space-x-2">
              <img src="/Suji Logo.webp" alt="Suji Logo" className="h-14 w-auto" />
              <span className="text-2xl font-bold text-green-600 hidden sm:block" style={{ fontFamily: 'Pacifico, serif' }}>
                Suji
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
              {/* Report Bug Button - Only for user and supplier pages */}
              {(meData?.user?.user_type === 'supplier' || meData?.user?.user_type === 'user') && (
                <button
                  onClick={() => setBugReportOpen(true)}
                  className="hidden sm:flex items-center gap-2 text-gray-600 hover:text-red-600 font-medium px-3 py-2 rounded-lg transition-colors"
                  title={t('bug_report.button')}
                >
                  <i className="ri-bug-line text-lg"></i>
                  <span className="hidden lg:inline">{t('bug_report.button')}</span>
                </button>
              )}
              
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
                item.path === '/search' ? 'ri-store-2-line' :
                item.path === '/products' ? 'ri-shopping-bag-line' :
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
    </header>

    {/* Bug Report Modal - Centered */}
    {bugReportOpen && (
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4 overflow-y-auto"
        onClick={() => {
          setBugReportOpen(false);
          setBugSent(false);
          setBugDescription('');
        }}
      >
        <div 
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <i className="ri-bug-line text-2xl"></i>
                <h3 className="text-xl font-bold">{t('bug_report.title')}</h3>
              </div>
              <button 
                onClick={() => {
                  setBugReportOpen(false);
                  setBugSent(false);
                  setBugDescription('');
                }}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                <i className="ri-close-line text-lg"></i>
              </button>
            </div>
            <p className="text-white/90 text-sm mt-1">{t('bug_report.description')}</p>
          </div>

          {/* Content */}
          <div className="p-6">
            {bugSent ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4">
                  <i className="ri-check-line text-3xl"></i>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{t('bug_report.success_title')}</h4>
                <p className="text-gray-500 text-sm">{t('bug_report.success_message')}</p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setIsSendingBug(true);
                  // Send email to admin
                  const subject = encodeURIComponent(`[BUG REPORT] - ${window.location.pathname}`);
                  const body = encodeURIComponent(`Bug signalé par: ${meData?.user?.email || 'Utilisateur'}\n\nPage: ${window.location.href}\n\nDescription:\n${bugDescription}`);
                  window.open(`mailto:admin@olufona.com?subject=${subject}&body=${body}`, '_blank');
                  setTimeout(() => {
                    setIsSendingBug(false);
                    setBugSent(true);
                    setBugDescription('');
                  }, 500);
                }}
              >
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('bug_report.label')}
                  </label>
                  <textarea
                    value={bugDescription}
                    onChange={(e) => setBugDescription(e.target.value)}
                    placeholder={t('bug_report.placeholder')}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all resize-none h-32"
                    required
                  />
                </div>
                <div className="text-sm text-gray-500 mb-4">
                  <i className="ri-information-line mr-1"></i>
                  {t('bug_report.note')}
                </div>
                <button
                  type="submit"
                  disabled={isSendingBug || !bugDescription.trim()}
                  className="w-full py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSendingBug ? (
                    <>
                      <i className="ri-loader-4-line animate-spin"></i>
                      {t('bug_report.sending')}
                    </>
                  ) : (
                    <>
                      <i className="ri-send-plane-line"></i>
                      {t('bug_report.send')}
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    )}
  </>);
}
