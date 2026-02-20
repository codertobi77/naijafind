import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SignUp, useAuth, SignedIn, SignedOut } from '@clerk/clerk-react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useTranslation } from 'react-i18next';
import { AuthLayout } from '../../components/layout';
import { Link } from 'react-router-dom';

export default function Register() {
  const { t } = useTranslation();
  const { isSignedIn, isLoaded } = useAuth();
  const meData = useQuery(api.users.me, {});
  const navigate = useNavigate();

  // Redirect signed-in users to appropriate page based on their role
  useEffect(() => {
    if (isLoaded && isSignedIn && meData !== undefined && meData !== null) {
      // If user doesn't have a role yet, redirect to role selection
      if (meData.user && !meData.user.user_type) {
        navigate('/auth/choose-role', { replace: true });
      } else if (meData.user && meData.user.user_type === 'supplier') {
        // If supplier but no supplier profile, redirect to setup
        if (!meData.supplier) {
          navigate('/auth/supplier-setup', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      } else if (meData.user && meData.user.user_type === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [isLoaded, isSignedIn, meData, navigate]);

  // Show loading state while checking authentication
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  const benefits = [
    {
      icon: 'ri-search-line',
      iconColor: 'from-green-100 to-emerald-100',
      text: t('register.benefit1'),
    },
    {
      icon: 'ri-shield-check-line',
      iconColor: 'from-blue-100 to-indigo-100',
      text: t('register.benefit2'),
    },
    {
      icon: 'ri-rocket-line',
      iconColor: 'from-purple-100 to-pink-100',
      text: t('register.benefit3'),
    },
  ];

  return (
    <AuthLayout
      title={t('register.title')}
      subtitle={t('register.subtitle')}
      footerLinkText={t('register.already_member')}
      footerLinkTo="/auth/login"
      footerLinkLabel={t('register.login')}
      showBenefits={true}
      benefits={benefits}
    >
      <SignedOut>
        <div className="flex justify-center">
          <SignUp
            appearance={{
              variables: {
                colorPrimary: '#16a34a',
                borderRadius: '0.75rem',
              },
              elements: {
                card: 'shadow-none',
                formButtonPrimary: 'hover:bg-green-700 transition-colors duration-200',
                footerActionLink: 'text-green-600 hover:text-green-700',
              },
            }}
            routing="hash"
            afterSignUpUrl="/auth/check-role"
            signInUrl="/auth/login"
          />
        </div>
      </SignedOut>
      <SignedIn>
        <div className="text-center py-8 animate-scale-in">
          <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <i className="ri-checkbox-circle-line text-4xl text-green-600"></i>
          </div>
          <p className="text-gray-700 font-semibold mb-6 text-lg">{t('register.already_signed_in')}</p>
          <Link
            to="/"
            className="inline-flex items-center text-green-600 hover:text-green-700 font-semibold transition-colors px-6 py-3 rounded-xl bg-green-50 hover:bg-green-100"
          >
            <i className="ri-home-line mr-2 text-xl"></i>
            {t('register.home')}
          </Link>
        </div>
      </SignedIn>
    </AuthLayout>
  );
}
