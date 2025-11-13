import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function FAQ() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [openItems, setOpenItems] = useState<number[]>([]);

  const faqData = [
    {
      category: t('faq.cat_general'),
      questions: [
        {
          question: t('faq.cat_general') === 'General' ? 'What is NaijaFind?' : 'Qu\'est-ce que NaijaFind ?',
          answer: t('faq.cat_general') === 'General' ? 
            'NaijaFind is a geo-located search engine that allows you to easily find all suppliers in Nigeria. Our platform connects businesses with the best local suppliers in all categories.' : 
            'NaijaFind est un moteur de recherche géolocalisé qui vous permet de trouver facilement tous les fournisseurs du Nigeria. Notre plateforme connecte les entreprises avec les meilleurs fournisseurs locaux dans toutes les catégories.'
        },
        {
          question: t('faq.cat_general') === 'General' ? 'How to use NaijaFind?' : 'Comment utiliser NaijaFind ?',
          answer: t('faq.cat_general') === 'General' ? 
            'Simply enter what you are looking for in the search bar, specify your location and choose a category if necessary. Our results are sorted by relevance and geographical proximity.' : 
            'Il suffit d\'entrer ce que vous recherchez dans la barre de recherche, de spécifier votre localisation et de choisir une catégorie si nécessaire. Nos résultats sont triés par pertinence et proximité géographique.'
        },
        {
          question: t('faq.cat_general') === 'General' ? 'Is NaijaFind free?' : 'NaijaFind est-il gratuit ?',
          answer: t('faq.cat_general') === 'General' ? 
            'Yes, searching for suppliers on NaijaFind is completely free. Suppliers can also create a basic profile for free.' : 
            'Oui, la recherche de fournisseurs sur NaijaFind est entièrement gratuite. Les fournisseurs peuvent également créer un profil de base gratuitement.'
        }
      ]
    },
    {
      category: t('faq.cat_buyers'),
      questions: [
        {
          question: t('faq.cat_buyers') === 'For buyers' ? 'How to contact a supplier?' : 'Comment contacter un fournisseur ?',
          answer: t('faq.cat_buyers') === 'For buyers' ? 
            'On each supplier\'s detail page, you will find their contact information: phone, email, and a direct contact form. You can also use our AI assistant to schedule an appointment.' : 
            'Sur la page de détail de chaque fournisseur, vous trouverez ses informations de contact : téléphone, email, et un formulaire de contact direct. Vous pouvez également utiliser notre assistant IA pour prendre rendez-vous.'
        },
        {
          question: t('faq.cat_buyers') === 'For buyers' ? 'How to verify a supplier\'s reliability?' : 'Comment vérifier la fiabilité d\'un fournisseur ?',
          answer: t('faq.cat_buyers') === 'For buyers' ? 
            'We verify all our partner suppliers. Look for the "Verified" badge on their profile. You can also check reviews and ratings left by other customers.' : 
            'Nous vérifions tous nos fournisseurs partenaires. Recherchez le badge "Vérifié" sur leur profil. Vous pouvez également consulter les avis et notes laissés par d\'autres clients.'
        },
        {
          question: t('faq.cat_buyers') === 'For buyers' ? 'Can I filter results by distance?' : 'Puis-je filtrer les résultats par distance ?',
          answer: t('faq.cat_buyers') === 'For buyers' ? 
            'Yes, you can set a search radius (10, 25, 50 or 100 km) to find suppliers closest to your location.' : 
            'Oui, vous pouvez définir un rayon de recherche (10, 25, 50 ou 100 km) pour trouver les fournisseurs les plus proches de votre localisation.'
        }
      ]
    },
    {
      category: t('faq.cat_suppliers'),
      questions: [
        {
          question: t('faq.cat_suppliers') === 'For suppliers' ? 'How to add my business to NaijaFind?' : 'Comment ajouter mon entreprise sur NaijaFind ?',
          answer: t('faq.cat_suppliers') === 'For suppliers' ? 
            'Click on "Add your business" in the main menu, then create your account and fill in your business information. Creating a basic profile is free.' : 
            'Cliquez sur "Ajouter votre entreprise" dans le menu principal, puis créez votre compte et remplissez les informations de votre entreprise. La création d\'un profil de base est gratuite.'
        },
        {
          question: t('faq.cat_suppliers') === 'For suppliers' ? 'How to get the "Verified" badge?' : 'Comment obtenir le badge "Vérifié" ?',
          answer: t('faq.cat_suppliers') === 'For suppliers' ? 
            'After creating your profile, our team will verify your business information. This process usually takes 2-3 business days. You will receive a notification once verification is complete.' : 
            'Après avoir créé votre profil, notre équipe vérifiera vos informations d\'entreprise. Ce processus prend généralement 2-3 jours ouvrables. Vous recevrez une notification une fois la vérification terminée.'
        },
        {
          question: t('faq.cat_suppliers') === 'For suppliers' ? 'Can I modify my information after registration?' : 'Puis-je modifier mes informations après inscription ?',
          answer: t('faq.cat_suppliers') === 'For suppliers' ? 
            'Yes, you can modify all your information from your supplier dashboard. Major changes may require re-verification.' : 
            'Oui, vous pouvez modifier toutes vos informations depuis votre tableau de bord fournisseur. Les modifications importantes peuvent nécessiter une nouvelle vérification.'
        },
        {
          question: t('faq.cat_suppliers') === 'For suppliers' ? 'How to improve my business visibility?' : 'Comment améliorer la visibilité de mon entreprise ?',
          answer: t('faq.cat_suppliers') === 'For suppliers' ? 
            'Complete your profile fully, add quality photos, encourage your customers to leave reviews, and keep your information up to date. We also offer premium options for more visibility.' : 
            'Complétez entièrement votre profil, ajoutez des photos de qualité, encouragez vos clients à laisser des avis, et maintenez vos informations à jour. Nous proposons également des options premium pour plus de visibilité.'
        }
      ]
    },
    {
      category: t('faq.cat_technical'),
      questions: [
        {
          question: t('faq.cat_technical') === 'Technical' ? 'On which devices can I use NaijaFind?' : 'Sur quels appareils puis-je utiliser NaijaFind ?',
          answer: t('faq.cat_technical') === 'Technical' ? 
            'NaijaFind works on all devices: computers, tablets and smartphones. Our website is optimized for all modern browsers.' : 
            'NaijaFind fonctionne sur tous les appareils : ordinateurs, tablettes et smartphones. Notre site web est optimisé pour tous les navigateurs modernes.'
        },
        {
          question: t('faq.cat_technical') === 'Technical' ? 'Is my personal data secure?' : 'Mes données personnelles sont-elles sécurisées ?',
          answer: t('faq.cat_technical') === 'Technical' ? 
            'Yes, we take security very seriously. All your data is encrypted and we strictly comply with data protection regulations.' : 
            'Oui, nous prenons la sécurité très au sérieux. Toutes vos données sont chiffrées et nous respectons strictement les réglementations sur la protection des données.'
        },
        {
          question: t('faq.cat_technical') === 'Technical' ? 'What to do if I encounter a technical problem?' : 'Que faire si je rencontre un problème technique ?',
          answer: t('faq.cat_technical') === 'Technical' ? 
            'Contact our technical support via the Contact page or use our AI assistant. We usually respond within 24 hours.' : 
            'Contactez notre support technique via la page Contact ou utilisez notre assistant IA. Nous répondons généralement dans les 24 heures.'
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
            {t('faq.title')}
          </h1>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            {t('faq.subtitle')}
          </p>
          
          {/* Search Bar */}
          <div className="max-w-md mx-auto">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('faq.search_placeholder')}
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
                {t('faq.search_results')} ({filteredQuestions.length})
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
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('faq.no_results')}</h3>
                  <p className="text-gray-600">{t('faq.try_keywords')}</p>
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
            {t('faq.not_found_title')}
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            {t('faq.not_found_text')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact" className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium whitespace-nowrap">
              <i className="ri-mail-line mr-2"></i>
              {t('faq.contact_us')}
            </Link>
            <button 
              onClick={() => (document.querySelector('#vapi-widget-floating-button') as HTMLElement)?.click?.()}
              className="border-2 border-green-600 text-green-600 px-8 py-3 rounded-lg hover:bg-green-600 hover:text-white transition-colors font-medium whitespace-nowrap"
            >
              <i className="ri-chat-3-line mr-2"></i>
              {t('faq.live_chat')}
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
            <p>&copy; 2024 NaijaFind. {t('footer.rights')} | <a href="https://readdy.ai/?origin=logo" className="hover:text-white">{t('footer.powered_by')}</a></p>
          </div>
        </div>
      </footer>
    </div>
  );
}