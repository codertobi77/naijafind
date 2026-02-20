import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Help() {
  const { t } = useTranslation();

  const helpCategories = [
    {
      title: t('help.browse_category'),
      icon: 'ri-rocket-line',
      description: t('help.browse_category') === 'Browse by category' ? 
        'Learn to use Olufinja effectively' : 
        'Apprenez à utiliser Olufinja efficacement',
      articles: [
        t('help.browse_category') === 'Browse by category' ? 
          'How to create an account' : 
          'Comment créer un compte',
        t('help.browse_category') === 'Browse by category' ? 
          'Supplier search guide' : 
          'Guide de recherche de fournisseurs',
        t('help.browse_category') === 'Browse by category' ? 
          'Understanding search results' : 
          'Comprendre les résultats de recherche',
        t('help.browse_category') === 'Browse by category' ? 
          'Using advanced filters' : 
          'Utiliser les filtres avancés'
      ]
    },
    {
      title: t('help.browse_category') === 'Browse by category' ? 
        'Account management' : 
        'Gestion de compte',
      icon: 'ri-user-settings-line',
      description: t('help.browse_category') === 'Browse by category' ? 
        'Manage your profile and preferences' : 
        'Gérez votre profil et vos préférences',
      articles: [
        t('help.browse_category') === 'Browse by category' ? 
          'Edit your personal information' : 
          'Modifier vos informations personnelles',
        t('help.browse_category') === 'Browse by category' ? 
          'Manage your notifications' : 
          'Gérer vos notifications',
        t('help.browse_category') === 'Browse by category' ? 
          'Account security' : 
          'Sécurité du compte',
        t('help.browse_category') === 'Browse by category' ? 
          'Delete your account' : 
          'Supprimer votre compte'
      ]
    },
    {
      title: t('help.browse_category') === 'Browse by category' ? 
        'For suppliers' : 
        'Pour les fournisseurs',
      icon: 'ri-store-line',
      description: t('help.browse_category') === 'Browse by category' ? 
        'Everything about managing your business' : 
        'Tout savoir sur la gestion de votre entreprise',
      articles: [
        t('help.browse_category') === 'Browse by category' ? 
          'Create a supplier profile' : 
          'Créer un profil fournisseur',
        t('help.browse_category') === 'Browse by category' ? 
          'Optimize your visibility' : 
          'Optimiser votre visibilité',
        t('help.browse_category') === 'Browse by category' ? 
          'Manage customer reviews' : 
          'Gérer vos avis clients',
        t('help.browse_category') === 'Browse by category' ? 
          'Premium options' : 
          'Options premium'
      ]
    },
    {
      title: t('help.browse_category') === 'Browse by category' ? 
        'Billing and payments' : 
        'Facturation et paiements',
      icon: 'ri-money-dollar-circle-line',
      description: t('help.browse_category') === 'Browse by category' ? 
        'Information on rates and payments' : 
        'Informations sur les tarifs et paiements',
      articles: [
        t('help.browse_category') === 'Browse by category' ? 
          'Rate plans' : 
          'Plans tarifaires',
        t('help.browse_category') === 'Browse by category' ? 
          'Accepted payment methods' : 
          'Méthodes de paiement acceptées',
        t('help.browse_category') === 'Browse by category' ? 
          'Billing and receipts' : 
          'Facturation et reçus',
        t('help.browse_category') === 'Browse by category' ? 
          'Refunds' : 
          'Remboursements'
      ]
    },
    {
      title: t('help.browse_category') === 'Browse by category' ? 
        'Technical issues' : 
        'Problèmes techniques',
      icon: 'ri-tools-line',
      description: t('help.browse_category') === 'Browse by category' ? 
        'Solutions to common problems' : 
        'Solutions aux problèmes courants',
      articles: [
        t('help.browse_category') === 'Browse by category' ? 
          'Connection problems' : 
          'Problèmes de connexion',
        t('help.browse_category') === 'Browse by category' ? 
          'Loading errors' : 
          'Erreurs de chargement',
        t('help.browse_category') === 'Browse by category' ? 
          'Browser compatibility' : 
          'Compatibilité navigateur',
        t('help.browse_category') === 'Browse by category' ? 
          'Mobile application' : 
          'Application mobile'
      ]
    },
    {
      title: t('help.browse_category') === 'Browse by category' ? 
        'Security and privacy' : 
        'Sécurité et confidentialité',
      icon: 'ri-shield-check-line',
      description: t('help.browse_category') === 'Browse by category' ? 
        'Data protection' : 
        'Protection de vos données',
      articles: [
        t('help.browse_category') === 'Browse by category' ? 
          'Privacy policy' : 
          'Politique de confidentialité',
        t('help.browse_category') === 'Browse by category' ? 
          'Data security' : 
          'Sécurité des données',
        t('help.browse_category') === 'Browse by category' ? 
          'Report inappropriate content' : 
          'Signaler un contenu inapproprié',
        t('help.browse_category') === 'Browse by category' ? 
          'Terms of use' : 
          'Conditions d\'utilisation'
      ]
    }
  ];

  const quickActions = [
    {
      title: t('help.contact_support'),
      description: t('help.get_help'),
      icon: 'ri-customer-service-line',
      action: 'contact',
      color: 'green'
    },
    {
      title: t('help.live_chat'),
      description: t('help.immediate_assistance'),
      icon: 'ri-chat-3-line',
      action: 'chat',
      color: 'blue'
    },
    {
      title: t('nav.faq'),
      description: t('help.frequent_questions'),
      icon: 'ri-question-line',
      action: 'faq',
      color: 'purple'
    },
    {
      title: t('help.video_tutorials'),
      description: t('help.visual_guides'),
      icon: 'ri-play-circle-line',
      action: 'videos',
      color: 'red'
    }
  ];

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'contact':
        window.REACT_APP_NAVIGATE('/contact');
        break;
      case 'chat':
        document.querySelector('#vapi-widget-floating-button')?.click();
        break;
      case 'faq':
        window.REACT_APP_NAVIGATE('/faq');
        break;
      case 'videos':
        // Ouvrir une section vidéos ou rediriger vers YouTube
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold text-green-600" style={{ fontFamily: "Pacifico, serif" }}>
                Olufinja
              </Link>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link to="/" className="text-gray-700 hover:text-green-600 font-medium">{t('nav.home')}</Link>
              <Link to="/search" className="text-gray-700 hover:text-green-600 font-medium">{t('nav.search')}</Link>
              <Link to="/categories" className="text-gray-700 hover:text-green-600 font-medium">{t('nav.categories')}</Link>
              <Link to="/about" className="text-gray-700 hover:text-green-600 font-medium">{t('nav.about')}</Link>
            </nav>
            <div className="flex items-center space-x-4">
              <Link to="/auth/login" className="text-gray-700 hover:text-green-600 font-medium">
                {t('nav.login')}
              </Link>
              <Link to="/auth/register" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap">
                {t('about.add_business')}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-green-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            {t('help.title')}
          </h1>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            {t('help.subtitle')}
          </p>
          
          {/* Search Bar */}
          <div className="max-w-md mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder={t('help.search_placeholder')}
                className="w-full px-4 py-3 pl-12 rounded-lg border-0 focus:ring-2 focus:ring-white focus:ring-opacity-50 text-gray-900"
              />
              <i className="ri-search-line absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            {t('help.quick_actions')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleQuickAction(action.action)}
                className="bg-white border-2 border-gray-200 rounded-lg p-6 text-center hover:border-green-500 hover:shadow-lg transition-all cursor-pointer"
              >
                <div className={`w-16 h-16 bg-${action.color}-100 rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <i className={`${action.icon} text-2xl text-${action.color}-600`}></i>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{action.title}</h3>
                <p className="text-gray-600 text-sm">{action.description}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Help Categories */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            {t('help.browse_category')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {helpCategories.map((category, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                    <i className={`${category.icon} text-green-600 text-xl`}></i>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">{category.title}</h3>
                </div>
                
                <p className="text-gray-600 mb-6">{category.description}</p>
                
                <ul className="space-y-2">
                  {category.articles.map((article, articleIndex) => (
                    <li key={articleIndex}>
                      <a href="#" className="text-green-600 hover:text-green-700 text-sm flex items-center">
                        <i className="ri-arrow-right-s-line mr-1"></i>
                        {article}
                      </a>
                    </li>
                  ))}
                </ul>
                
                <button className="mt-6 w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm whitespace-nowrap">
                  {t('help.view_all_articles')}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Articles */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            {t('help.popular_articles')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                title: t('help.popular_articles') === 'Popular articles' ? 
                  'How to create an effective supplier profile' : 
                  'Comment créer un profil fournisseur efficace',
                description: t('help.popular_articles') === 'Popular articles' ? 
                  'Complete guide to optimizing your presence on Olufinja' : 
                  'Guide complet pour optimiser votre présence sur Olufinja',
                readTime: `5 ${t('help.read_time')}`,
                category: t('help.popular_articles') === 'Popular articles' ? 
                  'Suppliers' : 
                  'Fournisseurs'
              },
              {
                title: t('help.popular_articles') === 'Popular articles' ? 
                  'Using advanced search filters' : 
                  'Utiliser les filtres de recherche avancés',
                description: t('help.popular_articles') === 'Popular articles' ? 
                  'Find exactly what you\'re looking for with our search tools' : 
                  'Trouvez exactement ce que vous cherchez avec nos outils de recherche',
                readTime: `3 ${t('help.read_time')}`,
                category: t('help.popular_articles') === 'Popular articles' ? 
                  'Search' : 
                  'Recherche'
              },
              {
                title: t('help.popular_articles') === 'Popular articles' ? 
                  'Understanding the verification system' : 
                  'Comprendre le système de vérification',
                description: t('help.popular_articles') === 'Popular articles' ? 
                  'How we verify our partner suppliers' : 
                  'Comment nous vérifions nos fournisseurs partenaires',
                readTime: `4 ${t('help.read_time')}`,
                category: t('help.popular_articles') === 'Popular articles' ? 
                  'Security' : 
                  'Sécurité'
              },
              {
                title: t('help.popular_articles') === 'Popular articles' ? 
                  'Managing your notifications and alerts' : 
                  'Gérer vos notifications et alertes',
                description: t('help.popular_articles') === 'Popular articles' ? 
                  'Customize your notification preferences' : 
                  'Personnalisez vos préférences de notification',
                readTime: `2 ${t('help.read_time')}`,
                category: t('help.popular_articles') === 'Popular articles' ? 
                  'Account' : 
                  'Compte'
              }
            ].map((article, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center justify-between mb-3">
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                    {article.category}
                  </span>
                  <span className="text-gray-500 text-sm">{article.readTime}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{article.title}</h3>
                <p className="text-gray-600 mb-4">{article.description}</p>
                <a href="#" className="text-green-600 hover:text-green-700 font-medium text-sm">
                  {t('help.read_article')} <i className="ri-arrow-right-line ml-1"></i>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Support */}
      <section className="py-16 bg-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {t('help.need_more_help')}
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            {t('help.support_available')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact" className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium whitespace-nowrap">
              <i className="ri-mail-line mr-2"></i>
              {t('help.contact_support')}
            </Link>
            <button 
              onClick={() => (document.querySelector('#vapi-widget-floating-button') as HTMLElement)?.click?.()}
              className="border-2 border-green-600 text-green-600 px-8 py-3 rounded-lg hover:bg-green-600 hover:text-white transition-colors font-medium whitespace-nowrap"
            >
              <i className="ri-chat-3-line mr-2"></i>
              {t('help.live_chat')}
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4" style={{ fontFamily: "Pacifico, serif" }}>
                Olufinja
              </h3>
              <p className="text-gray-400">
                {t('footer.description')}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t('footer.quick_links')}</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/search" className="hover:text-white">{t('nav.search')}</Link></li>
                <li><Link to="/categories" className="hover:text-white">{t('nav.categories')}</Link></li>
                <li><Link to="/about" className="hover:text-white">{t('nav.about')}</Link></li>
                <li><Link to="/contact" className="hover:text-white">{t('nav.contact')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t('footer.support')}</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/help" className="hover:text-white">{t('nav.help')}</Link></li>
                <li><Link to="/contact" className="hover:text-white">{t('nav.contact')}</Link></li>
                <li><Link to="/faq" className="hover:text-white">{t('nav.faq')}</Link></li>
                <li><Link to="/privacy" className="hover:text-white">{t('nav.privacy')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t('footer.follow_us')}</h4>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  <i className="ri-facebook-fill text-xl"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <i className="ri-twitter-fill text-xl"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <i className="ri-linkedin-fill text-xl"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <i className="ri-instagram-fill text-xl"></i>
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Olufinja. {t('footer.rights')} | <a href="https://readdy.ai/?origin=logo" className="hover:text-white">{t('footer.powered_by')}</a></p>
          </div>
        </div>
      </footer>
    </div>
  );
}