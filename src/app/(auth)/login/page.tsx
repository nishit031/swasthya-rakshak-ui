"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, KeyRound, Smartphone } from "lucide-react";
import { storeTokens } from "@/backend/features/auth/auth.client";
import { apiUrl } from "@/backend/lib/api-url";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";
import { AuthShell } from "@/frontend/components/auth/AuthShell";
import { Button } from "@/frontend/components/ui/Button";
import { Input } from "@/frontend/components/ui/Field";
import { cn } from "@/frontend/components/ui/cn";

type Mode = "password" | "otp";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>("password");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function completeLogin(data: {
    accessToken: string;
    refreshToken: string;
    user: { role: string };
  }) {
    storeTokens(data.accessToken, data.refreshToken);
    router.push(
      data.user.role === "admin" ? "/admin" : data.user.role === "doctor" ? "/doctor" : "/dashboard"
    );
  }

  async function post(url: string, payload: object) {
    const res = await fetch(apiUrl(url), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return res.json();
  }

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const json = await post("/api/v1/auth/login", { phone, password });
      if (!json.success) return setError(json.message || "Login failed");
      completeLogin(json.data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const json = await post("/api/v1/auth/login/request-otp", { phone });
      if (!json.success) return setError(json.message || "Could not send OTP");
      setDevCode(json.data?.devCode ?? null);
      setOtpSent(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const json = await post("/api/v1/auth/login/verify-otp", { phone, otp });
      if (!json.success) return setError(json.message || "Verification failed");
      completeLogin(json.data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setOtp("");
    setOtpSent(false);
    setDevCode(null);
  }

  return (
    <AuthShell title={t("auth.login.title")} subtitle={t("auth.login.subtitle")}>
      {/* Mode tabs */}
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
        <TabButton
          active={mode === "password"}
          onClick={() => switchMode("password")}
          icon={KeyRound}
        >
          {t("auth.login.withPassword")}
        </TabButton>
        <TabButton active={mode === "otp"} onClick={() => switchMode("otp")} icon={Smartphone}>
          {t("auth.login.withOtp")}
        </TabButton>
      </div>

      {error && <ErrorBanner>{error}</ErrorBanner>}

      {mode === "password" && (
        <form onSubmit={handlePasswordLogin} className="flex flex-col gap-4">
          <Input
            id="phone"
            label={t("auth.login.phone")}
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            maxLength={10}
            placeholder="10-digit mobile number"
          />
          <Input
            id="password"
            label={t("auth.login.password")}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter your password"
          />
          <Button type="submit" disabled={loading} size="lg" className="w-full">
            {loading ? "Signing in…" : t("auth.login.submit")} <ArrowRight size={18} />
          </Button>
        </form>
      )}

      {mode === "otp" && !otpSent && (
        <form onSubmit={handleRequestOtp} className="flex flex-col gap-4">
          <Input
            id="phone-otp"
            label={t("auth.login.phone")}
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            maxLength={10}
            placeholder="10-digit mobile number"
          />
          <Button type="submit" disabled={loading} size="lg" className="w-full">
            {loading ? "Sending OTP…" : t("auth.login.sendOtp")} <ArrowRight size={18} />
          </Button>
        </form>
      )}

      {mode === "otp" && otpSent && (
        <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
          <div className="flex items-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2.5 text-sm text-primary-700 dark:border-primary-800 dark:bg-primary-900/30 dark:text-primary-300">
            <Smartphone size={16} />
            <span>
              Code sent to <strong>{phone}</strong>
            </span>
          </div>
          {devCode && (
            <div className="rounded-lg border border-warning-300 bg-warning-50 px-3 py-2 text-sm text-warning-800 dark:border-warning-800 dark:bg-warning-900/30 dark:text-warning-300">
              🧪 Dev code: <strong>{devCode}</strong>
            </div>
          )}
          <Input
            id="otp"
            label={t("auth.login.otp")}
            inputMode="numeric"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
            maxLength={6}
            placeholder="6-digit code"
            className="text-center text-xl font-bold tracking-[0.3em]"
          />
          <Button type="submit" disabled={loading} size="lg" className="w-full">
            {loading ? "Verifying…" : t("auth.login.submit")} <ArrowRight size={18} />
          </Button>
          <button
            type="button"
            onClick={() => {
              setOtpSent(false);
              setOtp("");
            }}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ← Change number
          </button>
        </form>
      )}

      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        {t("auth.login.noAccount")}{" "}
        <Link
          href="/register"
          className="font-semibold text-primary-600 hover:underline dark:text-primary-400"
        >
          {t("auth.login.registerLink")}
        </Link>
      </p>
      <p className="text-center text-sm text-gray-500 dark:text-gray-500">
        {t("auth.login.doctorPrompt")}{" "}
        <Link
          href="/doctor/register"
          className="font-semibold text-primary-600 hover:underline dark:text-primary-400"
        >
          {t("auth.login.doctorLink")}
        </Link>
      </p>
    </AuthShell>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  children
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof KeyRound;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-white text-primary-600 shadow-sm dark:bg-gray-900 dark:text-primary-400"
          : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      )}
    >
      <Icon size={16} />
      {children}
    </button>
  );
}

function ErrorBanner({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 rounded-lg border border-error-200 bg-error-50 px-3 py-2.5 text-sm text-error-700 dark:border-error-800 dark:bg-error-900/30 dark:text-error-300"
    >
      <span>⚠️</span> {children}
    </motion.div>
  );
}
