import Link from 'next/link';

interface StatusPageProps {
  title: string;
  description: string;
}

export function StatusPage({ title, description }: StatusPageProps) {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '2rem',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <section style={{ maxWidth: 640 }}>
        <p style={{ color: '#667085', marginBottom: '0.5rem' }}>IdentityPlatform</p>
        <h1 style={{ margin: 0 }}>{title}</h1>
        <p style={{ color: '#475467', lineHeight: 1.6 }}>{description}</p>
        <nav style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link href="/">Home</Link>
          <Link href="/auth/login">Sign in</Link>
          <Link href="/auth/register">Create account</Link>
        </nav>
      </section>
    </main>
  );
}
