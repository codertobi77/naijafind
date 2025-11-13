import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

interface TourStep {
  id: string;
  title: string;
  content: string;
  targetSelector?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface DashboardTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const DashboardTour: React.FC<DashboardTourProps> = ({ isOpen, onClose, onComplete }) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);

  const tourSteps: TourStep[] = [
    {
      id: 'welcome',
      title: t('dashboard.tour.welcome.title'),
      content: t('dashboard.tour.welcome.content'),
    },
    {
      id: 'sidebar',
      title: t('dashboard.tour.sidebar.title'),
      content: t('dashboard.tour.sidebar.content'),
      targetSelector: '.dashboard-sidebar',
      position: 'right',
    },
    {
      id: 'overview',
      title: t('dashboard.tour.overview.title'),
      content: t('dashboard.tour.overview.content'),
      targetSelector: '.dashboard-overview',
      position: 'bottom',
    },
    {
      id: 'profile',
      title: t('dashboard.tour.profile.title'),
      content: t('dashboard.tour.profile.content'),
      targetSelector: '[data-tour="profile-tab"]',
      position: 'right',
    },
    {
      id: 'products',
      title: t('dashboard.tour.products.title'),
      content: t('dashboard.tour.products.content'),
      targetSelector: '[data-tour="products-tab"]',
      position: 'right',
    },
    {
      id: 'orders',
      title: t('dashboard.tour.orders.title'),
      content: t('dashboard.tour.orders.content'),
      targetSelector: '[data-tour="orders-tab"]',
      position: 'right',
    },
    {
      id: 'reviews',
      title: t('dashboard.tour.reviews.title'),
      content: t('dashboard.tour.reviews.content'),
      targetSelector: '[data-tour="reviews-tab"]',
      position: 'right',
    },
    {
      id: 'analytics',
      title: t('dashboard.tour.analytics.title'),
      content: t('dashboard.tour.analytics.content'),
      targetSelector: '[data-tour="analytics-tab"]',
      position: 'right',
    },
    {
      id: 'subscription',
      title: t('dashboard.tour.subscription.title'),
      content: t('dashboard.tour.subscription.content'),
      targetSelector: '[data-tour="subscription-tab"]',
      position: 'right',
    },
    {
      id: 'settings',
      title: t('dashboard.tour.settings.title'),
      content: t('dashboard.tour.settings.content'),
      targetSelector: '[data-tour="settings-tab"]',
      position: 'right',
    },
    {
      id: 'team',
      title: t('dashboard.tour.team.title'),
      content: t('dashboard.tour.team.content'),
      targetSelector: '[data-tour="team-tab"]',
      position: 'right',
    },
    {
      id: 'notifications',
      title: t('dashboard.tour.notifications.title'),
      content: t('dashboard.tour.notifications.content'),
      targetSelector: '.notification-button',
      position: 'bottom',
    },
    {
      id: 'complete',
      title: t('dashboard.tour.complete.title'),
      content: t('dashboard.tour.complete.content'),
    },
  ];

  const currentStepData = tourSteps[currentStep];

  const highlightElement = useCallback((selector?: string) => {
    if (!selector) {
      setHighlightedElement(null);
      return;
    }

    const element = document.querySelector(selector);
    if (element instanceof HTMLElement) {
      setHighlightedElement(element);
    } else {
      setHighlightedElement(null);
    }
  }, []);

  useEffect(() => {
    if (isOpen && currentStepData) {
      highlightElement(currentStepData.targetSelector);
    } else {
      setHighlightedElement(null);
    }
  }, [isOpen, currentStep, currentStepData, highlightElement]);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      setHighlightedElement(null);
    }
  }, [isOpen]);

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
      onClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTour = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay to highlight the target element */}
      {highlightedElement && (
        <>
          <div 
            className="fixed inset-0 z-50 bg-black bg-opacity-50"
          />
          <div 
            className="fixed z-50 border-4 border-green-500 rounded-lg shadow-lg"
            style={{
              top: highlightedElement.getBoundingClientRect().top,
              left: highlightedElement.getBoundingClientRect().left,
              width: highlightedElement.offsetWidth,
              height: highlightedElement.offsetHeight,
              pointerEvents: 'none'
            }}
          />
        </>
      )}

      {/* Tour popup */}
      <div 
        className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-6 max-w-sm"
        style={{
          top: highlightedElement 
            ? (currentStepData.position === 'top' 
                ? `${highlightedElement.getBoundingClientRect().top - 200}px`
                : currentStepData.position === 'bottom'
                ? `${highlightedElement.getBoundingClientRect().bottom + 20}px`
                : `${highlightedElement.getBoundingClientRect().top}px`)
            : '50%',
          left: highlightedElement
            ? (currentStepData.position === 'left'
                ? `${highlightedElement.getBoundingClientRect().left - 300}px`
                : currentStepData.position === 'right'
                ? `${highlightedElement.getBoundingClientRect().right + 20}px`
                : `${highlightedElement.getBoundingClientRect().left}px`)
            : '50%',
          transform: highlightedElement ? 'none' : 'translate(-50%, -50%)',
        }}
      >
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {currentStepData.title}
          </h3>
          <button 
            onClick={skipTour}
            className="text-gray-400 hover:text-gray-600"
            aria-label={t('dashboard.tour.skip')}
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>
        
        <p className="text-gray-600 mb-6">
          {currentStepData.content}
        </p>
        
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {currentStep + 1} / {tourSteps.length}
          </div>
          
          <div className="flex space-x-2">
            {currentStep > 0 && (
              <button
                onClick={prevStep}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                {t('dashboard.tour.previous')}
              </button>
            )}
            
            <button
              onClick={nextStep}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
            >
              {currentStep === tourSteps.length - 1 
                ? t('dashboard.tour.finish') 
                : t('dashboard.tour.next')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardTour;