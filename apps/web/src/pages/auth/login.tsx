import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  ApiClientError,
  apiClient,
  authSession,
  type AuthSession,
} from '@workspace/platform-client';
import { AuthCard, FormField, SubmitButton, preventDefault } from '../../components/AuthCard';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof router.query.email === 'string') setEmail(router.query.email);
  }, [router.query.email]);

  async function submit(): Promise<void> {
    setBusy(true);
    setError('');
    try {
      const session = await apiClient.post<AuthSession>('/v1/auth/login', {
        email,
        password,
        deviceInfo: {
          deviceId: getDeviceId(),
          deviceName: 'Web browser',
          deviceType: 'web',
          ipAddress: 'browser',
          userAgent: navigator.userAgent,
        },
      });
      authSession.set(session);
      await router.push('/dashboard');
    } catch (cause) {
      setError(
        cause instanceof ApiClientError ? cause.message : 'Sign in failed. Please try again.'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to manage your IdentityPlatform account."
      footer={
        <>
          New here? <Link href="/auth/register">Create an account</Link>
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
          autoComplete="current-password"
        />
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <SubmitButton busy={busy}>Sign in</SubmitButton>
      </form>
    </AuthCard>
  );
}

export const getServerSideProps = () => ({
  props: {},
});

function getDeviceId(): string {
  const key = 'identity-platform.device-id';
  const runtime = globalThis as typeof globalThis & {
    localStorage?: {
      getItem(key: string): string | null;
      setItem(key: string, value: string): void;
    };
    crypto?: { randomUUID(): string };
  };
  const storage = runtime.localStorage;
  const existing = storage?.getItem(key);
  if (existing) return existing;
  const id =
    runtime.crypto?.randomUUID() ?? `web-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  storage?.setItem(key, id);
  return id;
}
