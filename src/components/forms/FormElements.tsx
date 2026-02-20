import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';
import { forwardRef } from 'react';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: string;
  fullWidth?: boolean;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, helperText, icon, fullWidth = true, className = '', ...props }, ref) => {
    const baseClasses = `
      block rounded-lg border-gray-300 shadow-sm
      focus:border-green-500 focus:ring-green-500
      disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500
      ${icon ? 'pl-10' : ''}
      ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
      ${fullWidth ? 'w-full' : ''}
    `;

    return (
      <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className={`${icon} text-gray-400`}></i>
            </div>
          )}
          <input ref={ref} className={`${baseClasses} px-3 py-2 border`} {...props} />
        </div>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        {helperText && !error && <p className="mt-1 text-sm text-gray-500">{helperText}</p>}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';

interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  rows?: number;
  maxLength?: number;
  showCharCount?: boolean;
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = true,
      rows = 4,
      maxLength,
      showCharCount = false,
      className = '',
      value,
      ...props
    },
    ref
  ) => {
    const baseClasses = `
      block w-full rounded-lg border-gray-300 shadow-sm
      focus:border-green-500 focus:ring-green-500
      disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500
      ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border'}
    `;

    const charCount = typeof value === 'string' ? value.length : 0;

    return (
      <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          rows={rows}
          maxLength={maxLength}
          className={baseClasses}
          value={value}
          {...props}
        />
        <div className="flex justify-between mt-1">
          {error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : (
            helperText && <p className="text-sm text-gray-500">{helperText}</p>
          )}
          {showCharCount && maxLength && (
            <p className="text-sm text-gray-500">
              {charCount}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);

FormTextarea.displayName = 'FormTextarea';

interface FormSelectOption {
  value: string;
  label: string;
}

interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: FormSelectOption[];
  fullWidth?: boolean;
  placeholder?: string;
  onChange?: (value: string) => void;
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  (
    { label, error, helperText, options, fullWidth = true, placeholder, className = '', ...props },
    ref
  ) => {
    const baseClasses = `
      block rounded-lg border-gray-300 shadow-sm
      focus:border-green-500 focus:ring-green-500
      disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500
      ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
      ${fullWidth ? 'w-full' : ''}
    `;

    return (
      <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <select ref={ref} className={`${baseClasses} px-3 py-2 border pr-8`} {...props}>
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        {helperText && !error && <p className="mt-1 text-sm text-gray-500">{helperText}</p>}
      </div>
    );
  }
);

FormSelect.displayName = 'FormSelect';
