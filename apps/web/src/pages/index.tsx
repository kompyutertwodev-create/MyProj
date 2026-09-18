import { StatusPage } from '../components/StatusPage';

export default function HomePage() {
  return (
    <StatusPage
      title="Identity-first access for enterprise platforms"
      description="The web composition root is ready for the IAM flows and bounded-context modules."
    />
  );
}

export const getServerSideProps = () => ({
  props: {},
});
