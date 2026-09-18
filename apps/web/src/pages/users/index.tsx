import { StatusPage } from '../../components/StatusPage';

export default function UsersPage() {
  return <StatusPage title="Users" description="User management will be available soon." />;
}

export const getServerSideProps = () => ({
  props: {},
});
