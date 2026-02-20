import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  footerLinkText?: string;
  footerLinkTo?: string;
  footerLinkLabel?: string;
  showBenefits?: boolean;
  benefits?: Array<{
    icon: string;
    iconColor: string;
    text: string;
  }>;
  infoCard?: {
    title: string;
    description: string;
  };
}

export function AuthLayout({
  children,
  title,
  subtitle,
  footerLinkText,
  footerLinkTo,
  footerLinkLabel,
  showBenefits = false,
  benefits = [],
  infoCard,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-green-200 rounded-full filter blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
      <div
        className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-200 rounded-full filter blur-3xl opacity-30 translate-x-1/2 translate-y-1/2 animate-pulse"
        style={{ animationDelay: '1s' }}
      ></div>
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-green-100 rounded-full filter blur-3xl opacity-20 -translate-x-1/2 -translate-y-1/2"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Logo */}
        <Link to="/" className="flex justify-center group mb-8">
          <div className="text-center">
            <div className="inline-flex items-center space-x-3 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <i className="ri-compass-3-fill text-white text-2xl"></i>
              </div>
              <span
                className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent group-hover:from-green-700 group-hover:to-emerald-700 transition-all duration-300"
                style={{ fontFamily: 'Pacifico, serif' }}
              >
                Olufinja
              </span>
            </div>
            <div className="h-1 w-24 bg-gradient-to-r from-green-600 to-emerald-600 mx-auto rounded-full group-hover:w-32 transition-all duration-300 shadow-lg"></div>
          </div>
        </Link>

        {/* Title */}
        <div className="mt-4 text-center animate-fade-in">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">{title}</h2>
          {subtitle && (
            <p className="text-lg sm:text-xl text-gray-600">{subtitle}</p>
          )}
        </div>

        {/* Footer Link */}
        {footerLinkText && footerLinkTo && footerLinkLabel && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              {footerLinkText}{' '}
              <Link
                to={footerLinkTo}
                className="font-semibold text-green-600 hover:text-green-700 hover:underline transition-all duration-200"
              >
                {footerLinkLabel}
              </Link>
            </p>
          </div>
        )}
      </div>

      {/* Main Content Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-10 px-6 shadow-2xl shadow-green-100/50 sm:rounded-3xl sm:px-12 border border-gray-100 transition-all duration-300 hover:shadow-3xl backdrop-blur-sm">
          {children}

          {/* Back to Home Link */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <Link
              to="/"
              className="inline-flex items-center text-gray-600 hover:text-green-600 font-medium transition-colors group"
            >
              <i className="ri-arrow-left-line mr-2 group-hover:-translate-x-1 transition-transform"></i>
              Retour à l'accueil
            </Link>
          </div>
        </div>

        {/* Benefits Section */}
        {showBenefits && benefits.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-4">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-white p-5 rounded-2xl border border-green-100 shadow-soft hover:shadow-md transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-center space-x-4">
                  <div
                    className={`flex-shrink-0 w-12 h-12 bg-gradient-to-br ${benefit.iconColor} rounded-2xl flex items-center justify-center shadow-sm`}
                  >
                    <i className={`${benefit.icon} text-xl text-white`}></i>
                  </div>
                  <p className="text-sm text-gray-700 font-semibold">{benefit.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Card */}
        {infoCard && (
          <div className="mt-6 bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-100 shadow-soft">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <i className="ri-information-line text-2xl text-white"></i>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700 leading-relaxed">
                  <span className="font-bold text-green-700 block mb-2">{infoCard.title}</span>
                  {infoCard.description}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuthLayout;
