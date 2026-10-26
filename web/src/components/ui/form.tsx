"use client";
import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";

const control =
  "h-10 w-full rounded-md border bg-bg px-3 text-base text-text placeholder:text-text-muted disabled:opacity-60 read-only:bg-surface";

type FieldProps = {
  label: string;
  help?: string;
  error?: string;
  children: (a: { id: string; describedBy?: string; invalid: boolean }) => ReactNode;
};

export function Field({ label, help, error, children }: FieldProps) {
  const id = useId();
  const helpId = help ? `${id}-help` : undefined;
  const errId = error ? `${id}-err` : undefined;
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">{label}</label>
      {children({ id, describedBy: [helpId, errId].filter(Boolean).join(" ") || undefined, invalid: !!error })}
      {help && <p id={helpId} className="mt-1 text-sm text-text-muted">{help}</p>}
      {error && <p id={errId} className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
}

type TextProps = InputHTMLAttributes<HTMLInputElement> & { label: string; help?: string; error?: string };

export function TextField({ label, help, error, className = "", ...rest }: TextProps) {
  return (
    <Field label={label} help={help} error={error}>
      {({ id, describedBy, invalid }) => (
        <input
          id={id}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          className={`${control} ${invalid ? "border-danger" : "border-border-input"} ${className}`}
          {...rest}
        />
      )}
    </Field>
  );
}

export function NumberField({
  label, help, error, value, onValue, suffix = "€", min = 0, ...rest
}: Omit<TextProps, "value" | "onChange" | "type"> & { value: number; onValue: (n: number) => void; suffix?: string }) {
  return (
    <Field label={label} help={help} error={error}>
      {({ id, describedBy, invalid }) => (
        <div className="relative">
          <input
            id={id}
            type="number"
            inputMode="decimal"
            min={min}
            step="any"
            value={Number.isFinite(value) && value !== 0 ? value : ""}
            placeholder="0"
            onChange={(e) => onValue(e.target.value === "" ? 0 : Math.max(0, Number(e.target.value)))}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            className={`${control} pr-10 ${invalid ? "border-danger" : "border-border-input"}`}
            {...rest}
          />
          {suffix && <span aria-hidden className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-text-muted">{suffix}</span>}
        </div>
      )}
    </Field>
  );
}

export function SelectField({
  label, help, error, options, placeholder, ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string; help?: string; error?: string; options: readonly string[]; placeholder?: string }) {
  return (
    <Field label={label} help={help} error={error}>
      {({ id, describedBy, invalid }) => (
        <select
          id={id}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          className={`${control} ${invalid ? "border-danger" : "border-border-input"}`}
          {...rest}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      )}
    </Field>
  );
}

export function Checkbox({
  label, error, ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label: ReactNode; error?: string }) {
  const id = useId();
  return (
    <div>
      <div className="flex items-start gap-3">
        <input id={id} type="checkbox" className="mt-1 size-5 shrink-0 accent-accent" aria-invalid={!!error || undefined} {...rest} />
        <label htmlFor={id} className="text-sm">{label}</label>
      </div>
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
}
