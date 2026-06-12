import { Navigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";
import { useAuth } from "../../context/AuthContext";
import { getRoleSlug } from "../../services/roleUtils";

export default function SignIn() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return <Navigate to={`/${getRoleSlug(user.role)}`} replace />;
  }

  return (
    <>
      <PageMeta
        title="Sign In | SIMAK"
        description="Halaman masuk SIMAK (Sistem Informasi Manajemen Akademik) Sekolah."
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
