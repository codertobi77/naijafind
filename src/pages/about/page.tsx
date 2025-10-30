
import { Link } from 'react-router-dom';

export default function About() {
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
              <Link to="/about" className="text-green-600 font-medium">À propos</Link>
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
      <section className="relative py-20 px-4 sm:px-6 lg:px-8"
               style={{
                 backgroundImage: `url('https://readdy.ai/api/search-image?query=Modern%20Nigerian%20business%20district%20with%20skyscrapers%20and%20traditional%20markets%2C%20aerial%20view%20of%20Lagos%20commercial%20area%2C%20blend%20of%20modern%20and%20traditional%20architecture%2C%20vibrant%20economic%20activity%2C%20professional%20photography%2C%20golden%20hour%20lighting&width=1200&height=400&seq=about-hero&orientation=landscape')`,
                 backgroundSize: 'cover',
                 backgroundPosition: 'center'
               }}>
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-white mb-6">
            À propos de NaijaFind
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            La plateforme de référence pour connecter les entreprises avec les meilleurs fournisseurs du Nigeria
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Notre Mission</h2>
              <p className="text-lg text-gray-700 mb-6">
                NaijaFind révolutionne la façon dont les entreprises trouvent et se connectent avec les fournisseurs au Nigeria. 
                Notre plateforme géolocalisée permet de découvrir facilement les meilleurs partenaires commerciaux dans tout le pays.
              </p>
              <p className="text-lg text-gray-700 mb-8">
                Nous croyons en la puissance de l'économie nigériane et nous nous engageons à faciliter les connexions 
                qui stimulent la croissance des entreprises locales.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">25,000+</div>
                  <div className="text-gray-600">Fournisseurs actifs</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">36</div>
                  <div className="text-gray-600">États couverts</div>
                </div>
              </div>
            </div>
            <div>
              <img
                src="https://readdy.ai/api/search-image?query=Nigerian%20business%20professionals%20shaking%20hands%20in%20modern%20office%2C%20diverse%20team%20of%20entrepreneurs%20collaborating%2C%20professional%20business%20meeting%2C%20modern%20corporate%20environment%2C%20natural%20lighting%2C%20success%20and%20partnership%20theme&width=600&height=400&seq=mission-image&orientation=landscape"
                alt="Notre mission"
                className="w-full h-96 object-cover object-top rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Nos Valeurs</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Les principes qui guident notre travail et notre engagement envers la communauté des affaires nigériane
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-8 text-center shadow-sm">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="ri-shield-check-line text-2xl text-green-600"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Confiance</h3>
              <p className="text-gray-600">
                Nous vérifions tous nos fournisseurs pour garantir la qualité et la fiabilité de nos partenaires.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-8 text-center shadow-sm">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="ri-global-line text-2xl text-green-600"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Accessibilité</h3>
              <p className="text-gray-600">
                Notre plateforme est accessible à tous, des petites entreprises aux grandes corporations.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-8 text-center shadow-sm">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="ri-rocket-line text-2xl text-green-600"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Innovation</h3>
              <p className="text-gray-600">
                Nous utilisons les dernières technologies pour améliorer l'expérience de recherche et de connexion.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Notre Équipe</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Des experts passionnés par le développement de l'écosystème entrepreneurial nigérian
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Adebayo Ogundimu',
                role: 'CEO & Fondateur',
                image: 'Professional Nigerian businessman in modern suit, confident smile, corporate headshot, modern office background, professional lighting'
              },
              {
                name: 'Fatima Abdullahi',
                role: 'Directrice Technique',
                image: 'Professional Nigerian businesswoman in elegant attire, confident expression, technology background, modern corporate setting, professional photography'
              },
              {
                name: 'Chinedu Okwu',
                role: 'Directeur Commercial',
                image: 'Professional Nigerian business executive in formal wear, friendly demeanor, modern office environment, natural lighting, corporate portrait'
              }
            ].map((member, index) => (
              <div key={index} className="text-center">
                <div className="w-48 h-48 mx-auto mb-6 rounded-full overflow-hidden">
                  <img
                    src={`https://readdy.ai/api/search-image?query=$%7Bmember.image%7D&width=300&height=300&seq=team-${index}&orientation=squarish`}
                    alt={member.name}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{member.name}</h3>
                <p className="text-green-600 font-medium">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-green-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Rejoignez la communauté NaijaFind
          </h2>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            Que vous soyez fournisseur ou acheteur, découvrez comment NaijaFind peut transformer votre activité
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth/register" className="bg-white text-green-600 px-8 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium whitespace-nowrap">
              Devenir fournisseur
            </Link>
            <Link to="/search" className="border-2 border-white text-white px-8 py-3 rounded-lg hover:bg-white hover:text-green-600 transition-colors font-medium whitespace-nowrap">
              Rechercher des fournisseurs
            </Link>
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
