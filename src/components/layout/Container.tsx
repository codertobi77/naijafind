import type { ReactNode } from 'react';

interface ContainerProps {
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Container({
  children,
  className = '',
  size = 'xl',
  padding = 'md',
}: ContainerProps) {
  const sizeClasses = {
    sm: 'max-w-3xl',
    md: 'max-w-4xl',
    lg: 'max-w-5xl',
    xl: 'max-w-7xl',
    full: 'max-w-full',
  };

  const paddingClasses = {
    none: '',
    sm: 'px-4 sm:px-6',
    md: 'px-4 sm:px-6 lg:px-8',
    lg: 'px-6 sm:px-8 lg:px-12',
  };

  return (
    <div className={`${sizeClasses[size]} ${paddingClasses[padding]} mx-auto ${className}`}>
      {children}
    </div>
  );
}

interface SectionProps {
  children: ReactNode;
  className?: string;
  background?: 'white' | 'gray' | 'green' | 'gradient' | 'dark' | 'none';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Section({
  children,
  className = '',
  background = 'none',
  padding = 'lg',
}: SectionProps) {
  const bgClasses = {
    white: 'bg-white',
    gray: 'bg-gray-50',
    green: 'bg-green-50',
    gradient: 'bg-gradient-to-br from-gray-50 via-white to-green-50',
    dark: 'bg-gray-900',
    none: '',
  };

  const paddingClasses = {
    none: '',
    sm: 'py-8',
    md: 'py-12 sm:py-16',
    lg: 'py-16 sm:py-20',
  };

  return (
    <section className={`${bgClasses[background]} ${paddingClasses[padding]} ${className}`}>
      {children}
    </section>
  );
}

