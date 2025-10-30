
import { Link } from 'react-router-dom';

export default function Privacy() {
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
            Politique de confidentialité
          </h1>
          <p className="text-xl text-green-100 max-w-2xl mx-auto">
            Votre vie privée est importante pour nous. Découvrez comment nous protégeons vos données.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="prose max-w-none">
              <p className="text-gray-600 mb-8">
                <strong>Dernière mise à jour :</strong> 15 décembre 2024
              </p>

              <div className="space-y-8">
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
                  <p className="text-gray-700 mb-4">
                    NaijaFind ("nous", "notre" ou "nos") s'engage à protéger et respecter votre vie privée. 
                    Cette politique de confidentialité explique comment nous collectons, utilisons, stockons et 
                    protégeons vos informations personnelles lorsque vous utilisez notre plateforme.
                  </p>
                  <p className="text-gray-700">
                    En utilisant NaijaFind, vous acceptez les pratiques décrites dans cette politique de confidentialité.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Informations que nous collectons</h2>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">2.1 Informations que vous nous fournissez</h3>
                  <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                    <li>Informations de compte (nom, email, mot de passe)</li>
                    <li>Informations de profil fournisseur (nom d'entreprise, description, localisation)</li>
                    <li>Informations de contact (téléphone, adresse)</li>
                    <li>Contenu que vous publiez (avis, commentaires, photos)</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-gray-900 mb-3">2.2 Informations collectées automatiquement</h3>
                  <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                    <li>Données de navigation (pages visitées, temps passé)</li>
                    <li>Informations techniques (adresse IP, type de navigateur)</li>
                    <li>Données de géolocalisation (avec votre consentement)</li>
                    <li>Cookies et technologies similaires</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Comment nous utilisons vos informations</h2>
                  <p className="text-gray-700 mb-4">Nous utilisons vos informations pour :</p>
                  <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                    <li>Fournir et améliorer nos services</li>
                    <li>Personnaliser votre expérience utilisateur</li>
                    <li>Faciliter les connexions entre acheteurs et fournisseurs</li>
                    <li>Envoyer des notifications importantes</li>
                    <li>Prévenir la fraude et assurer la sécurité</li>
                    <li>Respecter nos obligations légales</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Partage de vos informations</h2>
                  <p className="text-gray-700 mb-4">
                    Nous ne vendons jamais vos informations personnelles. Nous pouvons partager vos informations dans les cas suivants :
                  </p>
                  <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                    <li>Avec votre consentement explicite</li>
                    <li>Avec nos prestataires de services de confiance</li>
                    <li>Pour respecter la loi ou protéger nos droits</li>
                    <li>En cas de fusion ou acquisition d'entreprise</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Sécurité des données</h2>
                  <p className="text-gray-700 mb-4">
                    Nous mettons en place des mesures de sécurité techniques et organisationnelles appropriées pour protéger vos informations :
                  </p>
                  <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                    <li>Chiffrement des données sensibles</li>
                    <li>Accès restreint aux informations personnelles</li>
                    <li>Surveillance continue de nos systèmes</li>
                    <li>Formation régulière de notre équipe</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Vos droits</h2>
                  <p className="text-gray-700 mb-4">Vous avez le droit de :</p>
                  <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                    <li>Accéder à vos informations personnelles</li>
                    <li>Corriger des informations inexactes</li>
                    <li>Supprimer vos informations (droit à l'oubli)</li>
                    <li>Limiter le traitement de vos données</li>
                    <li>Portabilité de vos données</li>
                    <li>Vous opposer au traitement</li>
                  </ul>
                  <p className="text-gray-700">
                    Pour exercer ces droits, contactez-nous à privacy@naijafind.com
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Cookies</h2>
                  <p className="text-gray-700 mb-4">
                    Nous utilisons des cookies pour améliorer votre expérience. Vous pouvez gérer vos préférences de cookies 
                    dans les paramètres de votre navigateur.
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Types de cookies utilisés :</h4>
                    <ul className="list-disc list-inside text-gray-700 space-y-1">
                      <li>Cookies essentiels (fonctionnement du site)</li>
                      <li>Cookies de performance (analyse d'utilisation)</li>
                      <li>Cookies de personnalisation (préférences utilisateur)</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Conservation des données</h2>
                  <p className="text-gray-700 mb-4">
                    Nous conservons vos informations personnelles aussi longtemps que nécessaire pour fournir nos services 
                    et respecter nos obligations légales. Les critères de conservation incluent :
                  </p>
                  <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                    <li>Durée de votre compte actif</li>
                    <li>Exigences légales et réglementaires</li>
                    <li>Résolution de litiges potentiels</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Transferts internationaux</h2>
                  <p className="text-gray-700 mb-4">
                    Vos données peuvent être transférées et traitées dans des pays autres que le Nigeria. 
                    Nous nous assurons que ces transferts respectent les normes de protection appropriées.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Modifications de cette politique</h2>
                  <p className="text-gray-700 mb-4">
                    Nous pouvons mettre à jour cette politique de confidentialité. Les modifications importantes 
                    vous seront notifiées par email ou via notre plateforme.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contact</h2>
                  <p className="text-gray-700 mb-4">
                    Pour toute question concernant cette politique de confidentialité, contactez-nous :
                  </p>
                  <div className="bg-green-50 p-6 rounded-lg">
                    <ul className="space-y-2 text-gray-700">
                      <li><strong>Email :</strong> privacy@naijafind.com</li>
                      <li><strong>Adresse :</strong> 123 Victoria Island, Lagos, Nigeria</li>
                      <li><strong>Téléphone :</strong> +234 1 234 5678</li>
                    </ul>
                  </div>
                </section>
              </div>
            </div>
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
