import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface FooterProps {
  variant?: 'dark' | 'light';
  showLogo?: boolean;
}

export function Footer({ variant = 'dark', showLogo = true }: FooterProps) {
  const { t } = useTranslation();
  const isDark = variant === 'dark';

  const baseClasses = isDark
    ? 'bg-gray-900 text-white'
    : 'bg-white text-gray-900 border-t border-gray-200';

  const linkClasses = isDark
    ? 'text-gray-400 hover:text-white'
    : 'text-gray-600 hover:text-green-600';

  const subTextClasses = isDark ? 'text-gray-400' : 'text-gray-600';
  const borderClasses = isDark ? 'border-gray-800' : 'border-gray-200';

  return (
    <footer className={`${baseClasses} py-8 sm:py-12`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {showLogo && (
            <div className="sm:col-span-2 md:col-span-1">
              <Link
                to="/"
                className="flex items-center space-x-3 mb-4 group"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <i className="ri-compass-3-fill text-white text-xl"></i>
                </div>
                <span
                  className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent"
                  style={{ fontFamily: 'Pacifico, serif' }}
                >
                  Olufinja
                </span>
              </Link>
              <p className={`${subTextClasses} text-sm sm:text-base`}>
                {t('footer.description', 'Le moteur de recherche géolocalisé de référence pour tous les fournisseurs du Nigeria.')}
              </p>
            </div>
          )}
          <div>
            <h4 className="font-semibold mb-4">
              {t('footer.quick_links', 'Liens rapides')}
            </h4>
            <ul className={`space-y-2 text-sm sm:text-base ${subTextClasses}`}>
              <li>
                <Link to="/search" className={`${linkClasses} transition-colors`}>
                  {t('nav.search')}
                </Link>
              </li>
              <li>
                <Link to="/categories" className={`${linkClasses} transition-colors`}>
                  {t('nav.categories')}
                </Link>
              </li>
              <li>
                <Link to="/about" className={`${linkClasses} transition-colors`}>
                  {t('nav.about')}
                </Link>
              </li>
              <li>
                <Link to="/contact" className={`${linkClasses} transition-colors`}>
                  {t('nav.contact')}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">
              {t('footer.support', 'Support')}
            </h4>
            <ul className={`space-y-2 text-sm sm:text-base ${subTextClasses}`}>
              <li>
                <Link to="/help" className={`${linkClasses} transition-colors`}>
                  {t('nav.help')}
                </Link>
              </li>
              <li>
                <Link to="/contact" className={`${linkClasses} transition-colors`}>
                  {t('nav.contact')}
                </Link>
              </li>
              <li>
                <Link to="/faq" className={`${linkClasses} transition-colors`}>
                  {t('nav.faq')}
                </Link>
              </li>
              <li>
                <Link to="/privacy" className={`${linkClasses} transition-colors`}>
                  {t('nav.privacy')}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">
              {t('footer.follow_us', 'Suivez-nous')}
            </h4>
            <div className="flex space-x-4">
              <a href="#" className={`${linkClasses} transition-colors`}>
                <i className="ri-facebook-fill text-xl"></i>
              </a>
              <a href="#" className={`${linkClasses} transition-colors`}>
                <i className="ri-twitter-fill text-xl"></i>
              </a>
              <a href="#" className={`${linkClasses} transition-colors`}>
                <i className="ri-linkedin-fill text-xl"></i>
              </a>
              <a href="#" className={`${linkClasses} transition-colors`}>
                <i className="ri-instagram-fill text-xl"></i>
              </a>
            </div>
          </div>
        </div>
        <div className={`${isDark ? 'border-t' : 'border-t'} ${borderClasses} mt-6 sm:mt-8 pt-6 sm:pt-8 text-center ${subTextClasses} text-sm sm:text-base`}>
          <p>
            &copy; 2024 Olufinja. {t('footer.rights', 'Tous droits réservés')} |{' '}
            <a
              href="https://readdy.ai/?origin=logo"
              className={`${linkClasses} transition-colors`}
            >
              {t('footer.powered_by', 'Propulsé par Readdy AI')}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
