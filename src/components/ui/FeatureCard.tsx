import { ReactNode } from 'react';

interface FeatureCardProps {
  icon: string;
  iconColor?: string;
  iconBg?: string;
  title: string;
  description: string;
  className?: string;
  hoverable?: boolean;
  centered?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function FeatureCard({
  icon,
  iconColor = 'text-green-600',
  iconBg = 'from-green-100 to-emerald-100',
  title,
  description,
  className = '',
  hoverable = true,
  centered = true,
  size = 'md',
}: FeatureCardProps) {
  const sizeClasses = {
    sm: {
      container: 'p-6',
      icon: 'w-12 h-12',
      iconText: 'text-xl',
      title: 'text-lg',
      description: 'text-sm',
    },
    md: {
      container: 'p-8',
      icon: 'w-20 h-20',
      iconText: 'text-3xl',
      title: 'text-xl sm:text-2xl',
      description: 'text-base',
    },
    lg: {
      container: 'p-10',
      icon: 'w-24 h-24',
      iconText: 'text-4xl',
      title: 'text-2xl sm:text-3xl',
      description: 'text-lg',
    },
  };

  const hoverClasses = hoverable
    ? 'hover:shadow-xl hover:-translate-y-2 transition-all duration-300'
    : '';

  const titleHoverClasses = hoverable ? 'group-hover:text-green-600 transition-colors' : '';

  return (
    <div
      className={`group bg-white rounded-2xl ${sizeClasses[size].container} ${
        centered ? 'text-center' : ''
      } shadow-soft border border-gray-100 ${hoverClasses} ${className}`}
    >
      <div
        className={`${sizeClasses[size].icon} bg-gradient-to-br ${iconBg} rounded-2xl flex items-center justify-center ${
          centered ? 'mx-auto' : ''
        } mb-6 group-hover:shadow-lg group-hover:scale-110 transition-all duration-300`}
      >
        <i className={`${icon} ${sizeClasses[size].iconText} ${iconColor}`}></i>
      </div>
      <h3
        className={`${sizeClasses[size].title} font-bold text-gray-900 mb-4 ${titleHoverClasses}`}
      >
        {title}
      </h3>
      <p className={`${sizeClasses[size].description} text-gray-600 leading-relaxed`}>
        {description}
      </p>
    </div>
  );
}

interface FeatureGridProps {
  features: Array<{
    icon: string;
    iconColor?: string;
    iconBg?: string;
    title: string;
    description: string;
  }>;
  columns?: 2 | 3 | 4;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function FeatureGrid({
  features,
  columns = 3,
  className = '',
  size = 'md',
}: FeatureGridProps) {
  const gridClasses = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid ${gridClasses[columns]} gap-8 ${className}`}>
      {features.map((feature, index) => (
        <FeatureCard key={index} {...feature} size={size} />
      ))}
    </div>
  );
}

export default FeatureCard;
