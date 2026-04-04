import { useRef, useState, useCallback, useEffect } from 'react';

interface VirtualTableProps<T> {
  items: T[];
  rowHeight: number;
  height: number;
  renderRow: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string;
  onEndReached?: () => void;
  endReachedThreshold?: number;
  className?: string;
  header?: React.ReactNode;
}

/**
 * VirtualTable Component
 * 
 * Renders only visible rows for optimal performance with large datasets.
 * Features:
 * - Windowed rendering (only visible items in DOM)
 * - Smooth scrolling with overscan buffer
 * - Dynamic height support
 * - End reached callback for infinite scroll
 */
export function VirtualTable<T>({
  items,
  rowHeight,
  height,
  renderRow,
  keyExtractor,
  onEndReached,
  endReachedThreshold = 200,
  className = '',
  header
}: VirtualTableProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  const totalHeight = items.length * rowHeight;
  const overscan = 3; // Number of rows to render outside viewport

  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const visibleCount = Math.ceil(height / rowHeight) + overscan * 2;
  const endIndex = Math.min(items.length, startIndex + visibleCount);

  // Handle scroll with debouncing for performance
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = (e.target as HTMLDivElement).scrollTop;
    setScrollTop(newScrollTop);
    setIsScrolling(true);

    // Clear previous timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Reset scrolling state after scroll ends
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 100);

    // Check if end reached
    if (onEndReached) {
      const scrollBottom = newScrollTop + height;
      const threshold = totalHeight - endReachedThreshold;
      
      if (scrollBottom >= threshold) {
        onEndReached();
      }
    }
  }, [height, totalHeight, endReachedThreshold, onEndReached]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Generate visible items
  const visibleItems = items.slice(startIndex, endIndex);

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height }}
      onScroll={handleScroll}
    >
      {header && (
        <div className="sticky top-0 z-10 bg-white shadow-sm">
          {header}
        </div>
      )}
      
      <div
        style={{
          height: totalHeight,
          position: 'relative'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: startIndex * rowHeight,
            left: 0,
            right: 0,
            willChange: isScrolling ? 'transform' : 'auto'
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={keyExtractor(item)}
              style={{
                height: rowHeight,
                boxSizing: 'border-box'
              }}
            >
              {renderRow(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  height: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string;
  onEndReached?: () => void;
  className?: string;
  overscan?: number;
}

/**
 * VirtualList Component
 * 
 * Simpler virtual list for non-table layouts.
 * Renders only visible items for large lists.
 */
export function VirtualList<T>({
  items,
  itemHeight,
  height,
  renderItem,
  keyExtractor,
  onEndReached,
  className = '',
  overscan = 3
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(height / itemHeight) + overscan * 2;
  const endIndex = Math.min(items.length, startIndex + visibleCount);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = (e.target as HTMLDivElement).scrollTop;
    setScrollTop(newScrollTop);

    if (onEndReached) {
      const scrollBottom = newScrollTop + height;
      const threshold = totalHeight - 100;
      
      if (scrollBottom >= threshold) {
        onEndReached();
      }
    }
  }, [height, totalHeight, onEndReached]);

  const visibleItems = items.slice(startIndex, endIndex);

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: startIndex * itemHeight,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((item, index) => (
            <div key={keyExtractor(item)} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * useVirtualScroll hook
 * 
 * Provides virtual scrolling logic for custom implementations.
 */
export function useVirtualScroll({
  itemCount,
  itemHeight,
  height,
  overscan = 3
}: {
  itemCount: number;
  itemHeight: number;
  height: number;
  overscan?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);

  const totalHeight = itemCount * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(height / itemHeight) + overscan * 2;
  const endIndex = Math.min(itemCount, startIndex + visibleCount);

  const virtualItems = Array.from({ length: endIndex - startIndex }, (_, i) => ({
    index: startIndex + i,
    style: {
      position: 'absolute' as const,
      top: (startIndex + i) * itemHeight,
      left: 0,
      right: 0,
      height: itemHeight
    }
  }));

  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop((e.target as HTMLDivElement).scrollTop);
  }, []);

  return {
    virtualItems,
    totalHeight,
    startIndex,
    endIndex,
    onScroll
  };
}

export default VirtualTable;
