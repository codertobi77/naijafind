import { useState } from 'react';

interface SupplierImageProps {
  src?: string | null;
  alt: string;
  category?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const categoryKeywords: Record<string, string> = {
  'restaurant': 'restaurant food dining',
  'hotel': 'hotel accommodation lodging',
  'shop': 'retail store shopping boutique',
  'store': 'retail store shopping',
  'cafe': 'cafe coffee shop',
  'salon': 'beauty salon hair',
  'barber': 'barbershop hair cutting',
  'beauty': 'beauty spa wellness',
  'spa': 'spa wellness relaxation',
  'gym': 'gym fitness workout',
  'fitness': 'fitness gym exercise',
  'school': 'school education learning',
  'university': 'university college education',
  'gas': 'gas station fuel',
  'station': 'station service',
  'car': 'car auto vehicle',
  'auto': 'auto repair car service',
  'repair': 'repair service fix',
  'office': 'office business workplace',
  'market': 'market grocery food',
  'supermarket': 'supermarket grocery store',
  'electronics': 'electronics tech gadgets',
  'tech': 'technology computer IT',
  'consulting': 'consulting business advisor',
  'lawyer': 'lawyer legal attorney',
  'legal': 'legal law attorney',
  'real estate': 'real estate property house',
  'construction': 'construction building contractor',
  'plumber': 'plumber plumbing',
  'electrician': 'electrician electrical',
  'cleaning': 'cleaning service housekeeping',
  'delivery': 'delivery shipping logistics',
  'transport': 'transportation truck logistics',
  'taxi': 'taxi cab transportation',
  'travel': 'travel tourism vacation',
  'tourism': 'tourism travel sightseeing',
  'entertainment': 'entertainment fun leisure',
  'event': 'event party celebration',
  'photography': 'photography camera photos',
  'printing': 'printing press copies',
  'bookstore': 'bookstore books library',
  'library': 'library books reading',
  'art': 'art gallery creative',
  'gallery': 'gallery art exhibition',
  'music': 'music audio sound',
  'dance': 'dance studio performance',
  'hospital': 'hospital healthcare medical',
  'clinic': 'clinic healthcare medical',
  'pharmacy': 'pharmacy drugstore medicine',
  'doctor': 'doctor physician healthcare',
  'bank': 'bank finance money',
  'finance': 'finance banking investment',
  'insurance': 'insurance protection policy',
  'default': 'business shop store commercial building',
};

export function getCategoryImageQuery(category: string): string {
  const categoryLower = category?.toLowerCase() || '';
  
  // Find matching category keyword
  for (const [key, query] of Object.entries(categoryKeywords)) {
    if (categoryLower.includes(key)) {
      return query;
    }
  }
  
  return categoryKeywords.default;
}

export function getSupplierPlaceholderUrl(): string {
  return '/supplier-placeholder.svg';
}

export function getGeneratedImageUrl(
  query: string,
  width: number,
  height: number,
  seed?: string
): string {
  const seq = seed || Math.random().toString(36).substring(7);
  return `https://readdy.ai/api/search-image?query=${encodeURIComponent(query)}&width=${width}&height=${height}&seq=${seq}&orientation=${width === height ? 'squarish' : 'landscape'}`;
}

export default function SupplierImage({
  src,
  alt,
  category = '',
  className = '',
  size = 'md',
}: SupplierImageProps) {
  const [errorCount, setErrorCount] = useState(0);
  
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20 sm:w-28 sm:h-28',
    lg: 'w-32 h-32 sm:w-40 sm:h-40',
    xl: 'w-full h-48 sm:h-56 lg:h-64',
  };
  
  const imageQuery = getCategoryImageQuery(category);
  
  // Generate different sizes based on size prop
  const dimensions = {
    sm: { width: 100, height: 100 },
    md: { width: 200, height: 200 },
    lg: { width: 300, height: 300 },
    xl: { width: 400, height: 300 },
  }[size];
  
  const handleError = () => {
    setErrorCount((prev) => prev + 1);
  };
  
  // Render appropriate image based on state
  const renderImage = () => {
    // No source provided - use generated image directly
    if (!src) {
      return (
        <img
          src={getGeneratedImageUrl(imageQuery, dimensions.width, dimensions.height, alt)}
          alt={alt}
          className={`${sizeClasses[size]} ${className} object-cover object-top`}
          onError={handleError}
        />
      );
    }
    
    // Source provided but failed to load - fallback chain
    if (errorCount === 1) {
      // First fallback: try generated image based on the original source
      return (
        <img
          src={getGeneratedImageUrl(src, dimensions.width, dimensions.height, alt)}
          alt={alt}
          className={`${sizeClasses[size]} ${className} object-cover object-top`}
          onError={handleError}
        />
      );
    }
    
    if (errorCount >= 2) {
      // Second fallback: use category-based generated image
      return (
        <img
          src={getGeneratedImageUrl(imageQuery, dimensions.width, dimensions.height, alt)}
          alt={alt}
          className={`${sizeClasses[size]} ${className} object-cover object-top`}
          onError={handleError}
        />
      );
    }
    
    // Original image
    return (
      <img
        src={src}
        alt={alt}
        className={`${sizeClasses[size]} ${className} object-cover object-top`}
        onError={handleError}
      />
    );
  };
  
  return (
    <div className={`${sizeClasses[size]} ${className} overflow-hidden bg-gray-100 flex items-center justify-center`}>
      {renderImage()}
    </div>
  );
}

// Simple avatar-style fallback with initials
interface SupplierAvatarProps {
  name: string;
  category?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function SupplierAvatar({
  name,
  category = '',
  className = '',
  size = 'md',
}: SupplierAvatarProps) {
  const sizeClasses = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-16 h-16 text-lg',
    lg: 'w-24 h-24 text-2xl',
    xl: 'w-32 h-32 text-3xl',
  };
  
  // Get initials from name
  const initials = name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  
  // Generate a consistent color based on category
  const colors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-yellow-500',
    'bg-lime-500',
    'bg-green-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-sky-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-purple-500',
    'bg-fuchsia-500',
    'bg-pink-500',
    'bg-rose-500',
  ];
  
  const colorIndex = category.length > 0 
    ? category.charCodeAt(0) % colors.length 
    : name.charCodeAt(0) % colors.length;
  const bgColor = colors[colorIndex];
  
  return (
    <div 
      className={`${sizeClasses[size]} ${bgColor} ${className} rounded-full flex items-center justify-center text-white font-bold`}
      title={name}
    >
      {initials}
    </div>
  );
}
