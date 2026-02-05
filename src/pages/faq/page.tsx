import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface FAQQuestion {
  question: string;
  answer: string;
}

interface FAQCategory {
  category: string;
  questions: FAQQuestion[];
}

export default function FAQ() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [openItems, setOpenItems] = useState<number[]>([]);

  // FAQ data structure using proper translation keys
  const faqData: FAQCategory[] = [
    {
      category: t('faq.cat_general'),
      questions: [
        { question: t('faq.general.q1'), answer: t('faq.general.a1') },
        { question: t('faq.general.q2'), answer: t('faq.general.a2') },
        { question: t('faq.general.q3'), answer: t('faq.general.a3') }
      ]
    },
    {
      category: t('faq.cat_buyers'),
      questions: [
        { question: t('faq.buyers.q1'), answer: t('faq.buyers.a1') },
        { question: t('faq.buyers.q2'), answer: t('faq.buyers.a2') },
        { question: t('faq.buyers.q3'), answer: t('faq.buyers.a3') }
      ]
    },
    {
      category: t('faq.cat_suppliers'),
      questions: [
        { question: t('faq.suppliers.q1'), answer: t('faq.suppliers.a1') },
        { question: t('faq.suppliers.q2'), answer: t('faq.suppliers.a2') },
        { question: t('faq.suppliers.q3'), answer: t('faq.suppliers.a3') },
        { question: t('faq.suppliers.q4'), answer: t('faq.suppliers.a4') }
      ]
    },
    {
      category: t('faq.cat_technical'),
      questions: [
        { question: t('faq.technical.q1'), answer: t('faq.technical.a1') },
        { question: t('faq.technical.q2'), answer: t('faq.technical.a2') },
        { question: t('faq.technical.q3'), answer: t('faq.technical.a3') }
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