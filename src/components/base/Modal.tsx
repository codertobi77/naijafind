import { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  buttonText: string;
  icon?: 'success' | 'info' | 'warning';
}

export default function Modal({
  isOpen,
  onClose,
  title,
  message,
  buttonText,
  icon = 'success',
}: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const iconConfig = {
    success: {
      bg: 'bg-green-100',
      text: 'text-green-600',
      icon: 'ri-check-line',
    },
    info: {
      bg: 'bg-blue-100',
      text: 'text-blue-600',
      icon: 'ri-information-line',
    },
    warning: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-600',
      icon: 'ri-time-line',
    },
  };

  const config = iconConfig[icon];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all animate-fade-in">
        <div className="p-6 text-center">
          {/* Icon */}
          <div
            className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${config.bg} mb-4`}
          >
            <i className={`${config.icon} text-3xl ${config.text}`}></i>
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>

          {/* Message */}
          <p className="text-gray-600 mb-6">{message}</p>

          {/* Button */}
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-medium shadow-lg hover:shadow-xl"
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}
