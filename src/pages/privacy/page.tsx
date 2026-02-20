import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Privacy() {
  const { t } = useTranslation();

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
            {t('privacy.title')}
          </h1>
          <p className="text-xl text-green-100 max-w-2xl mx-auto">
            {t('privacy.subtitle')}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="prose max-w-none">
              <p className="text-gray-600 mb-8">
                <strong>{t('privacy.last_update')}</strong> 15 décembre 2024
              </p>

              <div className="space-y-8">
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('privacy.intro_title')}</h2>
                  <p className="text-gray-700 mb-4">
                    {t('privacy.intro_title') === '1. Introduction' ? 
                      'Olufinja ("we", "our" or "ours") is committed to protecting and respecting your privacy. This privacy policy explains how we collect, use, store and protect your personal information when you use our platform.' : 
                      'Olufinja ("nous", "notre" ou "nos") s\'engage à protéger et respecter votre vie privée. Cette politique de confidentialité explique comment nous collectons, utilisons, stockons et protégeons vos informations personnelles lorsque vous utilisez notre plateforme.'}
                  </p>
                  <p className="text-gray-700">
                    {t('privacy.intro_title') === '1. Introduction' ? 
                      'By using Olufinja, you accept the practices described in this privacy policy.' : 
                      'En utilisant Olufinja, vous acceptez les pratiques décrites dans cette politique de confidentialité.'}
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('privacy.data_collection_title')}</h2>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{t('privacy.provided_info_title')}</h3>
                  <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                    <li>{t('privacy.provided_info_title') === '2.1 Information you provide us' ? 
                      'Account information (name, email, password)' : 
                      'Informations de compte (nom, email, mot de passe)'}</li>
                    <li>{t('privacy.provided_info_title') === '2.1 Information you provide us' ? 
                      'Supplier profile information (company name, description, location)' : 
                      'Informations de profil fournisseur (nom d\'entreprise, description, localisation)'}</li>
                    <li>{t('privacy.provided_info_title') === '2.1 Information you provide us' ? 
                      'Contact information (phone, address)' : 
                      'Informations de contact (téléphone, adresse)'}</li>
                    <li>{t('privacy.provided_info_title') === '2.1 Information you provide us' ? 
                      'Content you publish (reviews, comments, photos)' : 
                      'Contenu que vous publiez (avis, commentaires, photos)'}</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{t('privacy.auto_collected_title')}</h3>
                  <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                    <li>{t('privacy.auto_collected_title') === '2.2 Automatically collected information' ? 
                      'Navigation data (pages visited, time spent)' : 
                      'Données de navigation (pages visitées, temps passé)'}</li>
                    <li>{t('privacy.auto_collected_title') === '2.2 Automatically collected information' ? 
                      'Technical information (IP address, browser type)' : 
                      'Informations techniques (adresse IP, type de navigateur)'}</li>
                    <li>{t('privacy.auto_collected_title') === '2.2 Automatically collected information' ? 
                      'Geolocation data (with your consent)' : 
                      'Données de géolocalisation (avec votre consentement)'}</li>
                    <li>{t('privacy.auto_collected_title') === '2.2 Automatically collected information' ? 
                      'Cookies and similar technologies' : 
                      'Cookies et technologies similaires'}</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('privacy.data_usage_title')}</h2>
                  <p className="text-gray-700 mb-4">
                    {t('privacy.data_usage_title') === '3. How we use your information' ? 
                      'We use your information to:' : 
                      'Nous utilisons vos informations pour :'}
                  </p>
                  <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                    <li>{t('privacy.data_usage_title') === '3. How we use your information' ? 
                      'Provide and improve our services' : 
                      'Fournir et améliorer nos services'}</li>
                    <li>{t('privacy.data_usage_title') === '3. How we use your information' ? 
                      'Personalize your user experience' : 
                      'Personnaliser votre expérience utilisateur'}</li>
                    <li>{t('privacy.data_usage_title') === '3. How we use your information' ? 
                      'Facilitate connections between buyers and suppliers' : 
                      'Faciliter les connexions entre acheteurs et fournisseurs'}</li>
                    <li>{t('privacy.data_usage_title') === '3. How we use your information' ? 
                      'Send important notifications' : 
                      'Envoyer des notifications importantes'}</li>
                    <li>{t('privacy.data_usage_title') === '3. How we use your information' ? 
                      'Prevent fraud and ensure security' : 
                      'Prévenir la fraude et assurer la sécurité'}</li>
                    <li>{t('privacy.data_usage_title') === '3. How we use your information' ? 
                      'Comply with our legal obligations' : 
                      'Respecter nos obligations légales'}</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('privacy.data_sharing_title')}</h2>
                  <p className="text-gray-700 mb-4">
                    {t('privacy.data_sharing_title') === '4. Sharing your information' ? 
                      'We never sell your personal information. We may share your information in the following cases:' : 
                      'Nous ne vendons jamais vos informations personnelles. Nous pouvons partager vos informations dans les cas suivants :'}
                  </p>
                  <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                    <li>{t('privacy.data_sharing_title') === '4. Sharing your information' ? 
                      'With your explicit consent' : 
                      'Avec votre consentement explicite'}</li>
                    <li>{t('privacy.data_sharing_title') === '4. Sharing your information' ? 
                      'With our trusted service providers' : 
                      'Avec nos prestataires de services de confiance'}</li>
                    <li>{t('privacy.data_sharing_title') === '4. Sharing your information' ? 
                      'To comply with the law or protect our rights' : 
                      'Pour respecter la loi ou protéger nos droits'}</li>
                    <li>{t('privacy.data_sharing_title') === '4. Sharing your information' ? 
                      'In case of business merger or acquisition' : 
                      'En cas de fusion ou acquisition d\'entreprise'}</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('privacy.data_security_title')}</h2>
                  <p className="text-gray-700 mb-4">
                    {t('privacy.data_security_title') === '5. Data security' ? 
                      'We implement appropriate technical and organizational security measures to protect your information:' : 
                      'Nous mettons en place des mesures de sécurité techniques et organisationnelles appropriées pour protéger vos informations :'}
                  </p>
                  <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                    <li>{t('privacy.data_security_title') === '5. Data security' ? 
                      'Encryption of sensitive data' : 
                      'Chiffrement des données sensibles'}</li>
                    <li>{t('privacy.data_security_title') === '5. Data security' ? 
                      'Restricted access to personal information' : 
                      'Accès restreint aux informations personnelles'}</li>
                    <li>{t('privacy.data_security_title') === '5. Data security' ? 
                      'Continuous monitoring of our systems' : 
                      'Surveillance continue de nos systèmes'}</li>
                    <li>{t('privacy.data_security_title') === '5. Data security' ? 
                      'Regular training of our team' : 
                      'Formation régulière de notre équipe'}</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('privacy.your_rights_title')}</h2>
                  <p className="text-gray-700 mb-4">
                    {t('privacy.your_rights_title') === '6. Your rights' ? 
                      'You have the right to:' : 
                      'Vous avez le droit de :'}
                  </p>
                  <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                    <li>{t('privacy.your_rights_title') === '6. Your rights' ? 
                      'Access your personal information' : 
                      'Accéder à vos informations personnelles'}</li>
                    <li>{t('privacy.your_rights_title') === '6. Your rights' ? 
                      'Correct inaccurate information' : 
                      'Corriger des informations inexactes'}</li>
                    <li>{t('privacy.your_rights_title') === '6. Your rights' ? 
                      'Delete your information (right to be forgotten)' : 
                      'Supprimer vos informations (droit à l\'oubli)'}</li>
                    <li>{t('privacy.your_rights_title') === '6. Your rights' ? 
                      'Limit the processing of your data' : 
                      'Limiter le traitement de vos données'}</li>
                    <li>{t('privacy.your_rights_title') === '6. Your rights' ? 
                      'Data portability' : 
                      'Portabilité de vos données'}</li>
                    <li>{t('privacy.your_rights_title') === '6. Your rights' ? 
                      'Object to processing' : 
                      'Vous opposer au traitement'}</li>
                  </ul>
                  <p className="text-gray-700">
                    {t('privacy.your_rights_title') === '6. Your rights' ? 
                      'To exercise these rights, contact us at privacy@Olufinja.com' : 
                      'Pour exercer ces droits, contactez-nous à privacy@Olufinja.com'}
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('privacy.cookies_title')}</h2>
                  <p className="text-gray-700 mb-4">
                    {t('privacy.cookies_title') === '7. Cookies' ? 
                      'We use cookies to improve your experience. You can manage your cookie preferences in your browser settings.' : 
                      'Nous utilisons des cookies pour améliorer votre expérience. Vous pouvez gérer vos préférences de cookies dans les paramètres de votre navigateur.'}
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">{t('privacy.cookies_types_title')}</h4>
                    <ul className="list-disc list-inside text-gray-700 space-y-1">
                      <li>{t('privacy.cookies_types_title') === 'Types of cookies used:' ? 
                        'Essential cookies (site operation)' : 
                        'Cookies essentiels (fonctionnement du site)'}</li>
                      <li>{t('privacy.cookies_types_title') === 'Types of cookies used:' ? 
                        'Performance cookies (usage analysis)' : 
                        'Cookies de performance (analyse d\'utilisation)'}</li>
                      <li>{t('privacy.cookies_types_title') === 'Types of cookies used:' ? 
                        'Personalization cookies (user preferences)' : 
                        'Cookies de personnalisation (préférences utilisateur)'}</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('privacy.data_retention_title')}</h2>
                  <p className="text-gray-700 mb-4">
                    {t('privacy.data_retention_title') === '8. Data retention' ? 
                      'We retain your personal information as long as necessary to provide our services and comply with our legal obligations. Retention criteria include:' : 
                      'Nous conservons vos informations personnelles aussi longtemps que nécessaire pour fournir nos services et respecter nos obligations légales. Les critères de conservation incluent :'}
                  </p>
                  <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                    <li>{t('privacy.data_retention_title') === '8. Data retention' ? 
                      'Duration of your active account' : 
                      'Durée de votre compte actif'}</li>
                    <li>{t('privacy.data_retention_title') === '8. Data retention' ? 
                      'Legal and regulatory requirements' : 
                      'Exigences légales et réglementaires'}</li>
                    <li>{t('privacy.data_retention_title') === '8. Data retention' ? 
                      'Resolution of potential disputes' : 
                      'Résolution de litiges potentiels'}</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('privacy.international_transfers_title')}</h2>
                  <p className="text-gray-700 mb-4">
                    {t('privacy.international_transfers_title') === '9. International transfers' ? 
                      'Your data may be transferred and processed in countries other than Nigeria. We ensure that these transfers comply with appropriate protection standards.' : 
                      'Vos données peuvent être transférées et traitées dans des pays autres que le Nigeria. Nous nous assurons que ces transferts respectent les normes de protection appropriées.'}
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('privacy.policy_changes_title')}</h2>
                  <p className="text-gray-700 mb-4">
                    {t('privacy.policy_changes_title') === '10. Policy changes' ? 
                      'We may update this privacy policy. Significant changes will be notified to you by email or via our platform.' : 
                      'Nous pouvons mettre à jour cette politique de confidentialité. Les modifications importantes vous seront notifiées par email ou via notre plateforme.'}
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('privacy.contact_title')}</h2>
                  <p className="text-gray-700 mb-4">
                    {t('privacy.contact_title') === '11. Contact' ? 
                      'For any questions regarding this privacy policy, contact us:' : 
                      'Pour toute question concernant cette politique de confidentialité, contactez-nous :'}
                  </p>
                  <div className="bg-green-50 p-6 rounded-lg">
                    <ul className="space-y-2 text-gray-700">
                      <li><strong>{t('privacy.contact_email')}</strong> privacy@Olufinja.com</li>
                      <li><strong>{t('privacy.contact_address')}</strong> 123 Victoria Island, Lagos, Nigeria</li>
                      <li><strong>{t('privacy.contact_phone')}</strong> +234 1 234 5678</li>
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