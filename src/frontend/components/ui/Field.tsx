import { forwardRef } from "react";
import { cn } from "./cn";

interface LabelWrapProps {
  label?: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}

export function FieldWrap({ label, htmlFor, children, className }: LabelWrapProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={htmlFor} className="text-sm font-medium text-gray-700 dark:text-gray-200">
          {label}
        </label>
      )}
      {children}
    </div>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  wrapClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, id, className, wrapClassName, ...rest },
  ref
) {
  return (
    <FieldWrap label={label} htmlFor={id} className={wrapClassName}>
      <input ref={ref} id={id} className={cn("field", className)} {...rest} />
    </FieldWrap>
  );
});

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  wrapClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, id, className, wrapClassName, ...rest },
  ref
) {
  return (
    <FieldWrap label={label} htmlFor={id} className={wrapClassName}>
      <textarea
        ref={ref}
        id={id}
        className={cn("field min-h-[88px] resize-y", className)}
        {...rest}
      />
    </FieldWrap>
  );
});

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  wrapClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, id, className, wrapClassName, children, ...rest },
  ref
) {
  return (
    <FieldWrap label={label} htmlFor={id} className={wrapClassName}>
      <select ref={ref} id={id} className={cn("field", className)} {...rest}>
        {children}
      </select>
    </FieldWrap>
  );
});
