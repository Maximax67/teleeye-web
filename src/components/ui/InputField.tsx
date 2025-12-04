import React, { useCallback, useId, useMemo, useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';

type InputFieldProps = {
  label?: string;
  helperText?: string;
  password?: boolean;
  regexPattern?: RegExp | string;
  regexPatternMessage?: string;
  minLength?: number;
  maxLength?: number;
  externalError?: string;
  hideErrorMessage?: boolean;
  onEnter?: () => void;
  onValidate?: (isValid: boolean, value: string, error?: string) => void;
} & React.InputHTMLAttributes<HTMLInputElement>;

export default function InputField({
  label,
  helperText,
  password = false,
  regexPattern,
  regexPatternMessage,
  minLength,
  maxLength,
  externalError,
  hideErrorMessage,
  onEnter,
  onValidate,
  className,
  value: controlledValue,
  onChange: controlledOnChange,
  onBlur: controlledOnBlur,
  ...rest
}: InputFieldProps) {
  const id = useId();
  const [show, setShow] = useState(false);
  const [internalValue, setInternalValue] = useState<string>(
    typeof controlledValue === 'string' ? controlledValue : '',
  );

  const isControlled = typeof controlledValue !== 'undefined';
  const getRegExp = useCallback((pattern?: RegExp | string | null) => {
    if (!pattern) return null;
    if (pattern instanceof RegExp) return pattern;
    try {
      return new RegExp(String(pattern));
    } catch {
      return null;
    }
  }, []);

  const runValidation = useCallback(
    (val: string): string => {
      if (!val) return '';

      if (externalError) return externalError;

      if (minLength && val.length < minLength) {
        return `Minimum ${minLength} characters`;
      }

      if (maxLength && val.length > maxLength) {
        return `Maximum ${maxLength} characters`;
      }

      if (regexPattern) {
        const re = getRegExp(regexPattern);
        if (re && !re.test(val)) {
          return regexPatternMessage ?? 'Invalid format';
        }
      }

      return '';
    },
    [externalError, minLength, maxLength, regexPattern, regexPatternMessage, getRegExp],
  );

  const currentValue = isControlled ? ((controlledValue as string) ?? '') : internalValue;
  const computedError = useMemo(() => runValidation(currentValue), [currentValue, runValidation]);
  const showError = Boolean(computedError);

  useEffect(() => {
    const isValid = Boolean(currentValue) && computedError === '';
    onValidate?.(isValid, currentValue, computedError);
  }, [currentValue, computedError, onValidate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;

    if (!isControlled) {
      setInternalValue(v);
    }

    controlledOnChange?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    controlledOnBlur?.(e);
  };

  const inputType = password && !show ? 'password' : 'text';

  return (
    <>
      {label && (
        <label
          htmlFor={id}
          className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
      )}

      <div className="relative mb-3">
        <input
          id={id}
          aria-invalid={showError}
          aria-describedby={showError ? `${id}-error` : helperText ? `${id}-helper` : undefined}
          value={currentValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={(e) => e.key === 'Enter' && onEnter?.()}
          minLength={minLength}
          maxLength={maxLength}
          type={inputType}
          className={`w-full rounded-lg border border-gray-400 px-3 py-2 transition-all outline-none focus:border-transparent focus:ring-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${showError ? 'border-red-500 ring-red-500 dark:border-red-500' : 'focus:ring-blue-500'} ${className ?? ''}`}
          {...rest}
        />

        {password && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            tabIndex={-1}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {helperText && !showError && (
        <p id={`${id}-helper`} className="text-xs text-gray-500 dark:text-gray-400">
          {helperText}
        </p>
      )}

      {showError && !hideErrorMessage && (
        <p id={`${id}-error`} className="text-xs text-red-600 dark:text-red-400">
          {computedError}
        </p>
      )}
    </>
  );
}
