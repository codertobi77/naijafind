import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Header } from '../../components/base';
import { useConvexQuery } from '../../hooks/useConvexQuery';
import { api } from '../../../convex/_generated/api';
import { HeroSection, Section, Container, Footer } from '../../components/layout';
import { SectionTitle, CTASection, ValueCard, TeamGrid } from '../../components/ui';

export default function About() {
  const { t } = useTranslation();
  const { data: meData } = useConvexQuery(api.users.me, {}, { staleTime: 2 * 60 * 1000 });

  const values = [
    {
      icon: 'ri-shield-check-line',
      iconColor: 'text-green-600',
      iconBg: 'from-green-100 to-emerald-100',
      title: t('about.value_trust_title'),
      description: t('about.value_trust_text'),
    },
    {
      icon: 'ri-global-line',
      iconColor: 'text-blue-600',
      iconBg: 'from-blue-100 to-indigo-100',
      title: t('about.value_access_title'),
      description: t('about.value_access_text'),
    },
    {
      icon: 'ri-rocket-line',
      iconColor: 'text-purple-600',
      iconBg: 'from-purple-100 to-pink-100',
      title: t('about.value_innovation_title'),
      description: t('about.value_innovation_text'),
    },
  ];

  const teamMembers = [
    {
      name: 'Adebayo Ogundimu',
      role: t('about.team_ceo'),
      image: `https://readdy.ai/api/search-image?query=${encodeURIComponent('Professional Nigerian businessman in modern suit, confident smile, corporate headshot, modern office background, professional lighting')}&width=300&height=300&seq=team-0&orientation=squarish`,
    },
    {
      name: 'Fatima Abdullahi',
      role: t('about.team_cto'),
      image: `https://readdy.ai/api/search-image?query=${encodeURIComponent('Professional Nigerian businesswoman in elegant attire, confident expression, technology background, modern corporate setting, professional photography')}&width=300&height=300&seq=team-1&orientation=squarish`,
    },
    {
      name: 'Chinedu Okwu',
      role: t('about.team_cco'),
      image: `https://readdy.ai/api/search-image?query=${encodeURIComponent('Professional Nigerian business executive in formal wear, friendly demeanor, modern office environment, natural lighting, corporate portrait')}&width=300&height=300&seq=team-2&orientation=squarish`,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50">
      <Header />

      {/* Hero Section */}
      <HeroSection
        backgroundImage="https://readdy.ai/api/search-image?query=Modern%20Nigerian%20business%20district%20with%20skyscrapers%20and%20traditional%20markets%2C%20aerial%20view%20of%20Lagos%20commercial%20area%2C%20blend%20of%20modern%20and%20traditional%20architecture%2C%20vibrant%20economic%20activity%2C%20professional%20photography%2C%20golden%20hour%20lighting&width=1200&height=400&seq=about-hero&orientation=landscape"
        backgroundGradient="from-black/70 via-black/50 to-black/40"
        showBadge={true}
        badgeText="Our Story"
        badgeIcon="ri-information-line"
        title={t('about.title')}
        subtitle={t('about.subtitle')}
        className="py-24 sm:py-32"
      />

      {/* Mission Section */}
      <Section background="white">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center px-4 py-2 bg-green-100 rounded-full mb-6">
                <i className="ri-target-line text-green-600 mr-2"></i>
                <span className="text-green-700 text-sm font-semibold">Our Mission</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">{t('about.mission_title')}</h2>
              <p className="text-lg sm:text-xl text-gray-700 mb-6 leading-relaxed">{t('about.mission_text1')}</p>
              <p className="text-lg sm:text-xl text-gray-700 mb-10 leading-relaxed">{t('about.mission_text2')}</p>
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
        </Container>
      </Section>

      {/* Values Section */}
      <Section background="gradient">
        <Container>
          <SectionTitle
            badge={{ icon: 'ri-heart-line', text: 'Our Core Values' }}
            title={t('about.values_title')}
            subtitle={t('about.values_subtitle')}
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <ValueCard key={index} {...value} />
            ))}
          </div>
        </Container>
      </Section>

      {/* Team Section */}
      <Section background="white">
        <Container>
          <SectionTitle
            badge={{ icon: 'ri-team-line', text: t('about.our_leadership_label') }}
            title={t('about.team_title')}
            subtitle={t('about.team_subtitle')}
          />
          <TeamGrid members={teamMembers} columns={3} />
        </Container>
      </Section>

      {/* CTA Section */}
      <CTASection
        variant="dark"
        badge={{ icon: 'ri-rocket-line', text: 'Join Our Community' }}
        title={t('about.cta_title')}
        subtitle={t('about.cta_subtitle')}
        primaryAction={{
          to: '/auth/register',
          label: t('about.cta_become_supplier'),
          icon: 'ri-add-circle-line',
        }}
        secondaryAction={{
          to: '/search',
          label: t('about.cta_search_suppliers'),
          icon: 'ri-search-line',
        }}
      />

      {/* Footer */}
      <Footer variant="dark" showLogo={false} />
    </div>
  );
}
