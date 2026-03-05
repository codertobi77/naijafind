import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Terms() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold text-green-600" style={{ fontFamily: "Pacifico, serif" }}>
                Suji
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
            Terms of Service – Suji
          </h1>
          <p className="text-xl text-green-100 max-w-2xl mx-auto">
            {t('terms.subtitle')}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="prose max-w-none">
              <p className="text-gray-600 mb-8">
                <strong>Last Updated:</strong> March 4, 2026
              </p>

              <div className="space-y-8">
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
                  <p className="text-gray-700 mb-4">
                    Welcome to Suji.
                  </p>
                  <p className="text-gray-700 mb-4">
                    These Terms of Service ("Terms") govern your access to and use of the Suji platform,
                    including all services, features, and content provided through the website.
                  </p>
                  <p className="text-gray-700">
                    By accessing or using the Suji platform, you agree to comply with these Terms.
                    If you do not agree with these Terms, you should not use the platform.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description of the Platform</h2>
                  <p className="text-gray-700 mb-4">
                    Suji is an online platform designed to connect buyers with suppliers,
                    particularly suppliers based in Nigeria.
                  </p>
                  <p className="text-gray-700 mb-4">
                    Suji provides tools that allow users to:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                    <li>Discover suppliers</li>
                    <li>View supplier profiles</li>
                    <li>Contact suppliers directly</li>
                    <li>Share reviews and feedback</li>
                  </ul>
                  <p className="text-gray-700">
                    Suji does not manufacture, sell, store, or deliver products listed by suppliers.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Accounts</h2>
                  <p className="text-gray-700 mb-4">
                    To access certain features of the platform, users may be required to create an account.
                  </p>
                  <p className="text-gray-700 mb-4">
                    You agree to:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                    <li>Provide accurate and complete information</li>
                    <li>Keep your login credentials secure</li>
                    <li>Notify us immediately of any unauthorized access</li>
                  </ul>
                  <p className="text-gray-700 mb-4">
                    You are responsible for all activities that occur under your account.
                  </p>
                  <p className="text-gray-700">
                    Suji reserves the right to suspend or terminate accounts that violate these Terms.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Supplier Responsibility</h2>
                  <p className="text-gray-700 mb-4">
                    Suppliers are solely responsible for:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                    <li>The accuracy of their business information</li>
                    <li>The quality of products or services offered</li>
                    <li>Product pricing and descriptions</li>
                    <li>Delivery arrangements</li>
                    <li>Compliance with applicable laws and regulations</li>
                  </ul>
                  <p className="text-gray-700">
                    Suppliers must ensure that the information published on the platform is truthful and not misleading.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Buyer Responsibility</h2>
                  <p className="text-gray-700 mb-4">
                    Buyers using the platform agree to:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                    <li>Use the platform in good faith</li>
                    <li>Verify suppliers before making transactions</li>
                    <li>Respect suppliers and other users</li>
                    <li>Avoid fraudulent or abusive behavior</li>
                  </ul>
                  <p className="text-gray-700">
                    All commercial transactions occur directly between buyers and suppliers.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Platform Role and Limitation of Liability</h2>
                  <p className="text-gray-700 mb-4">
                    Suji acts only as a digital intermediary connecting buyers and suppliers.
                  </p>
                  <p className="text-gray-700 mb-4">
                    Suji does not:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                    <li>Guarantee the quality of products</li>
                    <li>Guarantee supplier reliability</li>
                    <li>Participate in negotiations or payments</li>
                    <li>Handle shipping or delivery</li>
                  </ul>
                  <p className="text-gray-700 mb-4">
                    Suji shall not be held responsible for:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                    <li>Product quality issues</li>
                    <li>Delivery delays</li>
                    <li>Payment disputes</li>
                    <li>Business losses resulting from transactions</li>
                  </ul>
                  <p className="text-gray-700">
                    Users engage with suppliers at their own risk.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Prohibited Activities</h2>
                  <p className="text-gray-700 mb-4">
                    Users are prohibited from:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                    <li>Publishing false or misleading information</li>
                    <li>Uploading illegal or harmful content</li>
                    <li>Harassing other users</li>
                    <li>Attempting to hack or disrupt the platform</li>
                    <li>Using the platform for fraudulent activities</li>
                  </ul>
                  <p className="text-gray-700">
                    Suji reserves the right to remove any content that violates these rules.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Intellectual Property</h2>
                  <p className="text-gray-700 mb-4">
                    All content on the Suji platform including:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                    <li>Logos</li>
                    <li>Design</li>
                    <li>Text</li>
                    <li>Software</li>
                    <li>Graphics</li>
                  </ul>
                  <p className="text-gray-700">
                    are the property of Suji or its licensors.
                  </p>
                  <p className="text-gray-700">
                    Users may not copy, distribute, or reproduce platform content without permission.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Account Suspension or Termination</h2>
                  <p className="text-gray-700 mb-4">
                    Suji may suspend or terminate accounts if users:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                    <li>Violate these Terms</li>
                    <li>Engage in fraudulent behavior</li>
                    <li>Post illegal or misleading content</li>
                  </ul>
                  <p className="text-gray-700">
                    Termination may occur without prior notice in serious cases.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Changes to the Terms</h2>
                  <p className="text-gray-700 mb-4">
                    Suji may update these Terms of Service at any time.
                  </p>
                  <p className="text-gray-700 mb-4">
                    Users will be notified of significant changes through:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                    <li>Email notifications</li>
                    <li>Notices on the platform</li>
                  </ul>
                  <p className="text-gray-700">
                    Continued use of the platform after updates constitutes acceptance of the revised Terms.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Governing Law</h2>
                  <p className="text-gray-700 mb-4">
                    These Terms shall be governed and interpreted according to the laws applicable in Nigeria.
                  </p>
                  <p className="text-gray-700">
                    Any disputes arising from the use of the platform shall be subject to the competent courts.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact Information</h2>
                  <p className="text-gray-700 mb-4">
                    If you have any questions regarding these Terms, please contact us:
                  </p>
                  <div className="bg-green-50 p-6 rounded-lg">
                    <ul className="space-y-2 text-gray-700">
                      <li><strong>Email:</strong> suji@olufona.com</li>
                      <li><strong>Address:</strong> 234, GCL Plaza, 7th Avenue, Festac Town, Lagos, Nigeria</li>
                      <li><strong>Phone:</strong> +234 9128227800</li>
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
                Suji
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
            <p>&copy; 2026 Suji. {t('footer.rights')} | <Link to="/terms" className="hover:text-white mr-2">Terms of Service</Link> | <Link to="/privacy" className="hover:text-white">Privacy Policy</Link></p>
          </div>
        </div>
      </footer>
    </div>
  );
}
