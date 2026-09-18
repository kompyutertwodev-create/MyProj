import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { authSession, type AuthUser } from '@workspace/platform-client';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const session = authSession.get();
    if (!session) {
      void router.replace('/auth/login');
      return;
    }
    setUser(session.user);
  }, [router]);

  if (!user)
    return (
      <main className="center-page">
        <p>Loading your dashboard…</p>
      </main>
    );

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <Link className="brand-mark" href="/">
          IdentityPlatform
        </Link>
        <Link className="text-button" href="/auth/logout">
          Sign out
        </Link>
      </header>
      <section className="dashboard-content">
        <p className="eyebrow">Identity center</p>
        <h1>Good to see you, {user.displayName}.</h1>
        <p className="muted">{user.email}</p>
        <div className="identity-panel">
          <span className="avatar">{user.displayName.charAt(0).toUpperCase()}</span>
          <div>
            <strong>{user.displayName}</strong>
            <p className="muted">Account status: {user.status}</p>
          </div>
        </div>
      </section>
    </main>
  );
}

export const getServerSideProps = () => ({
  props: {},
});
