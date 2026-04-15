import { useState } from 'react';

interface EntityImageProps {
  type: 'supplier' | 'product';
  src?: string | null;
  name: string;
  category?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  priority?: boolean;
}

const sizeClasses = {
  sm: {
    container: 'w-12 h-12',
    avatar: 'w-10 h-10 text-sm',
    product: 'w-12 h-12',
    icon: 'text-xl',
  },
  md: {
    container: 'w-20 h-20 sm:w-28 sm:h-28',
    avatar: 'w-16 h-16 text-lg',
    product: 'w-20 h-20 sm:w-28 sm:h-28',
    icon: 'text-3xl',
  },
  lg: {
    container: 'w-32 h-32 sm:w-40 sm:h-40',
    avatar: 'w-24 h-24 text-2xl',
    product: 'w-32 h-32 sm:w-40 sm:h-40',
    icon: 'text-4xl',
  },
  xl: {
    container: 'w-full h-48 sm:h-56 lg:h-64',
    avatar: 'w-32 h-32 text-3xl',
    product: 'w-full h-48 sm:h-56 lg:h-64',
    icon: 'text-5xl',
  },
};

// Generate a consistent color based on category or name
function getCategoryColor(category: string, name: string): string {
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

  const seed = category.length > 0 ? category : name || 'default';
  const colorIndex = seed.charCodeAt(0) % colors.length;
  return colors[colorIndex] || 'bg-gray-500';
}

// Get initials from name
function getInitials(name: string): string {
  if (!name || name.trim() === '') return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// Get icon based on category for products
function getCategoryIcon(category?: string): string {
  if (!category) return 'ri-box-3-line';

  const categoryLower = category.toLowerCase();

  const iconMap: Record<string, string> = {
    electronics: 'ri-smartphone-line',
    tech: 'ri-computer-line',
    food: 'ri-restaurant-line',
    restaurant: 'ri-restaurant-2-line',
    fashion: 'ri-t-shirt-line',
    clothing: 'ri-t-shirt-line',
    home: 'ri-home-smile-line',
    furniture: 'ri-sofa-line',
    beauty: 'ri-brush-line',
    health: 'ri-heart-pulse-line',
    sports: 'ri-basketball-line',
    book: 'ri-book-line',
    education: 'ri-graduation-cap-line',
    toy: 'ri-gamepad-line',
    automotive: 'ri-car-line',
    tool: 'ri-tools-line',
    garden: 'ri-plant-line',
    pet: 'ri-bear-smile-line',
    jewelry: 'ri-vip-diamond-line',
    art: 'ri-palette-line',
    music: 'ri-music-line',
    office: 'ri-briefcase-line',
    industrial: 'ri-building-2-line',
    construction: 'ri-building-line',
  };

  for (const [key, icon] of Object.entries(iconMap)) {
    if (categoryLower.includes(key)) {
      return icon;
    }
  }

  return 'ri-box-3-line';
}

// Supplier Avatar with initials
function SupplierAvatarFallback({
  name,
  category,
  size,
  className,
}: {
  name: string;
  category?: string;
  size: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const bgColor = getCategoryColor(category || '', name);
  const initials = getInitials(name);

  return (
    <div
      className={`${sizeClasses[size].avatar} ${bgColor} ${className} rounded-full flex items-center justify-center text-white font-bold`}
      title={name}
    >
      {initials}
    </div>
  );
}

// Product Placeholder with category icon
function ProductPlaceholderFallback({
  category,
  size,
  className,
}: {
  category?: string;
  size: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const bgColor = getCategoryColor(category || '', 'product');
  const iconClass = getCategoryIcon(category);

  return (
    <div
      className={`${sizeClasses[size].product} ${bgColor} ${className} flex items-center justify-center text-white`}
    >
      <i className={`${iconClass} ${sizeClasses[size].icon}`} />
    </div>
  );
}

export function EntityImage({
  type,
  src,
  name,
  category,
  className = '',
  size = 'md',
  priority = false,
}: EntityImageProps) {
  const [hasError, setHasError] = useState(false);
  
  // No source or error loading - show fallback
  if (!src || hasError) {
    if (type === 'supplier') {
      return (
        <div
          className={`${sizeClasses[size].container} ${className} overflow-hidden flex items-center justify-center bg-gray-100`}
        >
          <SupplierAvatarFallback name={name} category={category} size={size} />
        </div>
      );
    }

    // Product fallback
    return (
      <div
        className={`${sizeClasses[size].container} ${className} overflow-hidden flex items-center justify-center bg-gray-100`}
      >
        <ProductPlaceholderFallback category={category} size={size} />
      </div>
    );
  }

  // Try to load the actual image
  const handleError = () => {
    setHasError(true);
  };

  return (
    <div
      className={`${sizeClasses[size].container} ${className} overflow-hidden bg-gray-100 flex items-center justify-center`}
    >
      <img
        src={src}
        alt={name}
        className="w-full h-full object-cover"
        loading={priority ? 'eager' : 'lazy'}
        onError={handleError}
      />
    </div>
  );
}

// Re-export SupplierAvatar for convenience
export { SupplierAvatarFallback as SupplierAvatar };
export default EntityImage;
