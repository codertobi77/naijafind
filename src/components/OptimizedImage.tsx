import { useState, useEffect, useRef } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  fallbackSrc?: string;
  sizes?: string;
}

/**
 * OptimizedImage Component
 * 
 * Features:
 * - WebP format support with automatic fallback
 * - Lazy loading for non-critical images
 * - Blur-up placeholder effect
 * - Responsive image sizes
 * - Intersection Observer for efficient lazy loading
 * - Error handling with fallback
 */
export function OptimizedImage({
  src,
  alt,
  className = '',
  priority = false,
  fallbackSrc,
  sizes = '100vw'
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate WebP URL (assumes images are served with .webp variant)
  // Only attempt replacement if the URL has a standard image extension
  const [baseUrl, queryParams] = src.split('?');
  const hasStandardExtension = /\.(jpe?g|png)$/i.test(baseUrl);
  const webpSrc = hasStandardExtension
    ? baseUrl.replace(/\.(jpe?g|png)$/i, '.webp') + (queryParams ? `?${queryParams}` : '')
    : src;
  
  // Generate responsive srcSet for common widths
  const generateSrcSet = (baseSrc: string) => {
    const [path, query] = baseSrc.split('?');
    // Only generate srcSet for images with standard extensions
    // This avoids broken URLs for dynamic image APIs (e.g. readdy.ai)
    if (!/\.(webp|jpe?g|png)$/i.test(path)) {
      return undefined;
    }

    const widths = [320, 640, 960, 1280, 1920];
    return widths
      .map(w => `${path.replace(/\.(webp|jpe?g|png)$/i, `-${w}w.$1`)}${query ? `?${query}` : ''} ${w}w`)
      .join(', ');
  };

  useEffect(() => {
    if (priority) return;

    // Use Intersection Observer for lazy loading
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before image enters viewport
        threshold: 0.01
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    if (!hasError && fallbackSrc) {
      setHasError(true);
    }
  };

  // Don't render anything until in view (for lazy loading)
  if (!isInView) {
    return (
      <div
        ref={containerRef}
        className={`${className} bg-gray-100 animate-pulse`}
        style={{ minHeight: '100px' }}
        aria-label={alt}
      />
    );
  }

  const displaySrc = hasError && fallbackSrc ? fallbackSrc : src;
  const displayWebpSrc = hasError && fallbackSrc 
    ? (() => {
        const [path, query] = fallbackSrc.split('?');
        return /\.(jpe?g|png)$/i.test(path)
          ? path.replace(/\.(jpe?g|png)$/i, '.webp') + (query ? `?${query}` : '')
          : fallbackSrc;
      })()
    : webpSrc;

  const srcSetWebp = generateSrcSet(displayWebpSrc);
  const srcSetOriginal = generateSrcSet(displaySrc);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        backgroundColor: '#f3f4f6',
        filter: isLoaded ? 'none' : 'blur(10px)',
        transition: 'filter 0.3s ease-out'
      }}
    >
      <picture>
        {/* WebP source for modern browsers */}
        {srcSetWebp && (
          <source
            srcSet={srcSetWebp}
            sizes={sizes}
            type="image/webp"
          />
        )}
        {/* Fallback for older browsers */}
        {srcSetOriginal && (
          <source
            srcSet={srcSetOriginal}
            sizes={sizes}
            type={`image/${displaySrc.endsWith('.png') ? 'png' : 'jpeg'}`}
          />
        )}
        <img
          ref={imgRef}
          src={displaySrc}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          onLoad={handleLoad}
          onError={handleError}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            willChange: 'opacity'
          }}
        />
      </picture>
    </div>
  );
}

/**
 * SupplierImage - Specialized component for supplier images
 * Includes placeholder handling and optimized loading
 */
export function SupplierImage({
  src,
  alt,
  className = ''
}: {
  src?: string;
  alt: string;
  className?: string;
}) {
  const [hasError, setHasError] = useState(false);
  const placeholderSvg = '/supplier-placeholder.svg';

  if (!src || hasError) {
    return (
      <div className={`${className} bg-gray-100 flex items-center justify-center`}>
        <img
          src={placeholderSvg}
          alt={alt}
          className="w-1/2 h-1/2 opacity-50"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      className={className}
      fallbackSrc={placeholderSvg}
    />
  );
}

/**
 * ProductImage - Specialized component for product images
 * Optimized for e-commerce with priority loading for above-fold
 */
export function ProductImage({
  src,
  alt,
  className = '',
  priority = false
}: {
  src?: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  const placeholderSvg = '/supplier-placeholder.svg';

  if (!src) {
    return (
      <div className={`${className} bg-gray-100 flex items-center justify-center`}>
        <img
          src={placeholderSvg}
          alt={alt}
          className="w-1/2 h-1/2 opacity-50"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      className={className}
      priority={priority}
      fallbackSrc={placeholderSvg}
    />
  );
}

export default OptimizedImage;
