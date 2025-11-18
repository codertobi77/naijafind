import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SignIn, useAuth, SignedIn, SignedOut } from '@clerk/clerk-react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../../components/base/LanguageSelector';

export default function Login() {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-green-200 rounded-full filter blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-200 rounded-full filter blur-3xl opacity-30 translate-x-1/2 translate-y-1/2 animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-green-100 rounded-full filter blur-3xl opacity-20 -translate-x-1/2 -translate-y-1/2"></div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Link to="/" className="flex justify-center group mb-8">
          <div className="text-center">
            <div className="inline-flex items-center space-x-3 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <i className="ri-compass-3-fill text-white text-2xl"></i>
              </div>
              <span className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent group-hover:from-green-700 group-hover:to-emerald-700 transition-all duration-300" style={{ fontFamily: 'Pacifico, serif' }}>
                NaijaFind
              </span>
            </div>
            <div className="h-1 w-24 bg-gradient-to-r from-green-600 to-emerald-600 mx-auto rounded-full group-hover:w-32 transition-all duration-300 shadow-lg"></div>
          </div>
        </Link>
        <div className="mt-4 text-center animate-fade-in">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            {t('login.welcome')}
          </h2>
          <p className="text-lg sm:text-xl text-gray-600">
            {t('login.subtitle')}
          </p>
        </div>
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            {t('login.no_account')}{' '}
            <Link to="/auth/register" className="font-semibold text-green-600 hover:text-green-700 hover:underline transition-all duration-200">
              {t('login.register')}
            </Link>
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-10 px-6 shadow-2xl shadow-green-100/50 sm:rounded-3xl sm:px-12 border border-gray-100 transition-all duration-300 hover:shadow-3xl backdrop-blur-sm">
          <SignedOut>
            <div className="flex justify-center">
              <SignIn 
                appearance={{ 
                  variables: { 
                    colorPrimary: '#16a34a',
                    borderRadius: '0.75rem'
                  },
                  elements: {
                    card: 'shadow-none',
                    formButtonPrimary: 'hover:bg-green-700 transition-colors duration-200',
                    footerActionLink: 'text-green-600 hover:text-green-700'
                  }
                }} 
                routing="hash" 
                afterSignInUrl="/auth/check-role" 
                signUpUrl="/auth/register" 
              />
            </div>
          </SignedOut>
          <SignedIn>
            <div className="text-center py-8 animate-scale-in">
              <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <i className="ri-checkbox-circle-line text-4xl text-green-600"></i>
              </div>
              <p className="text-gray-700 font-semibold mb-6 text-lg">{t('login.already_signed_in')}</p>
              <Link to="/" className="inline-flex items-center text-green-600 hover:text-green-700 font-semibold transition-colors px-6 py-3 rounded-xl bg-green-50 hover:bg-green-100">
                <i className="ri-home-line mr-2 text-xl"></i>
                {t('login.home')}
              </Link>
            </div>
          </SignedIn>
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <Link to="/" className="inline-flex items-center text-gray-600 hover:text-green-600 font-medium transition-colors group">
              <i className="ri-arrow-left-line mr-2 group-hover:-translate-x-1 transition-transform"></i>
              {t('login.home')}
            </Link>
          </div>
        </div>

        {/* Additional info card */}
        <div className="mt-6 bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-100 shadow-soft">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                <i className="ri-information-line text-2xl text-white"></i>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-700 leading-relaxed">
                <span className="font-bold text-green-700 block mb-2">{t('login.new_to_naijafind')}</span>
                {t('login.create_account_benefits')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}