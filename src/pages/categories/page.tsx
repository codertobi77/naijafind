
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useConvexAuth } from 'convex/react';
import { api } from '../../../convex/_generated/api';

export default function Categories() {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const meData = useQuery(api.users.me, {});

  const handleAddBusinessClick = () => {
    if (!isLoading) {
      if (!isAuthenticated) {
        // Rediriger vers l'inscription avec type supplier
        navigate('/auth/register?type=supplier');
      } else {
        // Vérifier si l'utilisateur est déjà un fournisseur
        if (meData?.user?.user_type === 'supplier') {
          navigate('/dashboard');
        } else {
          // Rediriger vers une page de conversion ou créer le profil supplier
          navigate('/dashboard?action=become-supplier');
        }
      }
    }
  };

  const categories = [
    {
      name: 'Agriculture',
      icon: 'ri-plant-line',
      count: 5200,
      description: 'Produits agricoles, équipements, semences et services',
      subcategories: ['Céréales', 'Légumes', 'Fruits', 'Équipements agricoles', 'Semences'],
      image: 'Nigerian agricultural farm with green crops, farmers working in fields, traditional and modern farming equipment, fertile farmland, natural outdoor lighting'
    },
    {
      name: 'Textile',
      icon: 'ri-shirt-line',
      count: 3800,
      description: 'Tissus, vêtements, accessoires de mode',
      subcategories: ['Tissus traditionnels', 'Vêtements', 'Accessoires', 'Chaussures', 'Bijoux'],
      image: 'Colorful Nigerian traditional fabrics and textiles, vibrant patterns, Ankara prints, textile market stalls, beautiful fabric displays, warm lighting'
    },
    {
      name: 'Électronique',
      icon: 'ri-smartphone-line',
      count: 2900,
      description: 'Appareils électroniques, composants, accessoires',
      subcategories: ['Smartphones', 'Ordinateurs', 'Télévisions', 'Accessoires', 'Composants'],
      image: 'Modern electronics store with smartphones tablets computers, LED displays, high-tech gadgets, professional retail environment, bright lighting'
    },
    {
      name: 'Alimentation',
      icon: 'ri-restaurant-line',
      count: 4100,
      description: 'Produits alimentaires, boissons, épices',
      subcategories: ['Épices', 'Boissons', 'Produits frais', 'Conserves', 'Snacks'],
      image: 'Nigerian food market with fresh fruits vegetables spices, colorful food displays, traditional ingredients, bustling market atmosphere, natural lighting'
    },
    {
      name: 'Construction',
      icon: 'ri-building-line',
      count: 2300,
      description: 'Matériaux de construction, outils, équipements',
      subcategories: ['Ciment', 'Acier', 'Outils', 'Équipements', 'Finitions'],
      image: 'Construction site in Nigeria with building materials, cement bags, steel rods, construction equipment, workers in safety gear, industrial setting'
    },
    {
      name: 'Automobile',
      icon: 'ri-car-line',
      count: 1800,
      description: 'Véhicules, pièces détachées, accessoires auto',
      subcategories: ['Voitures', 'Motos', 'Pièces détachées', 'Accessoires', 'Services'],
      image: 'Nigerian car dealership with various vehicles, modern showroom, cars displayed professionally, automotive service center, bright showroom lighting'
    },
    {
      name: 'Santé & Beauté',
      icon: 'ri-heart-pulse-line',
      count: 1950,
      description: 'Produits de santé, cosmétiques, bien-être',
      subcategories: ['Cosmétiques', 'Médicaments', 'Équipements médicaux', 'Soins naturels', 'Fitness'],
      image: 'Nigerian beauty and health products store, cosmetics display, natural skincare products, modern pharmacy setting, clean professional environment'
    },
    {
      name: 'Éducation',
      icon: 'ri-book-line',
      count: 1200,
      description: 'Livres, fournitures scolaires, équipements éducatifs',
      subcategories: ['Livres', 'Fournitures', 'Équipements', 'Formation', 'E-learning'],
      image: 'Nigerian educational bookstore with textbooks, school supplies, learning materials, students browsing books, academic environment, natural lighting'
    },
    {
      name: 'Services',
      icon: 'ri-service-line',
      count: 3400,
      description: 'Services professionnels, consulting, maintenance',
      subcategories: ['Consulting', 'Maintenance', 'Nettoyage', 'Sécurité', 'Transport'],
      image: 'Nigerian professional services office, business consultants working, modern office environment, professional meeting, corporate setting'
    }
  ];

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="text-xl sm:text-2xl font-bold text-green-600" style={{ fontFamily: "Pacifico, serif" }}>
                NaijaFind
              </Link>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link to="/" className="text-gray-700 hover:text-green-600 font-medium">Accueil</Link>
              <Link to="/search" className="text-gray-700 hover:text-green-600 font-medium">Recherche</Link>
              <Link to="/categories" className="text-green-600 font-medium">Catégories</Link>
              <Link to="/about" className="text-gray-700 hover:text-green-600 font-medium">À propos</Link>
            </nav>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link to="/auth/login" className="text-gray-700 hover:text-green-600 font-medium text-sm sm:text-base">
                Connexion
              </Link>
              <button 
                onClick={handleAddBusinessClick}
                disabled={isLoading}
                className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="hidden sm:inline">Ajouter votre entreprise</span>
                <span className="sm:hidden">Ajouter</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-green-600 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Explorez toutes les catégories
          </h1>
          <p className="text-lg sm:text-xl text-green-100 mb-6 sm:mb-8 max-w-2xl mx-auto">
            Découvrez les fournisseurs par secteur d'activité et trouvez exactement ce que vous cherchez
          </p>
          
          {/* Search Bar */}
          <div className="max-w-md mx-auto">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher une catégorie..."
                className="w-full px-4 py-3 pl-12 rounded-lg border-0 focus:ring-2 focus:ring-white focus:ring-opacity-50 text-gray-900 text-sm sm:text-base"
              />
              <i className="ri-search-line absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredCategories.map((category, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer">
                <div className="h-40 sm:h-48 relative">
                  <img
                    src={`https://readdy.ai/api/search-image?query=$%7Bcategory.image%7D&width=400&height=300&seq=cat-${index}&orientation=landscape`}
                    alt={category.name}
                    className="w-full h-full object-cover object-top"
                  />
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="absolute top-4 left-4">
                    <div className="w-10 sm:w-12 h-10 sm:h-12 bg-white/90 rounded-full flex items-center justify-center">
                      <i className={`${category.icon} text-xl sm:text-2xl text-green-600`}></i>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900">{category.name}</h3>
                    <span className="bg-green-100 text-green-800 text-xs sm:text-sm font-medium px-2 py-1 rounded-full">
                      {category.count.toLocaleString()}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-4 text-sm sm:text-base">{category.description}</p>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Sous-catégories populaires :</h4>
                    <div className="flex flex-wrap gap-2">
                      {category.subcategories.slice(0, 3).map((sub, subIndex) => (
                        <span key={subIndex} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {sub}
                        </span>
                      ))}
                      {category.subcategories.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{category.subcategories.length - 3} autres
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <Link
                    to={`/search?category=${encodeURIComponent(category.name)}`}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-center block whitespace-nowrap text-sm sm:text-base"
                  >
                    Explorer cette catégorie
                  </Link>
                </div>
              </div>
            ))}
          </div>
          
          {filteredCategories.length === 0 && (
            <div className="text-center py-12">
              <i className="ri-search-line text-4xl sm:text-6xl text-gray-400 mb-4"></i>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Aucune catégorie trouvée</h3>
              <p className="text-gray-600 text-sm sm:text-base">Essayez avec d'autres mots-clés</p>
            </div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              NaijaFind en chiffres
            </h2>
            <p className="text-base sm:text-lg text-gray-600">
              La plateforme de référence pour les fournisseurs nigérians
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
            <div>
              <div className="text-2xl sm:text-4xl font-bold text-green-600 mb-2">25,000+</div>
              <div className="text-gray-600 text-sm sm:text-base">Fournisseurs vérifiés</div>
            </div>
            <div>
              <div className="text-2xl sm:text-4xl font-bold text-green-600 mb-2">500+</div>
              <div className="text-gray-600 text-sm sm:text-base">Catégories de produits</div>
            </div>
            <div>
              <div className="text-2xl sm:text-4xl font-bold text-green-600 mb-2">36</div>
              <div className="text-gray-600 text-sm sm:text-base">États couverts</div>
            </div>
            <div>
              <div className="text-2xl sm:text-4xl font-bold text-green-600 mb-2">1M+</div>
              <div className="text-gray-600 text-sm sm:text-base">Recherches mensuelles</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div className="sm:col-span-2 md:col-span-1">
              <h3 className="text-lg sm:text-xl font-bold mb-4" style={{ fontFamily: "Pacifico, serif" }}>
                NaijaFind
              </h3>
              <p className="text-gray-400 text-sm sm:text-base">
                Le moteur de recherche géolocalisé de référence pour tous les fournisseurs du Nigeria.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Liens rapides</h4>
              <ul className="space-y-2 text-gray-400 text-sm sm:text-base">
                <li><Link to="/search" className="hover:text-white">Rechercher</Link></li>
                <li><Link to="/categories" className="hover:text-white">Catégories</Link></li>
                <li><Link to="/about" className="hover:text-white">À propos</Link></li>
                <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400 text-sm sm:text-base">
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
          <div className="border-t border-gray-800 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-gray-400 text-sm sm:text-base">
            <p>&copy; 2024 NaijaFind. Tous droits réservés. | <a href="https://readdy.ai/?origin=logo" className="hover:text-white">Powered by Readdy</a></p>
          </div>
        </div>
      </footer>
    </div>
  );
}
