import { Link } from 'react-router-dom';

interface LogoProps {
  variant?: 'default' | 'admin' | 'supplier';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const variantConfig = {
  default: {
    icon: '/Suji Logo.webp',
    bgColor: 'from-green-500 to-emerald-600',
    textColor: 'from-green-600 to-emerald-600',
    hoverBgColor: 'group-hover:from-green-600 group-hover:to-emerald-700',
    hoverTextColor: 'group-hover:from-green-700 group-hover:to-emerald-700',
  },
  admin: {
    icon: '/Suji Logo.webp',
    bgColor: 'from-red-500 to-rose-600',
    textColor: 'from-red-600 to-rose-600',
    hoverBgColor: 'group-hover:from-red-600 group-hover:to-rose-700',
    hoverTextColor: 'group-hover:from-red-700 group-hover:to-rose-700',
  },
  supplier: {
    icon: '/Suji Logo.webp',
    bgColor: 'from-blue-500 to-cyan-600',
    textColor: 'from-blue-600 to-cyan-600',
    hoverBgColor: 'group-hover:from-blue-600 group-hover:to-cyan-700',
    hoverTextColor: 'group-hover:from-blue-700 group-hover:to-cyan-700',
  },
};

const sizeConfig = {
  sm: {
    container: 'w-10 h-10',
    imgSize: 'h-8 w-8',
    text: 'text-2xl',
    underline: 'w-16',
    underlineHover: 'group-hover:w-20',
  },
  md: {
    container: 'w-12 h-12',
    imgSize: 'h-10 w-10',
    text: 'text-3xl',
    underline: 'w-20',
    underlineHover: 'group-hover:w-28',
  },
  lg: {
    container: 'w-14 h-14',
    imgSize: 'h-12 w-12',
    text: 'text-4xl',
    underline: 'w-24',
    underlineHover: 'group-hover:w-32',
  },
};

export function Logo({
  variant = 'default',
  size = 'lg',
  showText = true,
  className = '',
}: LogoProps) {
  const config = variantConfig[variant];
  const sizeStyles = sizeConfig[size];

  const content = (
    <div className={`text-center ${className}`}>
      <div className={`inline-flex items-center space-x-3 mb-2 ${showText ? 'mb-4' : ''}`}>
        <div
          className={`${sizeStyles.container} bg-gradient-to-br ${config.bgColor} rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105 p-1.5`}
        >
          <img 
            src={config.icon} 
            alt="Suji" 
            className={`${sizeStyles.imgSize} object-contain`}
          />
        </div>
        {showText && (
          <span
            className={`${sizeStyles.text} font-bold bg-gradient-to-r ${config.textColor} bg-clip-text text-transparent ${config.hoverTextColor} transition-all duration-300`}
            style={{ fontFamily: 'Pacifico, serif' }}
          >
            Suji
          </span>
        )}
      </div>
      {showText && (
        <div
          className={`h-1 ${sizeStyles.underline} bg-gradient-to-r ${config.textColor} mx-auto rounded-full ${sizeStyles.underlineHover} transition-all duration-300 shadow-lg`}
        ></div>
      )}
    </div>
  );

  return content;
}

export function LogoLink({
  variant = 'default',
  size = 'lg',
  showText = true,
  to = '/',
  className = '',
}: LogoProps & { to?: string }) {
  return (
    <Link to={to} className={`flex justify-center group ${className}`}>
      <Logo variant={variant} size={size} showText={showText} />
    </Link>
  );
}

export default Logo;
