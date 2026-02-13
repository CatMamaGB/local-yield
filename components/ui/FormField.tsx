"use client";

/**
 * Warm Farmhouse design system — Form field wrapper.
 * Label + input/select/textarea + optional error. Consistent border, rounded-lg, focus ring.
 */

export interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

const inputBase =
  "w-full rounded-lg border border-brand/20 bg-white px-3 py-2 text-brand placeholder:text-brand/50 focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20";

export function FormField({ id, label, error, required, children, className = "" }: FormFieldProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-brand mb-1.5">
        {label}
        {required && <span className="text-brand-terracotta ml-0.5" aria-hidden>*</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-brand-terracotta" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function FormFieldInput({
  id,
  error,
  className = "",
  ...props
}: React.ComponentPropsWithoutRef<"input"> & { id: string; error?: string }) {
  return (
    <input
      id={id}
      aria-invalid={!!error}
      aria-describedby={error ? `${id}-error` : undefined}
      className={`${inputBase} ${className}`}
      {...props}
    />
  );
}

export function FormFieldSelect({
  id,
  error,
  className = "",
  ...props
}: React.ComponentPropsWithoutRef<"select"> & { id: string; error?: string }) {
  return (
    <select
      id={id}
      aria-invalid={!!error}
      aria-describedby={error ? `${id}-error` : undefined}
      className={`${inputBase} ${className}`}
      {...props}
    />
  );
}

export function FormFieldTextarea({
  id,
  error,
  className = "",
  ...props
}: React.ComponentPropsWithoutRef<"textarea"> & { id: string; error?: string }) {
  return (
    <textarea
      id={id}
      aria-invalid={!!error}
      aria-describedby={error ? `${id}-error` : undefined}
      className={`${inputBase} min-h-[100px] ${className}`}
      {...props}
    />
  );
}
