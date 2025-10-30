
import { Link } from 'react-router-dom';

export default function Help() {
  const helpCategories = [
    {
      title: 'Premiers pas',
      icon: 'ri-rocket-line',
      description: 'Apprenez à utiliser NaijaFind efficacement',
      articles: [
        'Comment créer un compte',
        'Guide de recherche de fournisseurs',
        'Comprendre les résultats de recherche',
        'Utiliser les filtres avancés'
      ]
    },
    {
      title: 'Gestion de compte',
      icon: 'ri-user-settings-line',
      description: 'Gérez votre profil et vos préférences',
      articles: [
        'Modifier vos informations personnelles',
        'Gérer vos notifications',
        'Sécurité du compte',
        'Supprimer votre compte'
      ]
    },
    {
      title: 'Pour les fournisseurs',
      icon: 'ri-store-line',
      description: 'Tout savoir sur la gestion de votre entreprise',
      articles: [
        'Créer un profil fournisseur',
        'Optimiser votre visibilité',
        'Gérer vos avis clients',
        'Options premium'
      ]
    },
    {
      title: 'Facturation et paiements',
      icon: 'ri-money-dollar-circle-line',
      description: 'Informations sur les tarifs et paiements',
      articles: [
        'Plans tarifaires',
        'Méthodes de paiement acceptées',
        'Facturation et reçus',
        'Remboursements'
      ]
    },
    {
      title: 'Problèmes techniques',
      icon: 'ri-tools-line',
      description: 'Solutions aux problèmes courants',
      articles: [
        'Problèmes de connexion',
        'Erreurs de chargement',
        'Compatibilité navigateur',
        'Application mobile'
      ]
    },
    {
      title: 'Sécurité et confidentialité',
      icon: 'ri-shield-check-line',
      description: 'Protection de vos données',
      articles: [
        'Politique de confidentialité',
        'Sécurité des données',
        'Signaler un contenu inapproprié',
        'Conditions d\'utilisation'
      ]
    }
  ];

  const quickActions = [
    {
      title: 'Contacter le support',
      description: 'Obtenez de l\'aide personnalisée',
      icon: 'ri-customer-service-line',
      action: 'contact',
      color: 'green'
    },
    {
      title: 'Chat en direct',
      description: 'Assistance immédiate',
      icon: 'ri-chat-3-line',
      action: 'chat',
      color: 'blue'
    },
    {
      title: 'FAQ',
      description: 'Questions fréquentes',
      icon: 'ri-question-line',
      action: 'faq',
      color: 'purple'
    },
    {
      title: 'Tutoriels vidéo',
      description: 'Guides visuels',
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
                NaijaFind
              </Link>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link to="/" className="text-gray-700 hover:text-green-600 font-medium">Accueil</Link>
              <Link to="/search" className="text-gray-700 hover:text-green-600 font-medium">Recherche</Link>
              <Link to="/categories" className="text-gray-700 hover:text-green-600 font-medium">Catégories</Link>
              <Link to="/about" className="text-gray-700 hover:text-green-600 font-medium">À propos</Link>
            </nav>
            <div className="flex items-center space-x-4">
              <Link to="/auth/login" className="text-gray-700 hover:text-green-600 font-medium">
                Connexion
              </Link>
              <Link to="/auth/register" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap">
                Ajouter votre entreprise
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-green-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            Centre d'aide NaijaFind
          </h1>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            Trouvez des réponses, des guides et obtenez l'aide dont vous avez besoin
          </p>
          
          {/* Search Bar */}
          <div className="max-w-md mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher dans l'aide..."
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
            Actions rapides
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
            Parcourir par catégorie
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
                  Voir tous les articles
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
            Articles populaires
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                title: 'Comment créer un profil fournisseur efficace',
                description: 'Guide complet pour optimiser votre présence sur NaijaFind',
                readTime: '5 min',
                category: 'Fournisseurs'
              },
              {
                title: 'Utiliser les filtres de recherche avancés',
                description: 'Trouvez exactement ce que vous cherchez avec nos outils de recherche',
                readTime: '3 min',
                category: 'Recherche'
              },
              {
                title: 'Comprendre le système de vérification',
                description: 'Comment nous vérifions nos fournisseurs partenaires',
                readTime: '4 min',
                category: 'Sécurité'
              },
              {
                title: 'Gérer vos notifications et alertes',
                description: 'Personnalisez vos préférences de notification',
                readTime: '2 min',
                category: 'Compte'
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
                  Lire l'article <i className="ri-arrow-right-line ml-1"></i>
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
            Besoin d'aide supplémentaire ?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Notre équipe support est disponible pour vous aider avec toutes vos questions
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact" className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium whitespace-nowrap">
              <i className="ri-mail-line mr-2"></i>
              Contacter le support
            </Link>
            <button 
              onClick={() => document.querySelector('#vapi-widget-floating-button')?.click()}
              className="border-2 border-green-600 text-green-600 px-8 py-3 rounded-lg hover:bg-green-600 hover:text-white transition-colors font-medium whitespace-nowrap"
            >
              <i className="ri-chat-3-line mr-2"></i>
              Chat en direct
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
                NaijaFind
              </h3>
              <p className="text-gray-400">
                Le moteur de recherche géolocalisé de référence pour tous les fournisseurs du Nigeria.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Liens rapides</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/search" className="hover:text-white">Rechercher</Link></li>
                <li><Link to="/categories" className="hover:text-white">Catégories</Link></li>
                <li><Link to="/about" className="hover:text-white">À propos</Link></li>
                <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/help" className="hover:text-white">Centre d'aide</Link></li>
                <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link to="/faq" className="hover:text-white">FAQ</Link></li>
                <li><Link to="/privacy" className="hover:text-white">Confidentialité</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Suivez-nous</h4>
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
            <p>&copy; 2024 NaijaFind. Tous droits réservés. | <a href="https://readdy.ai/?origin=logo" className="hover:text-white">Powered by Readdy</a></p>
          </div>
        </div>
      </footer>
    </div>
  );
}
