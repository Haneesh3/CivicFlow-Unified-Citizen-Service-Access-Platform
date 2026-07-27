import LoginForm from '@/app/(auth)/login/components/LoginForm';

export default function CitizenLoginPage() {
  return <LoginForm roleRedirect={{ ADMIN: '/admin/dashboard', OFFICER: '/admin/dashboard', STAFF: '/admin/dashboard', CITIZEN: '/' }} />;
}
