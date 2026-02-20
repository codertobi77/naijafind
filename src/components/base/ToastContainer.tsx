import type { Toast, ToastType } from '../../hooks/useToast';

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

const toastStyles: Record<ToastType, string> = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
};

const toastIcons: Record<ToastType, string> = {
  success: 'ri-check-line',
  error: 'ri-error-warning-line',
  info: 'ri-information-line',
  warning: 'ri-alert-line',
};

const positionClasses: Record<string, string> = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
};

export function ToastContainer({ 
  toasts, 
  onRemove, 
  position = 'bottom-right' 
}: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className={`fixed z-50 flex flex-col gap-3 ${positionClasses[position]}`}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg min-w-[300px] max-w-[400px] animate-in slide-in-from-right fade-in duration-200 ${toastStyles[toast.type]}`}
      role="alert"
    >
      <i className={`${toastIcons[toast.type]} text-lg`}></i>
      <span className="flex-1 text-sm font-medium">{toast.message}</span>
      <button
        onClick={() => onRemove(toast.id)}
        className="p-1 hover:bg-black/5 rounded transition-colors"
        aria-label="Close notification"
      >
        <i className="ri-close-line"></i>
      </button>
    </div>
  );
}

export default ToastContainer;
