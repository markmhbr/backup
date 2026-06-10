import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { useAuth } from "../../context/AuthContext";
import { QRCodeSVG } from "qrcode.react";
import { Modal } from "../ui/modal";
import { getRoleSlug } from "../../services/roleUtils";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [is2FASetup, setIs2FASetup] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [setupSecret, setSetupSecret] = useState("");
  const [tempToken, setTempToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login, verify2FA, setAuthData } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await login(username, password);

      if (result.requires2FA) {
        setTempToken(result.tempToken || "");
        setIs2FASetup(result.is2FASetup ?? true);
        if (result.is2FASetup === false) {
          setQrCodeUrl(result.qrCodeUrl || "");
          setSetupSecret(result.secret || "");
        }
        setIs2FAModalOpen(true);
      } else if (result.accessToken && result.user) {
        localStorage.setItem("auth_token", result.accessToken);
        localStorage.setItem("user_data", JSON.stringify(result.user));
        setAuthData(result.user);
        navigate(`/${getRoleSlug(result.user.role)}`);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Login gagal. Periksa kembali username dan password Anda."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await verify2FA(tempToken, otp, !is2FASetup ? setupSecret : undefined);
      setIs2FAModalOpen(false);
      
      // Get role from user data in localStorage
      const savedUser = localStorage.getItem('user_data');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        navigate(`/${getRoleSlug(user.role)}`);
      } else {
        navigate("/");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Kode 2FA tidak valid.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign In
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your username and password to sign in!
            </p>
          </div>

          {error && !is2FAModalOpen && (
            <div className="p-3 mb-6 text-sm text-red-500 bg-red-100 rounded-lg dark:bg-red-500/10">
              {error}
            </div>
          )}

          <div>
            <form onSubmit={handleLogin}>
              <div className="space-y-6">
                <div>
                  <Label>
                    Username <span className="text-error-500">*</span>{" "}
                  </Label>
                  <Input
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label>
                    Password <span className="text-error-500">*</span>{" "}
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Link
                    to="/reset-password"
                    className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div>
                  <Button
                    className="w-full"
                    size="sm"
                    disabled={loading}
                    type="submit"
                  >
                    {loading ? "Processing..." : "Sign In"}
                  </Button>
                </div>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Don&apos;t have an account? {""}
                <Link
                  to="/signup"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Sign Up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2FA Modal */}
      <Modal
        isOpen={is2FAModalOpen}
        onClose={() => setIs2FAModalOpen(false)}
        className="max-w-[450px] p-6 sm:p-10"
      >
        <div className="text-center">
          <h2 className="mb-2 text-xl font-semibold text-gray-800 dark:text-white/90 sm:text-2xl">
            {is2FASetup ? "Verifikasi 2FA" : "Setup 2FA"}
          </h2>
          <p className="mb-8 text-sm text-gray-500 dark:text-gray-400">
            {is2FASetup
              ? "Masukkan 6 digit kode dari aplikasi authenticator Anda"
              : "Scan QR Code di bawah dengan aplikasi Google Authenticator/Authy"}
          </p>

          {error && is2FAModalOpen && (
            <div className="p-3 mb-6 text-sm text-red-500 bg-red-100 rounded-lg dark:bg-red-500/10">
              {error}
            </div>
          )}

          <form onSubmit={handleVerify2FA}>
            <div className="space-y-6 text-left">
              {!is2FASetup && (
                <div className="flex flex-col items-center space-y-4">
                  <div className="p-4 bg-white border-2 border-gray-200 border-dashed rounded-2xl dark:border-gray-600">
                    <QRCodeSVG value={qrCodeUrl} size={200} />
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-1">
                      Backup Key
                    </p>
                    <code className="px-3 py-1 font-mono text-sm font-bold text-blue-600 bg-gray-100 rounded-lg dark:bg-gray-700 dark:text-blue-400">
                      {setupSecret}
                    </code>
                  </div>
                </div>
              )}
              <div>
                <Label>
                  6-Digit Kode Keamanan{" "}
                  <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  maxLength={6}
                  required
                  className="text-2xl tracking-[0.5em] text-center font-bold"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={() => setIs2FAModalOpen(false)}
                  variant="outline"
                  className="w-full"
                >
                  Batal
                </Button>
                <Button disabled={loading} type="submit" className="w-full">
                  {loading ? "Verifikasi..." : "Verifikasi"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
