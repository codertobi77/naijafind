
import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function FAQ() {
  const [searchTerm, setSearchTerm] = useState('');
  const [openItems, setOpenItems] = useState<number[]>([]);

  const faqData = [
    {
      category: 'Général',
      questions: [
        {
          question: 'Qu\'est-ce que NaijaFind ?',
          answer: 'NaijaFind est un moteur de recherche géolocalisé qui vous permet de trouver facilement tous les fournisseurs du Nigeria. Notre plateforme connecte les entreprises avec les meilleurs fournisseurs locaux dans toutes les catégories.'
        },
        {
          question: 'Comment utiliser NaijaFind ?',
          answer: 'Il suffit d\'entrer ce que vous recherchez dans la barre de recherche, de spécifier votre localisation et de choisir une catégorie si nécessaire. Nos résultats sont triés par pertinence et proximité géographique.'
        },
        {
          question: 'NaijaFind est-il gratuit ?',
          answer: 'Oui, la recherche de fournisseurs sur NaijaFind est entièrement gratuite. Les fournisseurs peuvent également créer un profil de base gratuitement.'
        }
      ]
    },
    {
      category: 'Pour les acheteurs',
      questions: [
        {
          question: 'Comment contacter un fournisseur ?',
          answer: 'Sur la page de détail de chaque fournisseur, vous trouverez ses informations de contact : téléphone, email, et un formulaire de contact direct. Vous pouvez également utiliser notre assistant IA pour prendre rendez-vous.'
        },
        {
          question: 'Comment vérifier la fiabilité d\'un fournisseur ?',
          answer: 'Nous vérifions tous nos fournisseurs partenaires. Recherchez le badge "Vérifié" sur leur profil. Vous pouvez également consulter les avis et notes laissés par d\'autres clients.'
        },
        {
          question: 'Puis-je filtrer les résultats par distance ?',
          answer: 'Oui, vous pouvez définir un rayon de recherche (10, 25, 50 ou 100 km) pour trouver les fournisseurs les plus proches de votre localisation.'
        }
      ]
    },
    {
      category: 'Pour les fournisseurs',
      questions: [
        {
          question: 'Comment ajouter mon entreprise sur NaijaFind ?',
          answer: 'Cliquez sur "Ajouter votre entreprise" dans le menu principal, puis créez votre compte et remplissez les informations de votre entreprise. La création d\'un profil de base est gratuite.'
        },
        {
          question: 'Comment obtenir le badge "Vérifié" ?',
          answer: 'Après avoir créé votre profil, notre équipe vérifiera vos informations d\'entreprise. Ce processus prend généralement 2-3 jours ouvrables. Vous recevrez une notification une fois la vérification terminée.'
        },
        {
          question: 'Puis-je modifier mes informations après inscription ?',
          answer: 'Oui, vous pouvez modifier toutes vos informations depuis votre tableau de bord fournisseur. Les modifications importantes peuvent nécessiter une nouvelle vérification.'
        },
        {
          question: 'Comment améliorer la visibilité de mon entreprise ?',
          answer: 'Complétez entièrement votre profil, ajoutez des photos de qualité, encouragez vos clients à laisser des avis, et maintenez vos informations à jour. Nous proposons également des options premium pour plus de visibilité.'
        }
      ]
    },
    {
      category: 'Technique',
      questions: [
        {
          question: 'Sur quels appareils puis-je utiliser NaijaFind ?',
          answer: 'NaijaFind fonctionne sur tous les appareils : ordinateurs, tablettes et smartphones. Notre site web est optimisé pour tous les navigateurs modernes.'
        },
        {
          question: 'Mes données personnelles sont-elles sécurisées ?',
          answer: 'Oui, nous prenons la sécurité très au sérieux. Toutes vos données sont chiffrées et nous respectons strictement les réglementations sur la protection des données.'
        },
        {
          question: 'Que faire si je rencontre un problème technique ?',
          answer: 'Contactez notre support technique via la page Contact ou utilisez notre assistant IA. Nous répondons généralement dans les 24 heures.'
        }
      ]
    }
  ];

  const allQuestions = faqData.flatMap((category, categoryIndex) =>
    category.questions.map((q, questionIndex) => ({
      ...q,
      id: categoryIndex * 100 + questionIndex,
      category: category.category
    }))
  );

  const filteredQuestions = searchTerm
    ? allQuestions.filter(
        item =>
          item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : allQuestions;

  const toggleItem = (id: number) => {
    setOpenItems(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
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
            Questions fréquentes
          </h1>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            Trouvez rapidement des réponses à vos questions sur NaijaFind
          </p>
          
          {/* Search Bar */}
          <div className="max-w-md mx-auto">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher dans la FAQ..."
                className="w-full px-4 py-3 pl-12 rounded-lg border-0 focus:ring-2 focus:ring-white focus:ring-opacity-50 text-gray-900"
              />
              <i className="ri-search-line absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {searchTerm ? (
            // Search Results
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Résultats de recherche ({filteredQuestions.length})
              </h2>
              {filteredQuestions.length > 0 ? (
                filteredQuestions.map((item) => (
                  <div key={item.id} className="bg-white rounded-lg shadow-sm border">
                    <button
                      onClick={() => toggleItem(item.id)}
                      className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <span className="text-sm text-green-600 font-medium">{item.category}</span>
                        <h3 className="text-lg font-medium text-gray-900">{item.question}</h3>
                      </div>
                      <i className={`ri-arrow-${openItems.includes(item.id) ? 'up' : 'down'}-s-line text-gray-400 text-xl`}></i>
                    </button>
                    {openItems.includes(item.id) && (
                      <div className="px-6 pb-4">
                        <p className="text-gray-700">{item.answer}</p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <i className="ri-search-line text-6xl text-gray-400 mb-4"></i>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun résultat trouvé</h3>
                  <p className="text-gray-600">Essayez avec d'autres mots-clés</p>
                </div>
              )}
            </div>
          ) : (
            // Categories View
            <div className="space-y-8">
              {faqData.map((category, categoryIndex) => (
                <div key={categoryIndex} className="bg-white rounded-lg shadow-sm">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">{category.category}</h2>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {category.questions.map((item, questionIndex) => {
                      const itemId = categoryIndex * 100 + questionIndex;
                      return (
                        <div key={questionIndex}>
                          <button
                            onClick={() => toggleItem(itemId)}
                            className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                          >
                            <h3 className="text-lg font-medium text-gray-900">{item.question}</h3>
                            <i className={`ri-arrow-${openItems.includes(itemId) ? 'up' : 'down'}-s-line text-gray-400 text-xl`}></i>
                          </button>
                          {openItems.includes(itemId) && (
                            <div className="px-6 pb-4">
                              <p className="text-gray-700">{item.answer}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Vous ne trouvez pas votre réponse ?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Notre équipe support est là pour vous aider. Contactez-nous et nous vous répondrons rapidement.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact" className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium whitespace-nowrap">
              <i className="ri-mail-line mr-2"></i>
              Nous contacter
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
