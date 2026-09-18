import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { authSession } from '@workspace/platform-client';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    void authSession.logout().finally(() => router.replace('/auth/login'));
  }, [router]);

  return (
    <main className="center-page">
      <p>Signing you out…</p>
    </main>
  );
}

export const getServerSideProps = () => ({
  props: {},
});
