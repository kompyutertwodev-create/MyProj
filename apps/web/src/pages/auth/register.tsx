import { useState } from 'react';
import Link from 'next/link';
import { ApiClientError, apiClient } from '@workspace/platform-client';
import { AuthCard, FormField, SubmitButton, preventDefault } from '../../components/AuthCard';

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(false);

  async function submit(): Promise<void> {
    setBusy(true);
    setError('');
    try {
      await apiClient.post('/v1/auth/register', { email, password, displayName });
      setCreated(true);
    } catch (cause) {
      setError(
        cause instanceof ApiClientError ? cause.message : 'Registration failed. Please try again.'
      );
    } finally {
      setBusy(false);
    }
  }

  if (created) {
    return (
      <AuthCard
        title="Account created"
        subtitle="Your account is ready. Sign in to continue."
        footer={
          <>
            Already have an account? <Link href="/auth/login">Sign in</Link>
          </>
        }
      >
        <Link
          className="primary-button button-link"
          href={`/auth/login?email=${encodeURIComponent(email)}`}
        >
          Continue to sign in
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Start with a secure identity for every platform experience."
      footer={
        <>
          Already have an account? <Link href="/auth/login">Sign in</Link>
        </>
      }
    >
      <form
        className="auth-form"
        onSubmit={(event) => {
          preventDefault(event);
          void submit();
        }}
      >
        <FormField
          id="displayName"
          label="Display name"
          value={displayName}
          onChange={setDisplayName}
          autoComplete="name"
        />
        <FormField
          id="email"
          label="Email address"
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
        />
        <FormField
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
        />
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <SubmitButton busy={busy}>Create account</SubmitButton>
      </form>
    </AuthCard>
  );
}

export const getServerSideProps = () => ({
  props: {},
});
