import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../../components/base/LanguageSelector';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { useConvexQuery } from '../../hooks/useConvexQuery';
import { api } from '../../../convex/_generated/api';

export default function About() {
  const { t } = useTranslation();
  const { data: meData } = useConvexQuery(api.users.me, {}, { staleTime: 2 * 60 * 1000 });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            <div className="flex items-center group">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                  <i className="ri-compass-3-fill text-white text-xl"></i>
                </div>
                <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent" style={{ fontFamily: "Pacifico, serif" }}>
                  NaijaFind
                </span>
              </Link>
            </div>
            <nav className="hidden md:flex space-x-1">
              <Link to="/" className="px-4 py-2 rounded-lg text-gray-700 hover:text-green-600 hover:bg-green-50 font-medium transition-all">{t('nav.home')}</Link>
              <Link to="/search" className="px-4 py-2 rounded-lg text-gray-700 hover:text-green-600 hover:bg-green-50 font-medium transition-all">{t('nav.search')}</Link>
              <Link to="/categories" className="px-4 py-2 rounded-lg text-gray-700 hover:text-green-600 hover:bg-green-50 font-medium transition-all">{t('nav.categories')}</Link>
              <Link to="/about" className="px-4 py-2 rounded-lg text-green-600 bg-green-50 font-medium transition-all">{t('nav.about')}</Link>
            </nav>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <LanguageSelector />
              <SignedOut>
                <Link to="/auth/login" className="text-gray-700 hover:text-green-600 font-medium px-4 py-2 rounded-lg hover:bg-green-50 transition-all">
                  {t('nav.login')}
                </Link>
                <Link to="/auth/register" className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 sm:px-6 py-2.5 rounded-xl hover:shadow-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-medium whitespace-nowrap transform hover:-translate-y-0.5">
                  {t('about.add_business')}
                </Link>
              </SignedOut>
              <SignedIn>
                {meData?.user?.user_type === 'supplier' && (
                  <Link 
                    to="/dashboard"
                    className="text-gray-700 hover:text-green-600 font-medium px-3 py-2 rounded-lg transition-colors hidden sm:block"
                  >
                    {t('nav.dashboard')}
                  </Link>
                )}
                <UserButton 
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "w-10 h-10"
                    }
                  }}
                />
              </SignedIn>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-24 sm:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden"
               style={{
                 backgroundImage: `url('https://readdy.ai/api/search-image?query=Modern%20Nigerian%20business%20district%20with%20skyscrapers%20and%20traditional%20markets%2C%20aerial%20view%20of%20Lagos%20commercial%20area%2C%20blend%20of%20modern%20and%20traditional%20architecture%2C%20vibrant%20economic%20activity%2C%20professional%20photography%2C%20golden%20hour%20lighting&width=1200&height=400&seq=about-hero&orientation=landscape')`,
                 backgroundSize: 'cover',
                 backgroundPosition: 'center'
               }}>
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/40"></div>
        <div className="relative max-w-7xl mx-auto text-center animate-fade-in-up">
          <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-6">
            <i className="ri-information-line text-white mr-2"></i>
            <span className="text-white/90 text-sm font-medium">Our Story</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            {t('about.title')}
          </h1>
          <p className="text-xl sm:text-2xl text-white/95 max-w-3xl mx-auto leading-relaxed">
            {t('about.subtitle')}
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center px-4 py-2 bg-green-100 rounded-full mb-6">
                <i className="ri-target-line text-green-600 mr-2"></i>
                <span className="text-green-700 text-sm font-semibold">Our Mission</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">{t('about.mission_title')}</h2>
              <p className="text-lg sm:text-xl text-gray-700 mb-6 leading-relaxed">
                {t('about.mission_text1')}
              </p>
              <p className="text-lg sm:text-xl text-gray-700 mb-10 leading-relaxed">
                {t('about.mission_text2')}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100 shadow-soft hover:shadow-md transition-all">
                  <div className="text-4xl sm:text-5xl font-bold text-gradient mb-3">25,000+</div>
                  <div className="text-gray-600 font-medium">{t('about.stat_suppliers')}</div>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 shadow-soft hover:shadow-md transition-all">
                  <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">36</div>
                  <div className="text-gray-600 font-medium">{t('about.stat_states')}</div>
                </div>
              </div>
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="rounded-3xl overflow-hidden shadow-2xl border-8 border-white">
                <img
                  src="https://readdy.ai/api/search-image?query=Nigerian%20business%20professionals%20shaking%20hands%20in%20modern%20office%2C%20diverse%20team%20of%20entrepreneurs%20collaborating%2C%20professional%20business%20meeting%2C%20modern%20corporate%20environment%2C%20natural%20lighting%2C%20success%20and%20partnership%20theme&width=600&height=400&seq=mission-image&orientation=landscape"
                  alt={t('about.mission_image_alt')}
                  className="w-full h-96 object-cover object-top hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in-up">
            <div className="inline-flex items-center px-4 py-2 bg-green-100 rounded-full mb-6">
              <i className="ri-heart-line text-green-600 mr-2"></i>
              <span className="text-green-700 text-sm font-semibold">Our Core Values</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">{t('about.values_title')}</h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              {t('about.values_subtitle')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group bg-white rounded-2xl p-8 text-center shadow-soft hover:shadow-xl transition-all duration-300 border border-gray-100 hover:-translate-y-2">
              <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                <i className="ri-shield-check-line text-3xl text-green-600"></i>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 group-hover:text-green-600 transition-colors">{t('about.value_trust_title')}</h3>
              <p className="text-gray-600 leading-relaxed">
                {t('about.value_trust_text')}
              </p>
            </div>
            
            <div className="group bg-white rounded-2xl p-8 text-center shadow-soft hover:shadow-xl transition-all duration-300 border border-gray-100 hover:-translate-y-2">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                <i className="ri-global-line text-3xl text-blue-600"></i>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">{t('about.value_access_title')}</h3>
              <p className="text-gray-600 leading-relaxed">
                {t('about.value_access_text')}
              </p>
            </div>
            
            <div className="group bg-white rounded-2xl p-8 text-center shadow-soft hover:shadow-xl transition-all duration-300 border border-gray-100 hover:-translate-y-2">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                <i className="ri-rocket-line text-3xl text-purple-600"></i>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 group-hover:text-purple-600 transition-colors">{t('about.value_innovation_title')}</h3>
              <p className="text-gray-600 leading-relaxed">
                {t('about.value_innovation_text')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in-up">
            <div className="inline-flex items-center px-4 py-2 bg-green-100 rounded-full mb-6">
              <i className="ri-team-line text-green-600 mr-2"></i>
              <span className="text-green-700 text-sm font-semibold">{t('about.our_leadership_label')}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">{t('about.team_title')}</h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              {t('about.team_subtitle')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              {
                name: 'Adebayo Ogundimu',
                role: t('about.team_ceo'),
                image: 'Professional Nigerian businessman in modern suit, confident smile, corporate headshot, modern office background, professional lighting'
              },
              {
                name: 'Fatima Abdullahi',
                role: t('about.team_cto'),
                image: 'Professional Nigerian businesswoman in elegant attire, confident expression, technology background, modern corporate setting, professional photography'
              },
              {
                name: 'Chinedu Okwu',
                role: t('about.team_cco'),
                image: 'Professional Nigerian business executive in formal wear, friendly demeanor, modern office environment, natural lighting, corporate portrait'
              }
            ].map((member, index) => (
              <div key={index} className="text-center group animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="w-48 h-48 mx-auto mb-8 rounded-3xl overflow-hidden shadow-xl border-4 border-white group-hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                  <img
                    src={`https://readdy.ai/api/search-image?query=${encodeURIComponent(member.image)}&width=300&height=300&seq=team-${index}&orientation=squarish`}
                    alt={member.name}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors">{member.name}</h3>
                <p className="text-green-600 font-semibold text-lg">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-emerald-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full filter blur-3xl"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-md rounded-full border border-white/30 mb-6">
            <i className="ri-rocket-line text-white mr-2"></i>
            <span className="text-white text-sm font-semibold">Join Our Community</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            {t('about.cta_title')}
          </h2>
          <p className="text-xl sm:text-2xl text-green-50 mb-10 max-w-2xl mx-auto leading-relaxed">
            {t('about.cta_subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth/register" className="bg-white text-green-600 px-8 py-4 rounded-xl hover:shadow-xl hover:bg-gray-50 transition-all duration-300 font-bold whitespace-nowrap text-base sm:text-lg transform hover:-translate-y-0.5">
              <i className="ri-add-circle-line mr-2"></i>
              {t('about.cta_become_supplier')}
            </Link>
            <Link to="/search" className="border-2 border-white text-white px-8 py-4 rounded-xl hover:bg-white hover:text-green-600 transition-all duration-300 font-bold whitespace-nowrap text-base sm:text-lg transform hover:-translate-y-0.5">
              <i className="ri-search-line mr-2"></i>
              {t('about.cta_search_suppliers')}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-1">
              <Link to="/" className="flex items-center space-x-3 mb-6 group">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                  <i className="ri-compass-3-fill text-white text-2xl"></i>
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent group-hover:from-green-300 group-hover:to-emerald-300 transition-all duration-300" style={{ fontFamily: "Pacifico, serif" }}>
                  NaijaFind
                </span>
              </Link>
              <p className="text-gray-400 text-sm leading-relaxed">
                {t('footer.description')}
              </p>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-6 flex items-center">
                <i className="ri-links-line mr-2 text-green-400"></i>
                {t('footer.quick_links')}
              </h4>
              <ul className="space-y-3">
                <li><Link to="/search" className="text-gray-400 hover:text-white transition-colors flex items-center group">
                  <i className="ri-arrow-right-s-line mr-2 text-green-400 group-hover:translate-x-1 transition-transform"></i>
                  {t('nav.search')}
                </Link></li>
                <li><Link to="/categories" className="text-gray-400 hover:text-white transition-colors flex items-center group">
                  <i className="ri-arrow-right-s-line mr-2 text-green-400 group-hover:translate-x-1 transition-transform"></i>
                  {t('nav.categories')}
                </Link></li>
                <li><Link to="/about" className="text-gray-400 hover:text-white transition-colors flex items-center group">
                  <i className="ri-arrow-right-s-line mr-2 text-green-400 group-hover:translate-x-1 transition-transform"></i>
                  {t('nav.about')}
                </Link></li>
                <li><Link to="/contact" className="text-gray-400 hover:text-white transition-colors flex items-center group">
                  <i className="ri-arrow-right-s-line mr-2 text-green-400 group-hover:translate-x-1 transition-transform"></i>
                  {t('nav.contact')}
                </Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-6 flex items-center">
                <i className="ri-customer-service-line mr-2 text-green-400"></i>
                {t('footer.support')}
              </h4>
              <ul className="space-y-3">
                <li><Link to="/help" className="text-gray-400 hover:text-white transition-colors flex items-center group">
                  <i className="ri-arrow-right-s-line mr-2 text-green-400 group-hover:translate-x-1 transition-transform"></i>
                  {t('nav.help')}
                </Link></li>
                <li><Link to="/contact" className="text-gray-400 hover:text-white transition-colors flex items-center group">
                  <i className="ri-arrow-right-s-line mr-2 text-green-400 group-hover:translate-x-1 transition-transform"></i>
                  {t('nav.contact')}
                </Link></li>
                <li><Link to="/faq" className="text-gray-400 hover:text-white transition-colors flex items-center group">
                  <i className="ri-arrow-right-s-line mr-2 text-green-400 group-hover:translate-x-1 transition-transform"></i>
                  {t('nav.faq')}
                </Link></li>
                <li><Link to="/privacy" className="text-gray-400 hover:text-white transition-colors flex items-center group">
                  <i className="ri-arrow-right-s-line mr-2 text-green-400 group-hover:translate-x-1 transition-transform"></i>
                  {t('nav.privacy')}
                </Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-6 flex items-center">
                <i className="ri-share-forward-line mr-2 text-green-400"></i>
                {t('footer.follow_us')}
              </h4>
              <div className="flex space-x-4 mb-6">
                <a href="#" className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-gradient-to-br hover:from-green-600 hover:to-emerald-600 transition-all duration-300 group">
                  <i className="ri-facebook-fill text-xl group-hover:scale-110 transition-transform"></i>
                </a>
                <a href="#" className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-gradient-to-br hover:from-green-600 hover:to-emerald-600 transition-all duration-300 group">
                  <i className="ri-twitter-fill text-xl group-hover:scale-110 transition-transform"></i>
                </a>
                <a href="#" className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-gradient-to-br hover:from-green-600 hover:to-emerald-600 transition-all duration-300 group">
                  <i className="ri-linkedin-fill text-xl group-hover:scale-110 transition-transform"></i>
                </a>
                <a href="#" className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-gradient-to-br hover:from-green-600 hover:to-emerald-600 transition-all duration-300 group">
                  <i className="ri-instagram-fill text-xl group-hover:scale-110 transition-transform"></i>
                </a>
              </div>
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-xl border border-gray-700">
                <p className="text-gray-400 text-sm flex items-center">
                  <i className="ri-shield-check-line mr-2 text-green-400"></i>
                  Secure & trusted platform
                </p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-500 text-sm">
            <p>&copy; 2024 NaijaFind. {t('footer.rights')} | <a href="https://readdy.ai/?origin=logo" className="text-green-400 hover:text-green-300 transition-colors">{t('footer.powered_by')}</a></p>
          </div>
        </div>
      </footer>
    </div>
  );
}