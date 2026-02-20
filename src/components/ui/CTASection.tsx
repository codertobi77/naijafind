import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface CTASectionProps {
  title: string;
  subtitle?: string;
  primaryAction?: {
    label: string;
    to?: string;
    onClick?: () => void;
    icon?: string;
  };
  secondaryAction?: {
    label: string;
    to?: string;
    onClick?: () => void;
    icon?: string;
  };
  children?: ReactNode;
  className?: string;
  badge?: {
    icon: string;
    text: string;
  };
  variant?: 'green' | 'dark' | 'light';
}

export function CTASection({
  title,
  subtitle,
  primaryAction,
  secondaryAction,
  children,
  className = '',
  badge,
  variant = 'green',
}: CTASectionProps) {
  const variantClasses = {
    green: {
      section: 'bg-gradient-to-r from-green-600 to-emerald-600',
      overlay: 'from-white/10 to-transparent',
      primaryBtn: 'bg-white text-green-600 hover:bg-gray-50',
      secondaryBtn: 'border-2 border-white text-white hover:bg-white hover:text-green-600',
    },
    dark: {
      section: 'bg-gray-900',
      overlay: '',
      primaryBtn: 'bg-green-600 text-white hover:bg-green-700',
      secondaryBtn: 'border-2 border-white text-white hover:bg-white hover:text-gray-900',
    },
    light: {
      section: 'bg-white',
      overlay: '',
      primaryBtn: 'bg-green-600 text-white hover:bg-green-700',
      secondaryBtn: 'border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white',
    },
  };

  const styles = variantClasses[variant];
  const textColor = variant === 'light' ? 'text-gray-900' : 'text-white';
  const subtitleColor =
    variant === 'light' ? 'text-gray-600' : variant === 'dark' ? 'text-gray-300' : 'text-green-50';

  const renderButton = (
    action: { label: string; to?: string; onClick?: () => void; icon?: string },
    variant: 'primary' | 'secondary'
  ) => {
    const baseClasses = `
      ${variant === 'primary' ? styles.primaryBtn : styles.secondaryBtn}
      px-6 sm:px-8 py-3 rounded-xl transition-all duration-300 font-bold whitespace-nowrap
      text-sm sm:text-base transform hover:-translate-y-0.5 inline-flex items-center justify-center
    `;

    const content = (
      <>
        {action.icon && <i className={`${action.icon} mr-2`}></i>}
        {action.label}
      </>
    );

    if (action.to) {
      return (
        <Link to={action.to} className={baseClasses}>
          {content}
        </Link>
      );
    }

    return (
      <button onClick={action.onClick} className={baseClasses}>
        {content}
      </button>
    );
  };

  return (
    <section className={`py-12 sm:py-20 ${styles.section} relative overflow-hidden ${className}`}>
      {/* Decorative overlay for green variant */}
      {variant === 'green' && (
        <div className="absolute inset-0 opacity-10">
          <div
            className={`absolute top-0 left-0 w-96 h-96 bg-white rounded-full filter blur-3xl`}
          ></div>
          <div
            className={`absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full filter blur-3xl`}
          ></div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        {badge && (
          <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-md rounded-full border border-white/30 mb-6">
            <i className={`${badge.icon} text-white mr-2`}></i>
            <span className="text-white text-sm font-semibold">{badge.text}</span>
          </div>
        )}

        <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${textColor} mb-4 sm:mb-6`}>
          {title}
        </h2>

        {subtitle && (
          <p className={`text-lg sm:text-xl ${subtitleColor} mb-6 sm:mb-10 max-w-2xl mx-auto leading-relaxed`}>
            {subtitle}
          </p>
        )}

        {children}

        {(primaryAction || secondaryAction) && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {primaryAction && renderButton(primaryAction, 'primary')}
            {secondaryAction && renderButton(secondaryAction, 'secondary')}
          </div>
        )}
      </div>
    </section>
  );
}

export default CTASection;
