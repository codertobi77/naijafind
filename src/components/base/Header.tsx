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

  // Primary navigation items (always visible on desktop)
  const primaryNavItems = [
    { path: '/', label: t('nav.home', 'Accueil') },
    { path: '/products', label: t('nav.products', 'Produits') },
    { path: '/search', label: t('nav.suppliers', 'Fournisseurs') },
  ];

  // Secondary navigation items (can be moved to dropdown or kept visible)
  const secondaryNavItems = [
    { path: '/purchase-request', label: t('nav.purchase_request', 'Demande d\'achat'), highlight: true },
    { path: '/categories', label: t('nav.categories', 'Catégories') },
    { path: '/about', label: t('nav.about', 'À propos') },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20 gap-4">
            
            {/* LEFT SECTION: Logo + Primary Navigation */}
            <div className="flex items-center gap-2 lg:gap-6 flex-1 min-w-0">
              {/* Logo */}
              <Link to="/" className="flex items-center gap-2 lg:gap-3 flex-shrink-0 group">
                <img 
                  src="/Suji Logo.webp" 
                  alt="Suji Logo" 
                  className="h-10 w-auto lg:h-14 transition-transform group-hover:scale-105" 
                />
                <span className="text-xl lg:text-2xl font-bold text-green-600 hidden sm:block truncate max-w-[120px] lg:max-w-none" style={{ fontFamily: 'Pacifico, serif' }}>
                  Suji
                </span>
              </Link>

              {/* Desktop Primary Navigation */}
              <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
                {primaryNavItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3 xl:px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap text-sm ${
                      isActive(item.path)
                        ? 'text-green-600 bg-green-50'
                        : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* CENTER: Flexible spacer (pushes right section) */}
            <div className="hidden lg:flex flex-1" />

            {/* RIGHT SECTION: Language + Auth Buttons */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {/* Language Selector */}
              <div className="flex-shrink-0">
                <LanguageSelector />
              </div>
              
              {/* Desktop Auth Buttons */}
              <SignedOut>
                <Link 
                  to="/auth/login" 
                  className="hidden sm:inline-flex items-center justify-center bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 lg:px-6 py-2 lg:py-2.5 rounded-xl hover:shadow-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-medium whitespace-nowrap text-sm transform hover:-translate-y-0.5"
                >
                  {t('nav.login')}
                </Link>
                <Link 
                  to="/auth/register" 
                  className="hidden lg:inline-flex items-center justify-center border-2 border-green-600 text-green-600 px-4 lg:px-6 py-2 lg:py-2.5 rounded-xl hover:bg-green-50 hover:border-green-700 transition-all duration-300 font-medium whitespace-nowrap text-sm"
                >
                  {t('nav.register')}
                </Link>
              </SignedOut>
              
              {/* Desktop User Actions */}
              <SignedIn>
                {/* Report Bug Button - Only visible on large screens */}
                {(meData?.user?.user_type === 'supplier' || meData?.user?.user_type === 'user') && (
                  <button
                    onClick={() => setBugReportOpen(true)}
                    className="hidden xl:flex items-center gap-2 text-gray-600 hover:text-red-600 font-medium px-3 py-2 rounded-lg transition-colors whitespace-nowrap"
                    title={t('bug_report.button')}
                  >
                    <i className="ri-bug-line text-lg"></i>
                    <span className="text-sm">{t('bug_report.button')}</span>
                  </button>
                )}
                
                {/* Dashboard/Admin Links */}
                {meData?.user?.user_type === 'supplier' && (
                  <Link 
                    to="/dashboard"
                    className="hidden lg:block text-gray-700 hover:text-green-600 font-medium px-3 py-2 rounded-lg transition-colors whitespace-nowrap text-sm"
                  >
                    {t('nav.dashboard')}
                  </Link>
                )}
                {(meData?.user?.is_admin === true || meData?.user?.user_type === 'admin') && (
                  <Link 
                    to="/admin"
                    className="hidden lg:block text-gray-700 hover:text-green-600 font-medium px-3 py-2 rounded-lg transition-colors whitespace-nowrap text-sm"
                  >
                    {t('nav.admin')}
                  </Link>
                )}
                
                {/* User Avatar */}
                <div className="hidden sm:block flex-shrink-0">
                  <UserButton 
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox: "w-9 h-9 lg:w-10 lg:h-10"
                      }
                    }}
                  />
                </div>
              </SignedIn>

              {/* Mobile Menu Button */}
              <button
                className="lg:hidden text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
                aria-expanded={mobileMenuOpen}
              >
                <i className={`${mobileMenuOpen ? 'ri-close-line' : 'ri-menu-line'} text-2xl`}></i>
              </button>
            </div>
          </div>
        </div>

      {/* Mobile Menu */}
      <div 
        className={`lg:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-50 transition-all duration-300 ${
          mobileMenuOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'
        }`}
      >
        <div className="max-h-[calc(100vh-4rem)] overflow-y-auto">
          <nav className="flex flex-col py-3 px-2">
            {/* Primary Navigation */}
            <div className="mb-3 pb-3 border-b border-gray-100">
              <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Navigation
              </p>
              {primaryNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-3 rounded-lg font-medium transition-colors flex items-center mb-1 ${
                    isActive(item.path)
                      ? 'text-green-600 bg-green-50'
                      : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <i className={`mr-3 text-lg ${
                    item.path === '/' ? 'ri-home-line' :
                    item.path === '/products' ? 'ri-shopping-bag-line' :
                    'ri-store-2-line'
                  }`}></i>
                  {item.label}
                </Link>
              ))}
            </div>
            
            {/* Secondary Navigation */}
            <div className="mb-3 pb-3 border-b border-gray-100">
              <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Menu
              </p>
              {secondaryNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-3 rounded-lg font-medium transition-colors flex items-center mb-1 ${
                    item.highlight
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md'
                      : isActive(item.path)
                      ? 'text-green-600 bg-green-50'
                      : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <i className={`mr-3 text-lg ${
                    item.path === '/purchase-request' ? 'ri-file-list-3-line' :
                    item.path === '/categories' ? 'ri-grid-line' :
                    'ri-information-line'
                  }`}></i>
                  {item.label}
                </Link>
              ))}
            </div>
            
            {/* User Actions */}
            <SignedIn>
              <div className="mb-3 pb-3 border-b border-gray-100">
                <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Compte
                </p>
                {meData?.user?.user_type === 'supplier' && (
                  <Link
                    to="/dashboard"
                    className="px-4 py-3 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg font-medium flex items-center mb-1"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <i className="ri-dashboard-line mr-3 text-lg"></i>
                    {t('nav.dashboard')}
                  </Link>
                )}
                {(meData?.user?.is_admin === true || meData?.user?.user_type === 'admin') && (
                  <Link
                    to="/admin"
                    className="px-4 py-3 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg font-medium flex items-center mb-1"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <i className="ri-admin-line mr-3 text-lg"></i>
                    {t('nav.admin')}
                  </Link>
                )}
                {/* Bug Report - Mobile */}
                {(meData?.user?.user_type === 'supplier' || meData?.user?.user_type === 'user') && (
                  <button
                    onClick={() => {
                      setBugReportOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg font-medium flex items-center mb-1"
                  >
                    <i className="ri-bug-line mr-3 text-lg"></i>
                    {t('bug_report.button')}
                  </button>
                )}
              </div>
            </SignedIn>
            
            {/* Auth Buttons - Mobile */}
            <SignedOut>
              <div className="flex flex-col gap-2 px-2 pb-2">
                <Link
                  to="/auth/login"
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-3 rounded-xl font-semibold text-center hover:shadow-lg transition-all"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/auth/register"
                  className="w-full border-2 border-green-600 text-green-600 px-4 py-3 rounded-xl font-semibold text-center hover:bg-green-50 transition-all"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('nav.register')}
                </Link>
              </div>
            </SignedOut>
          </nav>
        </div>
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
