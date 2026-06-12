import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignUpForm from "../../components/auth/SignUpForm";

export default function SignUp() {
  return (
    <>
      <PageMeta
        title="Sign Up | SIMAK"
        description="Halaman pendaftaran SIMAK (Sistem Informasi Manajemen Akademik) Sekolah."
      />
      <AuthLayout>
        <SignUpForm />
      </AuthLayout>
    </>
  );
}
