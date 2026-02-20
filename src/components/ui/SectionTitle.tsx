import { ReactNode } from 'react';

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  centered?: boolean;
  light?: boolean;
  className?: string;
  badge?: {
    icon: string;
    text: string;
  };
  size?: 'sm' | 'md' | 'lg';
}

export function SectionTitle({
  title,
  subtitle,
  centered = true,
  light = false,
  className = '',
  badge,
  size = 'md',
}: SectionTitleProps) {
  const sizeClasses = {
    sm: 'text-2xl sm:text-3xl',
    md: 'text-3xl sm:text-4xl',
    lg: 'text-3xl sm:text-4xl lg:text-5xl',
  };

  const titleClasses = light ? 'text-white' : 'text-gray-900';
  const subtitleClasses = light ? 'text-white/90' : 'text-gray-600';
  const badgeBg = light ? 'bg-white/20 text-white' : 'bg-green-100 text-green-700';

  return (
    <div className={`${centered ? 'text-center' : ''} ${className}`}>
      {badge && (
        <div
          className={`inline-flex items-center px-4 py-2 rounded-full mb-6 ${badgeBg}`}
        >
          <i className={`${badge.icon} mr-2`}></i>
          <span className="text-sm font-semibold">{badge.text}</span>
        </div>
      )}
      <h2 className={`${sizeClasses[size]} font-bold ${titleClasses} mb-4 sm:mb-6`}>
        {title}
      </h2>
      {subtitle && (
        <p
          className={`${subtitleClasses} text-lg sm:text-xl ${
            centered ? 'max-w-3xl mx-auto' : 'max-w-2xl'
          } leading-relaxed`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

export default SectionTitle;
