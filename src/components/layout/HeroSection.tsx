import { ReactNode } from 'react';

interface HeroSectionProps {
  title: string;
  subtitle?: string;
  backgroundImage?: string;
  backgroundGradient?: string;
  overlayOpacity?: number;
  children?: ReactNode;
  className?: string;
  showBadge?: boolean;
  badgeText?: string;
  badgeIcon?: string;
  centered?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function HeroSection({
  title,
  subtitle,
  backgroundImage,
  backgroundGradient = 'from-black/60 via-black/50 to-black/40',
  overlayOpacity = 1,
  children,
  className = '',
  showBadge = false,
  badgeText,
  badgeIcon = 'ri-information-line',
  centered = true,
  size = 'lg',
}: HeroSectionProps) {
  const sizeClasses = {
    sm: 'py-12 sm:py-16',
    md: 'py-16 sm:py-20',
    lg: 'py-16 sm:py-24 lg:py-32',
  };

  const containerClasses = centered ? 'text-center' : '';
  const textAlignment = centered ? 'mx-auto' : '';

  return (
    <section
      className={`relative ${sizeClasses[size]} px-4 sm:px-6 lg:px-8 overflow-hidden ${className}`}
      style={
        backgroundImage
          ? {
              backgroundImage: `url('${backgroundImage}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : undefined
      }
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${backgroundGradient}`}
        style={{ opacity: overlayOpacity }}
      ></div>
      <div className={`relative max-w-7xl mx-auto ${containerClasses}`}>
        <div className={`${centered ? 'max-w-3xl mx-auto' : ''}`}>
          {showBadge && badgeText && (
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-6">
              <i className={`${badgeIcon} text-white mr-2`}></i>
              <span className="text-white/90 text-sm font-medium">{badgeText}</span>
            </div>
          )}
          <h1
            className={`text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 leading-tight ${textAlignment}`}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className={`text-lg sm:text-xl lg:text-2xl text-white/95 leading-relaxed ${textAlignment} ${
                centered ? 'max-w-3xl mx-auto' : 'max-w-2xl'
              }`}
            >
              {subtitle}
            </p>
          )}
          {children && <div className="mt-8 sm:mt-10">{children}</div>}
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
