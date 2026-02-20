import { ReactNode } from 'react';
import { Header } from '../base';
import Footer from './Footer';

interface PageLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
  footerVariant?: 'dark' | 'light';
  className?: string;
  mainClassName?: string;
}

export function PageLayout({
  children,
  showHeader = true,
  showFooter = true,
  footerVariant = 'dark',
  className = '',
  mainClassName = '',
}: PageLayoutProps) {
  return (
    <div className={`min-h-screen flex flex-col ${className}`}>
      {showHeader && <Header />}
      <main className={`flex-1 ${mainClassName}`}>{children}</main>
      {showFooter && <Footer variant={footerVariant} />}
    </div>
  );
}

export default PageLayout;
