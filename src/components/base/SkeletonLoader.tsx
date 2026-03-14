import React from 'react';

interface SkeletonCardProps {
  type?: 'product' | 'supplier';
}

export function ProductSkeletonCard({ type = 'product' }: SkeletonCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-pulse">
      {/* Image placeholder */}
      <div className="aspect-square bg-gray-200 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer" />
      </div>
      
      {/* Content placeholder */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        
        {/* Category */}
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        
        {/* Price */}
        <div className="flex items-center gap-2">
          <div className="h-6 bg-gray-200 rounded w-20" />
          <div className="h-4 bg-gray-200 rounded w-16" />
        </div>
        
        {/* Supplier info */}
        <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-200 rounded-full" />
          <div className="h-4 bg-gray-200 rounded w-24" />
        </div>
        
        {/* Location */}
        <div className="h-3 bg-gray-200 rounded w-32" />
      </div>
    </div>
  );
}

export function SupplierSkeletonCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-pulse">
      {/* Cover image placeholder */}
      <div className="h-24 bg-gray-200 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer" />
      </div>
      
      {/* Content placeholder */}
      <div className="px-4 pb-4 -mt-12 space-y-3">
        {/* Logo */}
        <div className="w-24 h-24 bg-gray-200 rounded-xl border-4 border-white shadow-md" />
        
        {/* Business name */}
        <div className="h-6 bg-gray-200 rounded w-3/4 mt-2" />
        
        {/* Category */}
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        
        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="h-4 bg-gray-200 rounded w-16" />
          <div className="h-4 bg-gray-200 rounded w-12" />
        </div>
        
        {/* Location */}
        <div className="h-3 bg-gray-200 rounded w-32" />
        
        {/* Actions */}
        <div className="pt-3 flex gap-2">
          <div className="h-9 bg-gray-200 rounded-lg flex-1" />
          <div className="h-9 bg-gray-200 rounded-lg flex-1" />
        </div>
      </div>
    </div>
  );
}

interface SkeletonGridProps {
  type?: 'product' | 'supplier';
  count?: number;
}

export function SearchSkeletonGrid({ type = 'product', count = 6 }: SkeletonGridProps) {
  const SkeletonComponent = type === 'product' ? ProductSkeletonCard : SupplierSkeletonCard;
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonComponent key={index} type={type} />
      ))}
    </div>
  );
}

export function TableSkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded w-32" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded w-24" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded w-20" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded w-16" />
      </td>
      <td className="px-6 py-4">
        <div className="h-8 bg-gray-200 rounded w-full" />
      </td>
    </tr>
  );
}
