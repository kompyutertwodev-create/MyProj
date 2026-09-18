import type { FormEvent, ReactNode } from 'react';
import Link from 'next/link';

interface AuthCardProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <main className="auth-shell">
      <section className="auth-card" aria-labelledby="auth-title">
        <Link className="brand-mark" href="/">
          IdentityPlatform
        </Link>
        <div className="auth-heading">
          <h1 id="auth-title">{title}</h1>
          <p>{subtitle}</p>
        </div>
        {children}
        <div className="auth-footer">{footer}</div>
      </section>
    </main>
  );
}

export function FormField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  autoComplete,
  required = true,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(event) => onChange((event.target as unknown as { value: string }).value)}
        autoComplete={autoComplete}
        required={required}
      />
    </label>
  );
}

export function SubmitButton({ busy, children }: { busy: boolean; children: ReactNode }) {
  return (
    <button className="primary-button" type="submit" disabled={busy}>
      {busy ? 'Please wait…' : children}
    </button>
  );
}

export function preventDefault(event: FormEvent<HTMLFormElement>): void {
  event.preventDefault();
}
