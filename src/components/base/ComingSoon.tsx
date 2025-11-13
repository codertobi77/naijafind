import React from 'react';
import { useTranslation } from 'react-i18next';

interface ComingSoonProps {
  feature?: string;
}

const ComingSoon: React.FC<ComingSoonProps> = ({ feature }) => {
  const { t } = useTranslation();
  
  const getTitle = () => {
    if (feature) {
      const key = `dashboard.coming_soon.${feature}`;
      const translation = t(key);
      // If the translation key doesn't exist, return the default title
      return translation !== key ? translation : t('dashboard.coming_soon.title');
    }
    return t('dashboard.coming_soon.title');
  };
  
  const getMessage = () => {
    if (feature) {
      const key = `dashboard.coming_soon.${feature}`;
      const translation = t(key);
      // If the translation key exists and is different from the key, it's a specific message
      if (translation !== key && feature !== 'title') {
        return translation;
      }
    }
    return t('dashboard.coming_soon.message');
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
        <i className="ri-time-line text-2xl" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-gray-900">
        {getTitle()}
      </h3>
      <p className="text-sm text-gray-600 max-w-md">
        {getMessage()}
      </p>
    </div>
  );
};

export default ComingSoon;